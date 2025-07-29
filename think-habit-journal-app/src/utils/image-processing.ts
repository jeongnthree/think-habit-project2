// utils/image-processing.ts
// 이미지 압축, 리사이징, 처리를 위한 유틸리티 함수들

// browser-image-compression 타입 정의 (실제로는 npm install browser-image-compression 필요)
interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  initialQuality?: number;
}

// 이미지 압축 함수 (실제 구현에서는 browser-image-compression 사용)
async function imageCompression(
  file: File,
  options: CompressionOptions,
): Promise<File> {
  // 실제 구현에서는 browser-image-compression 라이브러리 사용
  // 여기서는 기본 구조만 제공
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const maxWidth = options.maxWidthOrHeight || 1920;
      const maxHeight = options.maxWidthOrHeight || 1920;

      let { width, height } = img;

      // 비율 유지하면서 리사이징
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        options.quality || 0.8,
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지 파일 압축
 */
export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {},
): Promise<File> {
  const {
    maxSizeMB = 5,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
  } = options;

  try {
    // 이미지가 이미 작다면 압축하지 않음
    if (file.size <= maxSizeMB * 1024 * 1024 * 0.5) {
      return file;
    }

    const compressionOptions: CompressionOptions = {
      maxSizeMB,
      maxWidthOrHeight: Math.max(maxWidth, maxHeight),
      useWebWorker: true,
      quality,
      initialQuality: quality,
    };

    const compressedFile = await imageCompression(file, compressionOptions);

    console.log(
      `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
    );

    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // 압축 실패 시 원본 반환
  }
}

/**
 * 이미지 썸네일 생성
 */
export async function generateThumbnail(
  file: File,
  size: number = 200,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;

      // 정사각형으로 크롭
      const minDimension = Math.min(img.width, img.height);
      const x = (img.width - minDimension) / 2;
      const y = (img.height - minDimension) / 2;

      ctx?.drawImage(img, x, y, minDimension, minDimension, 0, 0, size, size);

      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지 메타데이터 추출
 */
export async function extractImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        type: file.type,
        aspectRatio: img.width / img.height,
      });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지 파일 검증
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "JPEG, PNG, WebP 형식만 지원됩니다",
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: "파일 크기는 10MB를 초과할 수 없습니다",
    };
  }

  return { isValid: true };
}

/**
 * 다중 파일 일괄 압축
 */
export async function compressMultipleImages(
  files: File[],
  options?: Parameters<typeof compressImage>[1],
  onProgress?: (progress: number, current: number, total: number) => void,
): Promise<File[]> {
  const compressedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(((i + 1) / files.length) * 100, i + 1, files.length);

    try {
      const compressed = await compressImage(file, options);
      compressedFiles.push(compressed);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      compressedFiles.push(file); // 실패 시 원본 추가
    }
  }

  return compressedFiles;
}

/**
 * 이미지 URL을 File 객체로 변환
 */
export async function urlToFile(
  url: string,
  filename: string,
  mimeType: string = "image/jpeg",
): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
}

/**
 * Base64를 File 객체로 변환
 */
export function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string = "image/jpeg",
): File {
  const byteString = atob(base64.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([arrayBuffer], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * 이미지 배치 리사이징
 */
export async function batchResize(
  files: File[],
  targetWidth: number,
  targetHeight: number,
  onProgress?: (progress: number) => void,
): Promise<File[]> {
  const resizedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(((i + 1) / files.length) * 100);

    try {
      const resized = await compressImage(file, {
        maxWidth: targetWidth,
        maxHeight: targetHeight,
        quality: 0.9,
      });
      resizedFiles.push(resized);
    } catch (error) {
      console.error(`Failed to resize ${file.name}:`, error);
      resizedFiles.push(file);
    }
  }

  return resizedFiles;
}

/**
 * 이미지 EXIF 데이터 제거 (개인정보 보호)
 */
export async function removeExifData(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cleanFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(cleanFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.95,
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 지원되는 이미지 형식 확인
 */
export function getSupportedImageTypes(): string[] {
  return ["image/jpeg", "image/png", "image/webp"];
}

/**
 * 이미지 품질 분석
 */
export async function analyzeImageQuality(file: File): Promise<{
  resolution: "low" | "medium" | "high" | "ultra";
  fileSize: "small" | "medium" | "large" | "huge";
  compression: "low" | "medium" | "high";
  recommendation: string;
}> {
  const metadata = await extractImageMetadata(file);
  const pixels = metadata.width * metadata.height;

  // 해상도 분석
  let resolution: "low" | "medium" | "high" | "ultra";
  if (pixels < 500000) resolution = "low";
  else if (pixels < 2000000) resolution = "medium";
  else if (pixels < 8000000) resolution = "high";
  else resolution = "ultra";

  // 파일 크기 분석
  let fileSize: "small" | "medium" | "large" | "huge";
  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB < 1) fileSize = "small";
  else if (sizeMB < 3) fileSize = "medium";
  else if (sizeMB < 8) fileSize = "large";
  else fileSize = "huge";

  // 압축률 추정
  const bytesPerPixel = file.size / pixels;
  let compression: "low" | "medium" | "high";
  if (bytesPerPixel > 2) compression = "low";
  else if (bytesPerPixel > 1) compression = "medium";
  else compression = "high";

  // 추천 사항
  let recommendation = "";
  if (fileSize === "huge") {
    recommendation = "파일 크기가 큽니다. 압축을 권장합니다.";
  } else if (resolution === "ultra" && fileSize === "large") {
    recommendation =
      "고해상도 이미지입니다. 웹에서 사용할 경우 리사이징을 권장합니다.";
  } else {
    recommendation = "적절한 크기와 품질입니다.";
  }

  return { resolution, fileSize, compression, recommendation };
}
