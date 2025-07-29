// components/journal/PhotoPreview.tsx
// 업로드된 사진의 미리보기 및 관리 컴포넌트

"use client";

import type { PhotoItem } from "@/shared/types";
import { cn } from "@/utils";
import { extractImageMetadata, formatFileSize } from "@/utils/image-processing";
import { Download, Edit3, FileImage, Move, X, ZoomIn } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PhotoPreviewProps {
  photos: (PhotoItem & { file?: File; preview?: string })[];
  onUpdate: (photoId: string, updates: Partial<PhotoItem>) => void;
  onDelete: (photoId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
  showCaptions?: boolean;
  showMetadata?: boolean;
  gridCols?: 2 | 3 | 4;
  aspectRatio?: "square" | "auto" | "16:9" | "4:3";
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photos,
  onUpdate,
  onDelete,
  onReorder,
  className,
  showCaptions = true,
  showMetadata = true,
  gridCols = 3,
  aspectRatio = "auto",
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  const aspectRatioClass = {
    square: "aspect-square",
    auto: "aspect-auto",
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
  };

  // 캡션 편집 시작
  const startEditingCaption = (photoId: string, currentCaption?: string) => {
    setEditingCaption(photoId);
    setCaptionText(currentCaption || "");
  };

  // 캡션 저장
  const saveCaptionEdit = () => {
    if (editingCaption) {
      onUpdate(editingCaption, { caption: captionText });
      setEditingCaption(null);
      setCaptionText("");
    }
  };

  // 캡션 편집 취소
  const cancelCaptionEdit = () => {
    setEditingCaption(null);
    setCaptionText("");
  };

  // 키보드 이벤트 처리
  const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveCaptionEdit();
    } else if (e.key === "Escape") {
      cancelCaptionEdit();
    }
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML);
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  };

  // 드롭
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex !== null && draggedIndex !== index && onReorder) {
      onReorder(draggedIndex, index);
    }

    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          업로드된 사진 ({photos.length}개)
        </h3>

        {photos.length > 0 && (
          <div className="text-sm text-gray-500">드래그하여 순서 변경 가능</div>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>업로드된 사진이 없습니다</p>
          <p className="text-sm">위에서 사진을 업로드해보세요</p>
        </div>
      ) : (
        <div className={cn("grid gap-4", gridClass[gridCols])}>
          {photos.map((photo, index) => (
            <PhotoPreviewItem
              key={photo.id}
              photo={photo}
              index={index}
              aspectRatio={aspectRatio}
              showCaptions={showCaptions}
              showMetadata={showMetadata}
              isSelected={selectedPhoto === photo.id}
              isEditing={editingCaption === photo.id}
              captionText={captionText}
              isDragging={draggedIndex === index}
              isDropTarget={dropTargetIndex === index}
              onSelect={() => setSelectedPhoto(photo.id)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onStartEditCaption={startEditingCaption}
              onSaveCaptionEdit={saveCaptionEdit}
              onCancelCaptionEdit={cancelCaptionEdit}
              onCaptionChange={setCaptionText}
              onCaptionKeyDown={handleCaptionKeyDown}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      {/* 선택된 사진 상세 모달 */}
      {selectedPhoto && (
        <PhotoDetailModal
          photo={photos.find((p) => p.id === selectedPhoto)!}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={onUpdate}
          onDelete={(id) => {
            onDelete(id);
            setSelectedPhoto(null);
          }}
        />
      )}
    </div>
  );
};

// 개별 사진 미리보기 아이템
const PhotoPreviewItem: React.FC<{
  photo: PhotoItem & { file?: File; preview?: string };
  index: number;
  aspectRatio: "square" | "auto" | "16:9" | "4:3";
  showCaptions: boolean;
  showMetadata: boolean;
  isSelected: boolean;
  isEditing: boolean;
  captionText: string;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onUpdate: (photoId: string, updates: Partial<PhotoItem>) => void;
  onDelete: (photoId: string) => void;
  onStartEditCaption: (photoId: string, currentCaption?: string) => void;
  onSaveCaptionEdit: () => void;
  onCancelCaptionEdit: () => void;
  onCaptionChange: (text: string) => void;
  onCaptionKeyDown: (e: React.KeyboardEvent) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}> = ({
  photo,
  index,
  aspectRatio,
  showCaptions,
  showMetadata,
  isSelected,
  isEditing,
  captionText,
  isDragging,
  isDropTarget,
  onSelect,
  onUpdate,
  onDelete,
  onStartEditCaption,
  onSaveCaptionEdit,
  onCancelCaptionEdit,
  onCaptionChange,
  onCaptionKeyDown,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    if (photo.preview) {
      setImageUrl(photo.preview);
    } else if (photo.file) {
      const url = URL.createObjectURL(photo.file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(photo.filePath);
    }
  }, [photo]);

  useEffect(() => {
    if (photo.file) {
      extractImageMetadata(photo.file).then(setMetadata);
    }
  }, [photo.file]);

  const aspectRatioClass = {
    square: "aspect-square",
    auto: "",
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={cn(
        "group relative bg-white border rounded-lg overflow-hidden transition-all duration-200 cursor-move",
        isSelected && "ring-2 ring-purple-500",
        isDragging && "opacity-50 scale-95",
        isDropTarget && "ring-2 ring-blue-500 ring-offset-2",
        "hover:shadow-lg hover:border-gray-300",
      )}
    >
      {/* 이미지 */}
      <div
        className={cn(
          "relative overflow-hidden bg-gray-100",
          aspectRatio !== "auto" && aspectRatioClass[aspectRatio],
        )}
      >
        <img
          src={imageUrl}
          alt={photo.caption || `사진 ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          onClick={onSelect}
        />

        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200" />

        {/* 액션 버튼들 */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onSelect}
            className="p-1.5 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(photo.id)}
            className="p-1.5 bg-red-500 bg-opacity-90 rounded-full text-white hover:bg-opacity-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 인덱스 표시 */}
        <div className="absolute top-2 left-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {index + 1}
        </div>

        {/* 드래그 핸들 */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Move className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* 캡션 */}
      {showCaptions && (
        <div className="p-3">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={captionText}
                onChange={(e) => onCaptionChange(e.target.value)}
                onKeyDown={onCaptionKeyDown}
                onBlur={onSaveCaptionEdit}
                placeholder="사진 설명을 입력하세요..."
                className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={onCancelCaptionEdit}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={onSaveCaptionEdit}
                  className="px-2 py-1 text-xs text-purple-600 hover:text-purple-800"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => onStartEditCaption(photo.id, photo.caption)}
              className="cursor-text p-2 rounded hover:bg-gray-50 transition-colors min-h-[2rem] flex items-center"
            >
              {photo.caption ? (
                <span className="text-sm text-gray-700">{photo.caption}</span>
              ) : (
                <span className="text-sm text-gray-400 italic">
                  클릭하여 설명 추가
                </span>
              )}
              <Edit3 className="w-3 h-3 ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      )}

      {/* 메타데이터 */}
      {showMetadata && metadata && (
        <div className="px-3 pb-3 text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>크기:</span>
            <span>
              {metadata.width} × {metadata.height}
            </span>
          </div>
          <div className="flex justify-between">
            <span>용량:</span>
            <span>{formatFileSize(metadata.size)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 사진 상세 모달
const PhotoDetailModal: React.FC<{
  photo: PhotoItem & { file?: File; preview?: string };
  onClose: () => void;
  onUpdate: (photoId: string, updates: Partial<PhotoItem>) => void;
  onDelete: (photoId: string) => void;
}> = ({ photo, onClose, onUpdate, onDelete }) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (photo.preview) {
      setImageUrl(photo.preview);
    } else if (photo.file) {
      const url = URL.createObjectURL(photo.file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(photo.filePath);
    }
  }, [photo]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">사진 상세</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 이미지 */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-100">
          <img
            src={imageUrl}
            alt={photo.caption || "사진"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* 액션 */}
        <div className="p-4 border-t flex justify-between">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              다운로드
            </button>
          </div>
          <button
            onClick={() => onDelete(photo.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};
