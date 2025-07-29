// components/journal/JournalCard.tsx
// 일지 목록에서 사용되는 개별 일지 카드 컴포넌트

"use client";

import type { Journal, PhotoContent, StructuredContent } from "@/shared/types";
import { cn } from "@/utils";
import {
  AlertCircle,
  Archive,
  Calendar,
  Camera,
  CheckCircle,
  CheckSquare,
  Clock,
  Edit3,
  Eye,
  MapPin,
  MoreVertical,
  Share2,
  Star,
  Tag,
  Trash2,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { CircularProgress, ProgressBar } from "./ProgressBar";

interface JournalCardProps {
  journal: Journal;
  onEdit?: (journal: Journal) => void;
  onDelete?: (journalId: string) => void;
  onShare?: (journal: Journal) => void;
  onToggleFavorite?: (journalId: string) => void;
  onToggleArchive?: (journalId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  journal,
  onEdit,
  onDelete,
  onShare,
  onToggleFavorite,
  onToggleArchive,
  showActions = true,
  compact = false,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const isStructured = journal.type === "structured";
  const isPhoto = journal.type === "photo";

  const structuredContent = isStructured
    ? (journal.content as StructuredContent)
    : null;
  const photoContent = isPhoto ? (journal.content as PhotoContent) : null;

  // 미리보기 콘텐츠 생성
  const getPreviewContent = () => {
    if (isStructured && structuredContent) {
      const incompleteTasks = structuredContent.tasks.filter(
        (task) => !task.completed,
      );
      const recentTasks = incompleteTasks.slice(0, 3);

      if (recentTasks.length === 0) {
        return "모든 할 일을 완료했습니다! 🎉";
      }

      return recentTasks.map((task) => `• ${task.text}`).join("\n");
    }

    if (isPhoto && photoContent) {
      return photoContent.description || "사진과 함께하는 훈련 기록";
    }

    return "";
  };

  // 썸네일 이미지 URL 가져오기
  const getThumbnailUrl = () => {
    if (isPhoto && photoContent && photoContent.photos.length > 0) {
      return photoContent.photos[0].filePath;
    }
    return null;
  };

  // 동기화 상태 아이콘
  const getSyncIcon = () => {
    switch (journal.syncStatus) {
      case "synced":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "local":
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  // 상대적 시간 표시
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  return (
    <div
      className={cn(
        "group bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden",
        "hover:border-gray-300 hover:-translate-y-1",
        compact ? "p-4" : "p-0",
        className,
      )}
    >
      {/* 썸네일 이미지 (사진 일지의 경우) */}
      {!compact && getThumbnailUrl() && (
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={getThumbnailUrl()!}
            alt={journal.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              "group-hover:scale-105",
              isImageLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* 타입 뱃지 */}
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
              <Camera className="w-3 h-3" />
              사진 일지
            </div>
          </div>

          {/* 동기화 상태 */}
          <div className="absolute top-3 right-3">{getSyncIcon()}</div>

          {/* 사진 개수 */}
          {photoContent && photoContent.photos.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
              +{photoContent.photos.length - 1}
            </div>
          )}
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className={cn("p-4", !compact && getThumbnailUrl() && "pt-4")}>
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* 타입 뱃지 (구조화된 일지 또는 컴팩트 모드) */}
            {(isStructured || compact) && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {isStructured ? (
                    <>
                      <CheckSquare className="w-3 h-3" />
                      구조화된 일지
                    </>
                  ) : (
                    <>
                      <Camera className="w-3 h-3" />
                      사진 일지
                    </>
                  )}
                </div>
                {compact && <div className="ml-auto">{getSyncIcon()}</div>}
              </div>
            )}

            {/* 제목 */}
            <Link
              href={`/journal/${journal.id}`}
              className="block group-hover:text-blue-600 transition-colors"
            >
              <h3
                className={cn(
                  "font-semibold text-gray-900 mb-1 line-clamp-2",
                  compact ? "text-base" : "text-lg",
                )}
              >
                {journal.title}
              </h3>
            </Link>

            {/* 날짜 및 시간 */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Calendar className="w-4 h-4" />
              <span>{getRelativeTime(journal.createdAt)}</span>
              <span>•</span>
              <span>{journal.createdAt.toLocaleDateString("ko-KR")}</span>
            </div>
          </div>

          {/* 액션 메뉴 */}
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-10">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        onEdit?.(journal);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                      편집
                    </button>
                    <button
                      onClick={() => {
                        onShare?.(journal);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Share2 className="w-4 h-4" />
                      공유
                    </button>
                    <button
                      onClick={() => {
                        onToggleFavorite?.(journal.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Star className="w-4 h-4" />
                      즐겨찾기
                    </button>
                    <button
                      onClick={() => {
                        onToggleArchive?.(journal.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <Archive className="w-4 h-4" />
                      보관
                    </button>
                    <div className="border-t my-1" />
                    <button
                      onClick={() => {
                        onDelete?.(journal.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 진행률 (구조화된 일지) */}
        {isStructured && structuredContent && !compact && (
          <div className="mb-3">
            <ProgressBar
              completed={structuredContent.completedTasks}
              total={structuredContent.totalTasks}
              size="sm"
              showStats={false}
              showPercentage={true}
              color="blue"
            />
          </div>
        )}

        {/* 미리보기 콘텐츠 */}
        <div className="mb-3">
          <p
            className={cn(
              "text-gray-600 leading-relaxed",
              compact ? "text-sm line-clamp-2" : "text-sm line-clamp-3",
            )}
          >
            {getPreviewContent()}
          </p>
        </div>

        {/* 메타데이터 */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {/* 구조화된 일지 정보 */}
          {isStructured && structuredContent && (
            <>
              <div className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                <span>
                  {structuredContent.completedTasks}/
                  {structuredContent.totalTasks} 완료
                </span>
              </div>
              {compact && (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4">
                    <CircularProgress
                      percentage={structuredContent.completionRate}
                      size={16}
                      strokeWidth={2}
                      showPercentage={false}
                    />
                  </div>
                  <span>{structuredContent.completionRate}%</span>
                </div>
              )}
            </>
          )}

          {/* 사진 일지 정보 */}
          {isPhoto && photoContent && (
            <>
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span>{photoContent.photos.length}장</span>
              </div>
              {photoContent.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{photoContent.tags.slice(0, 2).join(", ")}</span>
                  {photoContent.tags.length > 2 && (
                    <span>+{photoContent.tags.length - 2}</span>
                  )}
                </div>
              )}
              {photoContent.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{photoContent.location}</span>
                </div>
              )}
            </>
          )}

          {/* 수정 시간 */}
          {journal.updatedAt.getTime() !== journal.createdAt.getTime() && (
            <div className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              <span>수정됨</span>
            </div>
          )}
        </div>
      </div>

      {/* 바로가기 액션 (호버 시 표시) */}
      {!compact && (
        <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/journal/${journal.id}`}
            className="p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Link>
          <button
            onClick={() => onEdit?.(journal)}
            className="p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* 클릭 오버레이 닫기 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};
