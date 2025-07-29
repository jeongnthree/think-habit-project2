import { JournalPhoto } from "../types/journal";

// 이미지 메타데이터 추출
export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  colorDepth?: number;
  hasAlpha?: boolean;
}

export const extractImageMetadata = (file: File): Promise<ImageMetadata> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    img.onload = () => {
      const { width, height } = img;
      const aspectRatio = width / height;

      if (context) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(img, 0, 0);

        try {
          const imageData = context.getImageData(0, 0, width, height);
          const data = imageData.data;

          // 알파 채널 확인
          let hasAlpha = false;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
              hasAlpha = true;
              break;
            }
          }

          resolve({
            width,
            height,
            aspectRatio,
            colorDepth: 8, // 일반적으로 8비트
            hasAlpha,
          });
        } catch (error) {
          resolve({
            width,
            height,
            aspectRatio,
          });
        }
      } else {
        resolve({
          width,
          height,
          aspectRatio,
        });
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지 메타데이터 추출에 실패했습니다."));
    };

    img.src = URL.createObjectURL(file);
  });
};

// 이미지 리사이징
export const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.9,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    img.onload = () => {
      let { width, height } = img;

      // 비율 유지하면서 리사이징
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      if (context) {
        // 고품질 리사이징을 위한 설정
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        context.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("이미지 리사이징에 실패했습니다."));
            }
          },
          "image/jpeg",
          quality,
        );
      } else {
        reject(new Error("Canvas context를 가져올 수 없습니다."));
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지 로드에 실패했습니다."));
    };

    img.src = URL.createObjectURL(file);
  });
};

// 이미지 회전
export const rotateImage = (
  file: File,
  degrees: number,
  quality: number = 0.9,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    img.onload = () => {
      const { width, height } = img;

      // 90도 또는 270도 회전 시 캔버스 크기 변경
      if (degrees === 90 || degrees === 270) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      if (context) {
        // 회전 중심점을 캔버스 중앙으로 이동
        context.translate(canvas.width / 2, canvas.height / 2);

        // 회전 적용
        context.rotate((degrees * Math.PI) / 180);

        // 이미지 그리기 (중심점 기준)
        context.drawImage(img, -width / 2, -height / 2);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const rotatedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(rotatedFile);
            } else {
              reject(new Error("이미지 회전에 실패했습니다."));
            }
          },
          "image/jpeg",
          quality,
        );
      } else {
        reject(new Error("Canvas context를 가져올 수 없습니다."));
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지 로드에 실패했습니다."));
    };

    img.src = URL.createObjectURL(file);
  });
};

// 이미지 크롭
export const cropImage = (
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  quality: number = 0.9,
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      if (context) {
        context.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height,
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            } else {
              reject(new Error("이미지 크롭에 실패했습니다."));
            }
          },
          "image/jpeg",
          quality,
        );
      } else {
        reject(new Error("Canvas context를 가져올 수 없습니다."));
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("이미지 로드에 실패했습니다."));
    };

    img.src = URL.createObjectURL(file);
  });
};

// 사진 정렬 유틸리티
export const sortPhotosByDate = (
  photos: JournalPhoto[],
  ascending: boolean = false,
): JournalPhoto[] => {
  return [...photos].sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const sortPhotosBySize = (
  photos: JournalPhoto[],
  ascending: boolean = false,
): JournalPhoto[] => {
  return [...photos].sort((a, b) => {
    return ascending ? a.size - b.size : b.size - a.size;
  });
};

export const sortPhotosByName = (
  photos: JournalPhoto[],
  ascending: boolean = true,
): JournalPhoto[] => {
  return [...photos].sort((a, b) => {
    const nameA = a.originalName.toLowerCase();
    const nameB = b.originalName.toLowerCase();
    if (ascending) {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
};

// 사진 필터링 유틸리티
export const filterPhotosByType = (
  photos: JournalPhoto[],
  mimeType: string,
): JournalPhoto[] => {
  return photos.filter((photo) => photo.mimeType === mimeType);
};

export const filterPhotosBySize = (
  photos: JournalPhoto[],
  minSize?: number,
  maxSize?: number,
): JournalPhoto[] => {
  return photos.filter((photo) => {
    if (minSize && photo.size < minSize) return false;
    if (maxSize && photo.size > maxSize) return false;
    return true;
  });
};

export const filterPhotosByDateRange = (
  photos: JournalPhoto[],
  startDate?: Date,
  endDate?: Date,
): JournalPhoto[] => {
  return photos.filter((photo) => {
    const photoDate = new Date(photo.uploadedAt);
    if (startDate && photoDate < startDate) return false;
    if (endDate && photoDate > endDate) return false;
    return true;
  });
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// 이미지 형식 검증
export const isValidImageType = (mimeType: string): boolean => {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return validTypes.includes(mimeType.toLowerCase());
};

// 이미지 품질 분석
export const analyzeImageQuality = async (
  file: File,
): Promise<{
  isHighQuality: boolean;
  resolution: "low" | "medium" | "high" | "ultra";
  fileSize: "small" | "medium" | "large";
  recommendations: string[];
}> => {
  try {
    const metadata = await extractImageMetadata(file);
    const { width, height } = metadata;
    const totalPixels = width * height;
    const fileSizeMB = file.size / (1024 * 1024);

    // 해상도 분류
    let resolution: "low" | "medium" | "high" | "ultra";
    if (totalPixels < 500000) {
      // 0.5MP 미만
      resolution = "low";
    } else if (totalPixels < 2000000) {
      // 2MP 미만
      resolution = "medium";
    } else if (totalPixels < 8000000) {
      // 8MP 미만
      resolution = "high";
    } else {
      resolution = "ultra";
    }

    // 파일 크기 분류
    let fileSize: "small" | "medium" | "large";
    if (fileSizeMB < 1) {
      fileSize = "small";
    } else if (fileSizeMB < 5) {
      fileSize = "medium";
    } else {
      fileSize = "large";
    }

    // 품질 판단
    const isHighQuality = resolution !== "low" && fileSize !== "small";

    // 권장사항 생성
    const recommendations: string[] = [];

    if (resolution === "low") {
      recommendations.push(
        "해상도가 낮습니다. 더 높은 해상도의 이미지를 사용하는 것을 권장합니다.",
      );
    }

    if (fileSize === "large") {
      recommendations.push("파일 크기가 큽니다. 압축을 고려해보세요.");
    }

    if (metadata.aspectRatio < 0.5 || metadata.aspectRatio > 2) {
      recommendations.push("비율이 극단적입니다. 크롭을 고려해보세요.");
    }

    return {
      isHighQuality,
      resolution,
      fileSize,
      recommendations,
    };
  } catch (error) {
    console.error("Image quality analysis failed:", error);
    return {
      isHighQuality: false,
      resolution: "low",
      fileSize: "small",
      recommendations: ["이미지 분석에 실패했습니다."],
    };
  }
};

// 배치 처리 유틸리티
export const batchProcessImages = async (
  files: File[],
  processor: (file: File) => Promise<File>,
  onProgress?: (completed: number, total: number) => void,
): Promise<File[]> => {
  const results: File[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const processedFile = await processor(files[i]);
      results.push(processedFile);
    } catch (error) {
      console.error(`Failed to process file ${files[i].name}:`, error);
      // 원본 파일을 결과에 추가 (처리 실패 시)
      results.push(files[i]);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
};
