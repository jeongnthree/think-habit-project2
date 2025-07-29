import React, { useCallback, useEffect, useState } from "react";
import { useAutoSave } from "../../hooks/useAutoSave";
import { JournalPhoto, PhotoJournalContent } from "../../types/journal";
import "./PhotoJournalEditor.css";
import { PhotoUploader } from "./PhotoUploader";

interface PhotoJournalEditorProps {
  initialContent?: Partial<PhotoJournalContent>;
  onSave: (content: PhotoJournalContent) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PhotoJournalEditor: React.FC<PhotoJournalEditorProps> = ({
  initialContent,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [content, setContent] = useState<PhotoJournalContent>({
    title: initialContent?.title || "",
    date: initialContent?.date || new Date(),
    photos: initialContent?.photos || [],
    description: initialContent?.description || "",
    tags: initialContent?.tags || [],
  });

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  );
  const [tagInput, setTagInput] = useState("");
  const [showPhotoDetails, setShowPhotoDetails] = useState(false);

  // 자동 저장 설정
  const { lastSaved, isSaving, hasUnsavedChanges } = useAutoSave(content, {
    onSave: async (data) => {
      // 드래프트로 저장하는 로직
      localStorage.setItem("photo-journal-draft", JSON.stringify(data));
    },
    delay: 2000,
  });

  // 사진 변경 핸들러
  const handlePhotosChange = useCallback(
    (photos: JournalPhoto[]) => {
      setContent((prev) => ({ ...prev, photos }));

      // 선택된 사진이 삭제된 경우 선택 해제
      if (selectedPhotoIndex !== null && selectedPhotoIndex >= photos.length) {
        setSelectedPhotoIndex(null);
      }
    },
    [selectedPhotoIndex],
  );

  // 사진 캡션 업데이트
  const handlePhotoCaptionUpdate = useCallback(
    (photoId: string, caption: string) => {
      setContent((prev) => ({
        ...prev,
        photos: prev.photos.map((photo) =>
          photo.id === photoId ? { ...photo, caption } : photo,
        ),
      }));
    },
    [],
  );

  // 태그 추가
  const addTag = useCallback(() => {
    if (tagInput.trim() && !content.tags.includes(tagInput.trim())) {
      setContent((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  }, [tagInput, content.tags]);

  // 태그 삭제
  const removeTag = useCallback((tag: string) => {
    setContent((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  // 저장 처리
  const handleSave = async () => {
    if (!content.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (content.photos.length === 0) {
      alert("최소 1개의 사진을 추가해주세요.");
      return;
    }

    try {
      await onSave(content);
      // 드래프트 삭제
      localStorage.removeItem("photo-journal-draft");
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          handleSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const selectedPhoto =
    selectedPhotoIndex !== null ? content.photos[selectedPhotoIndex] : null;

  return (
    <div className="photo-journal-editor">
      {/* 헤더 */}
      <div className="editor-header">
        <div className="header-left">
          <input
            type="text"
            placeholder="사진 일지 제목을 입력하세요"
            value={content.title}
            onChange={(e) =>
              setContent((prev) => ({ ...prev, title: e.target.value }))
            }
            className="title-input"
            disabled={isLoading}
          />
          <div className="save-status">
            {isSaving && <span className="saving">저장 중...</span>}
            {!isSaving && lastSaved && (
              <span className="saved">
                {new Date(lastSaved).toLocaleTimeString()} 자동 저장됨
              </span>
            )}
            {hasUnsavedChanges && !isSaving && (
              <span className="unsaved">저장되지 않은 변경사항</span>
            )}
          </div>
        </div>

        <div className="header-actions">
          <div className="photo-count">{content.photos.length}개 사진</div>
          <button
            onClick={() => setShowPhotoDetails(!showPhotoDetails)}
            className={`details-toggle ${showPhotoDetails ? "active" : ""}`}
            disabled={isLoading}
          >
            📋 상세정보
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-main">
          {/* 사진 업로더 */}
          <div className="photos-section">
            <div className="section-header">
              <h3>사진</h3>
              <span className="section-subtitle">
                드래그하여 순서를 변경할 수 있습니다
              </span>
            </div>

            <PhotoUploader
              photos={content.photos}
              onPhotosChange={handlePhotosChange}
              maxPhotos={20}
              disabled={isLoading}
            />
          </div>

          {/* 설명 섹션 */}
          <div className="description-section">
            <div className="section-header">
              <h3>설명</h3>
            </div>
            <textarea
              placeholder="사진에 대한 설명이나 오늘의 이야기를 자유롭게 작성해보세요..."
              value={content.description}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, description: e.target.value }))
              }
              className="description-textarea"
              rows={6}
              disabled={isLoading}
            />
          </div>

          {/* 태그 섹션 */}
          <div className="tags-section">
            <div className="section-header">
              <h3>태그</h3>
            </div>
            <div className="tags-input">
              <input
                type="text"
                placeholder="태그 추가"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isLoading}
              />
              <button onClick={addTag} disabled={!tagInput.trim() || isLoading}>
                추가
              </button>
            </div>
            <div className="tags-list">
              {content.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 사진 상세정보 패널 */}
        {showPhotoDetails && (
          <div className="photo-details-panel">
            <div className="panel-header">
              <h3>사진 상세정보</h3>
              <button
                onClick={() => setShowPhotoDetails(false)}
                className="panel-close"
              >
                ×
              </button>
            </div>

            {content.photos.length === 0 ? (
              <div className="no-photos">
                <p>사진을 추가하면 상세정보를 확인할 수 있습니다.</p>
              </div>
            ) : (
              <div className="photo-details-content">
                {/* 사진 선택 */}
                <div className="photo-selector">
                  {content.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`photo-thumb ${selectedPhotoIndex === index ? "selected" : ""}`}
                    >
                      <img
                        src={`file://${photo.path}`}
                        alt={photo.originalName}
                        onError={(e) => {
                          // 썸네일 로드 실패 시 원본 이미지 사용
                          const target = e.target as HTMLImageElement;
                          target.src = `file://${photo.path}`;
                        }}
                      />
                      <span className="photo-number">{index + 1}</span>
                    </button>
                  ))}
                </div>

                {/* 선택된 사진 정보 */}
                {selectedPhoto && (
                  <div className="selected-photo-info">
                    <div className="photo-metadata">
                      <h4>{selectedPhoto.originalName}</h4>
                      <div className="metadata-grid">
                        <div className="metadata-item">
                          <span className="label">크기:</span>
                          <span className="value">
                            {(selectedPhoto.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        <div className="metadata-item">
                          <span className="label">형식:</span>
                          <span className="value">
                            {selectedPhoto.mimeType}
                          </span>
                        </div>
                        <div className="metadata-item">
                          <span className="label">업로드:</span>
                          <span className="value">
                            {selectedPhoto.uploadedAt.toLocaleString("ko-KR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="photo-caption">
                      <label>사진 설명</label>
                      <textarea
                        placeholder="이 사진에 대한 설명을 입력하세요..."
                        value={selectedPhoto.caption || ""}
                        onChange={(e) =>
                          handlePhotoCaptionUpdate(
                            selectedPhoto.id,
                            e.target.value,
                          )
                        }
                        rows={3}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="editor-actions">
        <button
          onClick={onCancel}
          className="cancel-button"
          disabled={isLoading}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="save-button"
          disabled={
            isLoading || !content.title.trim() || content.photos.length === 0
          }
        >
          {isLoading ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
};
