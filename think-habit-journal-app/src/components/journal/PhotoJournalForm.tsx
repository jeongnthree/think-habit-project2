// components/journal/PhotoJournalForm.tsx
// 사진 일지 작성을 위한 메인 폼 컴포넌트

"use client";

import { cn } from "@/utils";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  FileText,
  Hash,
  Heart,
  Lightbulb,
  MapPin,
  Save,
  Smile,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

import { AutoSaveIndicator, useAutoSave } from "@/hooks/useAutoSave";
import type { Journal, PhotoContent, PhotoItem } from "@/shared/types";
import { PhotoPreview } from "./PhotoPreview";
import { PhotoUploadZone } from "./PhotoUploadZone";

interface PhotoJournalFormProps {
  initialJournal?: Journal;
  onSave?: (journal: Journal) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  mode?: "create" | "edit";
}

export const PhotoJournalForm: React.FC<PhotoJournalFormProps> = ({
  initialJournal,
  onSave,
  onCancel,
  className,
  mode = "create",
}) => {
  const router = useRouter();

  // 폼 상태
  const [title, setTitle] = useState(initialJournal?.title || "");
  const [description, setDescription] = useState(
    initialJournal?.content && "photos" in initialJournal.content
      ? initialJournal.content.description
      : "",
  );
  const [photos, setPhotos] = useState<
    (PhotoItem & { file?: File; preview?: string })[]
  >(
    initialJournal?.content && "photos" in initialJournal.content
      ? initialJournal.content.photos.map((photo) => ({
          ...photo,
          preview: photo.filePath,
        }))
      : [],
  );
  const [tags, setTags] = useState<string[]>(
    initialJournal?.content && "photos" in initialJournal.content
      ? initialJournal.content.tags
      : [],
  );
  const [location, setLocation] = useState(
    initialJournal?.content && "photos" in initialJournal.content
      ? initialJournal.content.location || ""
      : "",
  );
  const [mood, setMood] = useState<
    "great" | "good" | "neutral" | "challenging" | "difficult"
  >(
    initialJournal?.content && "photos" in initialJournal.content
      ? initialJournal.content.mood || "neutral"
      : "neutral",
  );

  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 자동 저장용 데이터 구성
  const journalData = {
    title,
    content: {
      photos,
      description,
      tags,
      location,
      mood,
    } as PhotoContent,
  };

  // 자동 저장 함수
  const handleAutoSave = useCallback(
    async (data: typeof journalData) => {
      if (!data.title.trim() && data.content.photos.length === 0) return;

      try {
        if (mode === "edit" && initialJournal && onSave) {
          const updatedJournal: Journal = {
            ...initialJournal,
            title: data.title,
            content: data.content,
            updatedAt: new Date(),
          };
          await onSave(updatedJournal);
        } else if (mode === "create") {
          // 새 일지 생성 API 호출
          const formData = new FormData();
          formData.append("type", "photo");
          formData.append(
            "title",
            data.title || `${new Date().toLocaleDateString("ko-KR")} 훈련 기록`,
          );
          formData.append("description", data.content.description);
          formData.append("tags", JSON.stringify(data.content.tags));
          formData.append("location", data.content.location || "");
          formData.append("mood", data.content.mood);

          // 파일들 추가
          data.content.photos.forEach((photo, index) => {
            if (photo.file) {
              formData.append(`photos`, photo.file);
              formData.append(`captions`, photo.caption || "");
            }
          });

          const response = await fetch("/api/journals", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("일지 저장에 실패했습니다");
          }
        }
      } catch (error) {
        console.error("Auto save failed:", error);
        throw error;
      }
    },
    [mode, initialJournal, onSave],
  );

  // 자동 저장 훅
  const autoSaveState = useAutoSave(journalData, {
    onSave: handleAutoSave,
    enabled: true,
    delay: 3000,
  });

  // 파일 업로드 처리
  const handleFilesSelected = useCallback((files: File[]) => {
    const newPhotos = files.map((file, index) => ({
      id: `photo_${Date.now()}_${index}`,
      fileName: file.name,
      filePath: "",
      fileSize: file.size,
      mimeType: file.type,
      caption: "",
      width: 0,
      height: 0,
      uploadedAt: new Date(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  // 사진 업데이트
  const updatePhoto = (photoId: string, updates: Partial<PhotoItem>) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, ...updates } : photo,
      ),
    );
  };

  // 사진 삭제
  const deletePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  };

  // 사진 순서 변경
  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const [movedPhoto] = newPhotos.splice(fromIndex, 1);
      newPhotos.splice(toIndex, 0, movedPhoto);
      return newPhotos;
    });
  };

  // 태그 추가
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  // 태그 삭제
  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Enter 키로 태그 추가
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // 수동 저장
  const handleManualSave = async () => {
    setIsSubmitting(true);
    try {
      await autoSaveState.save();
      router.push("/journal");
    } catch (error) {
      console.error("Manual save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소
  const handleCancel = () => {
    // 미리보기 URL 정리
    photos.forEach((photo) => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });

    if (onCancel) {
      onCancel();
    } else {
      router.push("/journal");
    }
  };

  // 기본 제목 설정
  useEffect(() => {
    if (!title && mode === "create") {
      const now = new Date();
      setTitle(
        `${now.toLocaleDateString("ko-KR")} ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 훈련 기록`,
      );
    }
  }, [title, mode]);

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, []);

  const moodOptions = [
    {
      value: "great",
      label: "최고",
      emoji: "🔥",
      color: "text-green-600 bg-green-50",
    },
    {
      value: "good",
      label: "좋음",
      emoji: "😊",
      color: "text-blue-600 bg-blue-50",
    },
    {
      value: "neutral",
      label: "보통",
      emoji: "😐",
      color: "text-gray-600 bg-gray-50",
    },
    {
      value: "challenging",
      label: "힘듦",
      emoji: "😤",
      color: "text-orange-600 bg-orange-50",
    },
    {
      value: "difficult",
      label: "어려움",
      emoji: "😰",
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className={cn("max-w-6xl mx-auto p-6", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "create" ? "새 사진 일지" : "사진 일지 편집"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoSaveIndicator state={autoSaveState} />
          <button
            onClick={handleManualSave}
            disabled={isSubmitting || photos.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "저장 중..." : "저장하고 완료"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 메인 폼 영역 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 제목 입력 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <BookOpen className="w-4 h-4 inline mr-2" />
              일지 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="오늘의 훈련 기록 제목을 입력하세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* 사진 업로드 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                <Camera className="w-4 h-4 inline mr-2" />
                사진 업로드
              </label>
              <span className="text-sm text-gray-500">
                {photos.length}/20개
              </span>
            </div>

            <PhotoUploadZone
              onFilesSelected={handleFilesSelected}
              maxFiles={20}
              maxSizePerFile={10}
              autoCompress={true}
            />
          </div>

          {/* 사진 미리보기 */}
          {photos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <PhotoPreview
                photos={photos}
                onUpdate={updatePhoto}
                onDelete={deletePhoto}
                onReorder={reorderPhotos}
                showCaptions={true}
                showMetadata={true}
                gridCols={3}
                aspectRatio="square"
              />
            </div>
          )}

          {/* 설명 입력 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FileText className="w-4 h-4 inline mr-2" />
              훈련 기록 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="오늘의 훈련에 대한 상세한 기록을 작성해주세요. 어떤 운동을 했는지, 어떤 기분이었는지, 특별한 순간이 있었는지 자유롭게 적어보세요..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-colors"
            />
            <div className="mt-2 text-sm text-gray-500">
              {description.length}/2000 글자
            </div>
          </div>

          {/* 태그 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Tag className="w-4 h-4 inline mr-2" />
              태그
            </label>

            {/* 태그 입력 */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그를 입력하세요 (예: 헬스, 러닝, 요가)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={addTag}
                disabled={!newTag.trim() || tags.includes(newTag.trim())}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Hash className="w-4 h-4" />
              </button>
            </div>

            {/* 태그 목록 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 추천 태그 */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">추천 태그:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "헬스",
                  "러닝",
                  "요가",
                  "필라테스",
                  "수영",
                  "등산",
                  "사이클링",
                  "홈트레이닝",
                ].map((recommendedTag) => (
                  <button
                    key={recommendedTag}
                    onClick={() => {
                      if (!tags.includes(recommendedTag)) {
                        setTags((prev) => [...prev, recommendedTag]);
                      }
                    }}
                    disabled={tags.includes(recommendedTag)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    #{recommendedTag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 훈련 정보 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <h3 className="font-semibold text-purple-900 mb-4">📊 훈련 정보</h3>

            {/* 위치 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                위치
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="헬스장, 공원, 집 등"
                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>

            {/* 기분 */}
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Smile className="w-4 h-4 inline mr-1" />
                오늘의 기분
              </label>
              <div className="grid grid-cols-1 gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMood(option.value as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      mood === option.value
                        ? option.color + " border-2"
                        : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50",
                    )}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 진행 상황 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4">📈 진행 상황</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">업로드된 사진</span>
                <span className="font-medium text-blue-900">
                  {photos.length}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">태그</span>
                <span className="font-medium text-blue-900">
                  {tags.length}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">설명 길이</span>
                <span className="font-medium text-blue-900">
                  {description.length}자
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">완성도</span>
                <span className="font-bold text-blue-900">
                  {Math.round(
                    (((photos.length > 0 ? 1 : 0) +
                      (title.trim() ? 1 : 0) +
                      (description.trim() ? 1 : 0) +
                      (tags.length > 0 ? 1 : 0)) /
                      4) *
                      100,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* 팁 */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
            <h3 className="font-semibold text-yellow-900 mb-3">
              <Lightbulb className="w-4 h-4 inline mr-2" />
              💡 작성 팁
            </h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• 운동 전후 사진으로 변화를 기록해보세요</li>
              <li>• 운동 자세나 장비 사진도 도움이 됩니다</li>
              <li>• 태그를 활용해 나중에 쉽게 찾을 수 있어요</li>
              <li>• 기분을 기록하면 패턴을 발견할 수 있습니다</li>
              <li>• 사진마다 간단한 설명을 추가해보세요</li>
            </ul>
          </div>

          {/* 단축키 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 mb-3">⌨️ 단축키</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>태그 추가</span>
                <code className="bg-white px-1 rounded">Enter</code>
              </div>
              <div className="flex justify-between">
                <span>저장</span>
                <code className="bg-white px-1 rounded">Ctrl+S</code>
              </div>
            </div>
          </div>

          {/* 격려 메시지 */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 text-center">
            <Heart className="w-8 h-8 text-pink-600 mx-auto mb-3" />
            <p className="text-sm text-pink-800 font-medium">
              매일의 작은 노력이
              <br />큰 변화를 만듭니다! 💪
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
