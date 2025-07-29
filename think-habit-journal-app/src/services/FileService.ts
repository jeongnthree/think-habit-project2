import { ipcRenderer } from "electron";
import fs from "fs/promises";
import path from "path";
import { JournalPhoto } from "../types/journal";

interface FileUploadOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[];
  quality?: number; // 0-1 for compression
}

interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
}

class FileService {
  private readonly PHOTOS_DIR = "journal-photos";
  private readonly THUMBNAILS_DIR = "thumbnails";
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  constructor() {
    this.initializeDirectories();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      const userDataPath = await ipcRenderer.invoke("get-user-data-path");
      const photosPath = path.join(userDataPath, this.PHOTOS_DIR);
      const thumbnailsPath = path.join(userDataPath, this.THUMBNAILS_DIR);

      await fs.mkdir(photosPath, { recursive: true });
      await fs.mkdir(thumbnailsPath, { recursive: true });
    } catch (error) {
      console.error("Failed to initialize directories:", error);
    }
  }

  async selectPhotosFromFileSystem(): Promise<File[]> {
    try {
      const result = await ipcRenderer.invoke("show-open-dialog", {
        properties: ["openFile", "multiSelections"],
        filters: [
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "webp", "gif"],
          },
        ],
      });

      if (result.canceled || !result.filePaths) {
        return [];
      }

      const files: File[] = [];
      for (const filePath of result.filePaths) {
        const buffer = await fs.readFile(filePath);
        const fileName = path.basename(filePath);
        const mimeType = this.getMimeTypeFromExtension(path.extname(filePath));

        const file = new File([buffer], fileName, { type: mimeType });
        files.push(file);
      }

      return files;
    } catch (error) {
      console.error("Failed to select photos:", error);
      throw new Error("사진 선택에 실패했습니다.");
    }
  }

  async capturePhotoFromCamera(): Promise<File | null> {
    try {
      // 카메라 접근 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // 3초 후 자동 캡처 (실제로는 사용자 인터페이스에서 제어)
          setTimeout(() => {
            if (context) {
              context.drawImage(video, 0, 0);
              canvas.toBlob(
                (blob) => {
                  stream.getTracks().forEach((track) => track.stop());

                  if (blob) {
                    const file = new File([blob], `camera-${Date.now()}.jpg`, {
                      type: "image/jpeg",
                    });
                    resolve(file);
                  } else {
                    reject(new Error("사진 캡처에 실패했습니다."));
                  }
                },
                "image/jpeg",
                0.9,
              );
            }
          }, 100);
        };

        video.onerror = () => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("카메라 접근에 실패했습니다."));
        };
      });
    } catch (error) {
      console.error("Camera capture failed:", error);
      throw new Error("카메라를 사용할 수 없습니다.");
    }
  }

  async uploadPhoto(
    file: File,
    options: FileUploadOptions = {},
  ): Promise<JournalPhoto> {
    const {
      maxSize = this.MAX_FILE_SIZE,
      allowedTypes = this.ALLOWED_TYPES,
      quality = 0.9,
    } = options;

    // 파일 검증
    this.validateFile(file, maxSize, allowedTypes);

    try {
      const photoId = this.generatePhotoId();
      const fileExtension = this.getFileExtension(file.name);
      const fileName = `${photoId}${fileExtension}`;

      // 이미지 압축 및 최적화
      const optimizedFile = await this.optimizeImage(file, quality);

      // 파일 저장
      const filePath = await this.saveFile(optimizedFile, fileName);

      // 썸네일 생성
      const thumbnailPath = await this.generateThumbnail(
        optimizedFile,
        photoId,
      );

      const journalPhoto: JournalPhoto = {
        id: photoId,
        filename: fileName,
        originalName: file.name,
        path: filePath,
        size: optimizedFile.size,
        mimeType: optimizedFile.type,
        uploadedAt: new Date(),
      };

      return journalPhoto;
    } catch (error) {
      console.error("Photo upload failed:", error);
      throw new Error("사진 업로드에 실패했습니다.");
    }
  }

  async deletePhoto(photoId: string): Promise<void> {
    try {
      const userDataPath = await ipcRenderer.invoke("get-user-data-path");
      const photosPath = path.join(userDataPath, this.PHOTOS_DIR);
      const thumbnailsPath = path.join(userDataPath, this.THUMBNAILS_DIR);

      // 원본 파일 삭제
      const photoFiles = await fs.readdir(photosPath);
      const photoFile = photoFiles.find((file) => file.startsWith(photoId));
      if (photoFile) {
        await fs.unlink(path.join(photosPath, photoFile));
      }

      // 썸네일 삭제
      const thumbnailFiles = await fs.readdir(thumbnailsPath);
      const thumbnailFile = thumbnailFiles.find((file) =>
        file.startsWith(`thumb_${photoId}`),
      );
      if (thumbnailFile) {
        await fs.unlink(path.join(thumbnailsPath, thumbnailFile));
      }
    } catch (error) {
      console.error("Photo deletion failed:", error);
      throw new Error("사진 삭제에 실패했습니다.");
    }
  }

  async getPhotoPath(photoId: string): Promise<string | null> {
    try {
      const userDataPath = await ipcRenderer.invoke("get-user-data-path");
      const photosPath = path.join(userDataPath, this.PHOTOS_DIR);

      const files = await fs.readdir(photosPath);
      const photoFile = files.find((file) => file.startsWith(photoId));

      return photoFile ? path.join(photosPath, photoFile) : null;
    } catch (error) {
      console.error("Failed to get photo path:", error);
      return null;
    }
  }

  async getThumbnailPath(photoId: string): Promise<string | null> {
    try {
      const userDataPath = await ipcRenderer.invoke("get-user-data-path");
      const thumbnailsPath = path.join(userDataPath, this.THUMBNAILS_DIR);

      const files = await fs.readdir(thumbnailsPath);
      const thumbnailFile = files.find((file) =>
        file.startsWith(`thumb_${photoId}`),
      );

      return thumbnailFile ? path.join(thumbnailsPath, thumbnailFile) : null;
    } catch (error) {
      console.error("Failed to get thumbnail path:", error);
      return null;
    }
  }

  private validateFile(
    file: File,
    maxSize: number,
    allowedTypes: string[],
  ): void {
    if (file.size > maxSize) {
      throw new Error(
        `파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 업로드 가능합니다.`,
      );
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "지원하지 않는 파일 형식입니다. JPG, PNG, WebP, GIF 파일만 업로드 가능합니다.",
      );
    }
  }

  private async optimizeImage(file: File, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // 최대 크기 제한 (예: 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;

        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        if (context) {
          context.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                });
                resolve(optimizedFile);
              } else {
                reject(new Error("이미지 최적화에 실패했습니다."));
              }
            },
            "image/jpeg",
            quality,
          );
        }
      };

      img.onerror = () => reject(new Error("이미지 로드에 실패했습니다."));
      img.src = URL.createObjectURL(file);
    });
  }

  private async generateThumbnail(
    file: File,
    photoId: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const img = new Image();

      img.onload = async () => {
        const thumbnailSize = 200;
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;

        if (context) {
          // 정사각형 썸네일 생성 (크롭)
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          context.drawImage(
            img,
            x,
            y,
            size,
            size,
            0,
            0,
            thumbnailSize,
            thumbnailSize,
          );

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                try {
                  const thumbnailFile = new File(
                    [blob],
                    `thumb_${photoId}.jpg`,
                    {
                      type: "image/jpeg",
                    },
                  );
                  const thumbnailPath = await this.saveFile(
                    thumbnailFile,
                    `thumb_${photoId}.jpg`,
                    this.THUMBNAILS_DIR,
                  );
                  resolve(thumbnailPath);
                } catch (error) {
                  reject(error);
                }
              } else {
                reject(new Error("썸네일 생성에 실패했습니다."));
              }
            },
            "image/jpeg",
            0.8,
          );
        }
      };

      img.onerror = () =>
        reject(new Error("썸네일 이미지 로드에 실패했습니다."));
      img.src = URL.createObjectURL(file);
    });
  }

  private async saveFile(
    file: File,
    fileName: string,
    subDir: string = this.PHOTOS_DIR,
  ): Promise<string> {
    try {
      const userDataPath = await ipcRenderer.invoke("get-user-data-path");
      const targetDir = path.join(userDataPath, subDir);
      const filePath = path.join(targetDir, fileName);

      const buffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));

      return filePath;
    } catch (error) {
      console.error("File save failed:", error);
      throw new Error("파일 저장에 실패했습니다.");
    }
  }

  private generatePhotoId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileExtension(fileName: string): string {
    return path.extname(fileName).toLowerCase();
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    return mimeTypes[extension.toLowerCase()] || "image/jpeg";
  }

  // 파일 정리 (오래된 파일 삭제)
  async cleanupOldFiles(daysOld: number = 30): Promise<void> {
    try {
      const userDataPath = await ipcRenderer.invoke("get-user-data-path");
      const photosPath = path.join(userDataPath, this.PHOTOS_DIR);
      const thumbnailsPath = path.join(userDataPath, this.THUMBNAILS_DIR);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // 사진 폴더 정리
      await this.cleanupDirectory(photosPath, cutoffDate);

      // 썸네일 폴더 정리
      await this.cleanupDirectory(thumbnailsPath, cutoffDate);
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }

  private async cleanupDirectory(
    dirPath: string,
    cutoffDate: Date,
  ): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Deleted old file: ${file}`);
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup directory ${dirPath}:`, error);
    }
  }
}

// 싱글톤 인스턴스
export const fileService = new FileService();
export default FileService;
