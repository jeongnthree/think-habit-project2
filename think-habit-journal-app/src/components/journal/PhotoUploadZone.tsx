// components/journal/PhotoUploadZone.tsx
// 드래그 앤 드롭 사진 업로드 영역 컴포넌트

"use client";

import { cn } from "@/utils";
import {
  compressMultipleImages,
  validateImageFile,
} from "@/utils/image-processing";
import {
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useState } from "react";

// react-dropzone 타입 정의 (실제로는 npm install react-dropzone 필요)
interface DropzoneState {
  isDragActive: boolean;
  isDragReject: boolean;
  isDragAccept: boolean;
}

interface DropzoneProps {
  children: React.ReactNode;
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
}

// 간단한 dropzone 훅 구현 (실제로는 react-dropzone 사용)
function useDropzone({
  onDrop,
  accept,
  multiple = true,
  maxFiles,
  disabled,
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setIsDragReject(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      setIsDragReject(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        onDrop(imageFiles);
      }
    },
    [onDrop, disabled],
  );

  const getInputProps = () => ({
    type: "file" as const,
    multiple,
    accept: "image/*",
    style: { display: "none" },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onDrop(files);
      }
    },
  });

  const getRootProps = () => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject: false,
    isDragAccept: isDragActive,
  };
}

interface PhotoUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // MB
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  autoCompress?: boolean;
  acceptedFormats?: string[];
}

export const PhotoUploadZone: React.FC<PhotoUploadZoneProps> = ({
  onFilesSelected,
  maxFiles = 20,
  maxSizePerFile = 10,
  className,
  disabled = false,
  showPreview = true,
  autoCompress = true,
  acceptedFormats = ["JPEG", "PNG", "WebP"],
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setErrors([]);
      setIsProcessing(true);
      setUploadProgress(0);

      try {
        // 파일 검증
        const validFiles: File[] = [];
        const newErrors: string[] = [];

        for (const file of acceptedFiles) {
          const validation = validateImageFile(file);

          if (!validation.isValid) {
            newErrors.push(`${file.name}: ${validation.error}`);
            continue;
          }

          if (file.size > maxSizePerFile * 1024 * 1024) {
            newErrors.push(
              `${file.name}: 파일 크기가 ${maxSizePerFile}MB를 초과합니다`,
            );
            continue;
          }

          validFiles.push(file);
        }

        if (validFiles.length > maxFiles) {
          newErrors.push(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`);
          validFiles.splice(maxFiles);
        }

        if (newErrors.length > 0) {
          setErrors(newErrors);
        }

        if (validFiles.length === 0) {
          setIsProcessing(false);
          return;
        }

        // 이미지 압축 (옵션이 활성화된 경우)
        let processedFiles = validFiles;

        if (autoCompress) {
          processedFiles = await compressMultipleImages(
            validFiles,
            {
              maxSizeMB: maxSizePerFile * 0.7, // 70% 크기로 압축
              quality: 0.8,
            },
            (progress) => setUploadProgress(progress),
          );
        }

        onFilesSelected(processedFiles);
      } catch (error) {
        console.error("File processing error:", error);
        setErrors(["파일 처리 중 오류가 발생했습니다"]);
      } finally {
        setIsProcessing(false);
        setUploadProgress(0);
      }
    },
    [onFilesSelected, maxFiles, maxSizePerFile, autoCompress],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isDragAccept,
  } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
    maxFiles,
    disabled: disabled || isProcessing,
    children: null,
  });

  return (
    <div className={cn("w-full", className)}>
      {/* 업로드 영역 */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",

          // 기본 상태
          "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50",

          // 드래그 상태
          isDragActive && "border-purple-500 bg-purple-100 scale-105",
          isDragAccept && "border-green-500 bg-green-50",
          isDragReject && "border-red-500 bg-red-50",

          // 비활성화 상태
          (disabled || isProcessing) &&
            "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        <input {...getInputProps()} />

        {/* 로딩 상태 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-xl">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
            <p className="text-sm text-purple-600 font-medium">
              {autoCompress ? "이미지 압축 중..." : "파일 처리 중..."}
            </p>
            {uploadProgress > 0 && (
              <div className="w-32 h-1 bg-purple-200 rounded-full mt-2">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* 업로드 아이콘 */}
        <div
          className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors",
            isDragActive
              ? "bg-purple-200 text-purple-600"
              : "bg-gray-200 text-gray-500",
          )}
        >
          {isDragActive ? (
            <Upload className="w-8 h-8" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </div>

        {/* 메인 텍스트 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isDragActive ? "여기에 놓으세요!" : "사진을 업로드하세요"}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {isDragActive
            ? "파일을 드롭하여 업로드합니다"
            : "드래그 앤 드롭하거나 클릭하여 파일을 선택하세요"}
        </p>

        {/* 업로드 정보 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>지원 형식: {acceptedFormats.join(", ")}</p>
          <p>
            최대 {maxFiles}개 파일, 파일당 최대 {maxSizePerFile}MB
          </p>
          {autoCompress && (
            <p className="text-purple-600">✨ 자동 압축으로 최적화됩니다</p>
          )}
        </div>

        {/* 추가 버튼 */}
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          파일 선택
        </button>
      </div>

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
              <button
                onClick={() =>
                  setErrors((prev) => prev.filter((_, i) => i !== index))
                }
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          💡 사진 업로드 팁
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 고화질 사진일수록 훈련 기록이 생생해집니다</li>
          <li>• 여러 각도의 사진으로 진행 과정을 기록하세요</li>
          <li>• 압축으로 용량이 최적화되니 원본 화질을 업로드하세요</li>
          <li>• 개인정보가 포함된 사진은 업로드 전 확인해주세요</li>
        </ul>
      </div>
    </div>
  );
};
