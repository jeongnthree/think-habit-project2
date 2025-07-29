import React, { useCallback, useRef, useState } from "react";
import { fileService } from "../../services/FileService";
import { JournalPhoto } from "../../types/journal";
import "./PhotoUploader.css";

interface PhotoUploaderProps {
  photos: JournalPhoto[];
  onPhotosChange: (photos: JournalPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      if (disabled || isUploading) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxPhotos - photos.length;

      if (fileArray.length > remainingSlots) {
        alert(
          `최대 ${maxPhotos}개의 사진만 업로드할 수 있습니다. ${remainingSlots}개만 선택해주세요.`,
        );
        return;
      }

      setIsUploading(true);
      const newPhotos: JournalPhoto[] = [];

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          const progressKey = `${file.name}_${Date.now()}`;

          setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

          try {
            const photo = await fileService.uploadPhoto(file);
            newPhotos.push(photo);

            setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            alert(
              `${file.name} 업로드에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
            );
          }

          // 진행률 업데이트 시뮬레이션
          for (let progress = 0; progress <= 100; progress += 20) {
            setUploadProgress((prev) => ({ ...prev, [progressKey]: progress }));
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        if (newPhotos.length > 0) {
          onPhotosChange([...photos, ...newPhotos]);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress({});
      }
    },
    [photos, onPhotosChange, maxPhotos, disabled, isUploading],
  );

  // 파일 시스템에서 선택
  const handleFileSystemSelect = useCallback(async () => {
    try {
      const selectedFiles = await fileService.selectPhotosFromFileSystem();
      if (selectedFiles.length > 0) {
        await handleFileSelect(selectedFiles);
      }
    } catch (error) {
      console.error("File selection failed:", error);
      alert("파일 선택에 실패했습니다.");
    }
  }, [handleFileSelect]);

  // 카메라 캡처
  const handleCameraCapture = useCallback(async () => {
    if (photos.length >= maxPhotos) {
      alert(`최대 ${maxPhotos}개의 사진만 업로드할 수 있습니다.`);
      return;
    }

    try {
      const capturedFile = await fileService.capturePhotoFromCamera();
      if (capturedFile) {
        await handleFileSelect([capturedFile]);
      }
    } catch (error) {
      console.error("Camera capture failed:", error);
      alert("카메라 사용에 실패했습니다.");
    }
  }, [photos.length, maxPhotos, handleFileSelect]);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isUploading) {
        setDragOver(true);
      }
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        await handleFileSelect(files);
      }
    },
    [disabled, isUploading, handleFileSelect],
  );

  // 사진 삭제
  const handlePhotoDelete = useCallback(
    async (photoId: string) => {
      if (disabled) return;

      try {
        await fileService.deletePhoto(photoId);
        onPhotosChange(photos.filter((photo) => photo.id !== photoId));
      } catch (error) {
        console.error("Photo deletion failed:", error);
        alert("사진 삭제에 실패했습니다.");
      }
    },
    [photos, onPhotosChange, disabled],
  );

  // 사진 순서 변경
  const handlePhotoReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (disabled) return;

      const newPhotos = [...photos];
      const [movedPhoto] = newPhotos.splice(fromIndex, 1);
      newPhotos.splice(toIndex, 0, movedPhoto);
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange, disabled],
  );

  return (
    <div className="photo-uploader">
      {/* 업로드 영역 */}
      <div
        className={`upload-area ${dragOver ? "drag-over" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-spinner"></div>
            <p>사진을 업로드하고 있습니다...</p>
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <div key={key} className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📷</div>
            <h3>사진 추가</h3>
            <p>
              {photos.length === 0
                ? "사진을 드래그하여 놓거나 아래 버튼을 클릭하세요"
                : `${photos.length}/${maxPhotos}개 사진 추가됨`}
            </p>

            <div className="upload-buttons">
              <button
                onClick={handleFileSystemSelect}
                disabled={disabled || photos.length >= maxPhotos}
                className="upload-button primary"
              >
                📁 파일 선택
              </button>

              <button
                onClick={handleCameraCapture}
                disabled={disabled || photos.length >= maxPhotos}
                className="upload-button secondary"
              >
                📸 카메라
              </button>
            </div>

            {photos.length >= maxPhotos && (
              <p className="max-photos-warning">
                최대 {maxPhotos}개의 사진까지 업로드할 수 있습니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 사진 미리보기 그리드 */}
      {photos.length > 0 && (
        <div className="photos-grid">
          {photos.map((photo, index) => (
            <PhotoPreview
              key={photo.id}
              photo={photo}
              index={index}
              onDelete={() => handlePhotoDelete(photo.id)}
              onReorder={handlePhotoReorder}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(e.target.files);
          }
        }}
      />
    </div>
  );
};

// 사진 미리보기 컴포넌트
interface PhotoPreviewProps {
  photo: JournalPhoto;
  index: number;
  onDelete: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photo,
  index,
  onDelete,
  onReorder,
  disabled = false,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // 이미지 URL 로드
  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const thumbnailPath = await fileService.getThumbnailPath(photo.id);
        if (thumbnailPath) {
          setImageUrl(`file://${thumbnailPath}`);
        } else {
          const photoPath = await fileService.getPhotoPath(photo.id);
          if (photoPath) {
            setImageUrl(`file://${photoPath}`);
          }
        }
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    };

    loadImage();
  }, [photo.id]);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) return;
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();

    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    const toIndex = index;

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  };

  return (
    <div
      className={`photo-preview ${isDragging ? "dragging" : ""}`}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="photo-container">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={photo.originalName}
            className="photo-image"
          />
        ) : (
          <div className="photo-placeholder">
            <span>로딩 중...</span>
          </div>
        )}

        <div className="photo-overlay">
          <div className="photo-info">
            <span className="photo-name">{photo.originalName}</span>
            <span className="photo-size">
              {(photo.size / 1024 / 1024).toFixed(1)}MB
            </span>
          </div>

          <div className="photo-actions">
            <button
              onClick={onDelete}
              disabled={disabled}
              className="photo-action-button delete"
              title="삭제"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="photo-index">{index + 1}</div>
    </div>
  );
};
