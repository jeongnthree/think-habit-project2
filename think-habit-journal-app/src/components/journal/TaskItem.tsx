// components/journal/TaskItem.tsx
// 개별 할 일 아이템을 표시하고 편집할 수 있는 컴포넌트

"use client";

import type { TodoItem } from "@/shared/types";
import { cn } from "@/utils";
import {
  AlertCircle,
  Calendar,
  Check,
  Edit3,
  Flag,
  GripVertical,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface TaskItemProps {
  task: TodoItem;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: any;
  onUpdate: (taskId: string, updates: Partial<TodoItem>) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  className?: string;
  showPriority?: boolean;
  showDueDate?: boolean;
  compact?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  index,
  isDragging = false,
  dragHandleProps,
  onUpdate,
  onDelete,
  onToggleComplete,
  className,
  showPriority = true,
  showDueDate = true,
  compact = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 진입 시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 우선순위 색상
  const priorityColors = {
    low: "text-green-600 bg-green-50 border-green-200",
    medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
    high: "text-red-600 bg-red-50 border-red-200",
  };

  const priorityLabels = {
    low: "낮음",
    medium: "보통",
    high: "높음",
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (editText.trim() && editText !== task.text) {
      onUpdate(task.id, { text: editText.trim() });
    }
    setIsEditing(false);
    setEditText(task.text);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(task.text);
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // 우선순위 변경
  const cyclePriority = () => {
    const priorities: Array<"low" | "medium" | "high"> = [
      "low",
      "medium",
      "high",
    ];
    const currentIndex = priorities.indexOf(task.priority || "medium");
    const nextIndex = (currentIndex + 1) % priorities.length;
    onUpdate(task.id, { priority: priorities[nextIndex] });
  };

  // 마감일 설정
  const handleDueDateChange = (date: string) => {
    onUpdate(task.id, { dueDate: date ? new Date(date) : undefined });
  };

  // 마감일까지 남은 일수 계산
  const getDaysUntilDue = () => {
    if (!task.dueDate) return null;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon =
    daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <div
      className={cn(
        "group relative bg-white border rounded-lg transition-all duration-200",
        isDragging && "shadow-lg scale-105 rotate-1",
        task.completed && "bg-gray-50 border-gray-200",
        !task.completed &&
          "border-gray-200 hover:border-gray-300 hover:shadow-sm",
        isOverdue && !task.completed && "border-red-200 bg-red-50",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      {/* 드래그 핸들 */}
      <div
        {...dragHandleProps}
        className={cn(
          "absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
          isDragging && "opacity-100",
        )}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex items-start gap-3 ml-6">
        {/* 체크박스 */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 mt-0.5",
            task.completed
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50",
          )}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 할 일 텍스트 */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className={cn(
                "cursor-text px-2 py-1 rounded hover:bg-gray-50 transition-colors",
                task.completed && "line-through text-gray-500",
              )}
            >
              <span className="text-sm font-medium text-gray-900">
                {task.text}
              </span>
            </div>
          )}

          {/* 메타데이터 */}
          {!compact && (showPriority || showDueDate || task.dueDate) && (
            <div className="flex items-center gap-2 mt-2">
              {/* 우선순위 */}
              {showPriority && (
                <button
                  onClick={cyclePriority}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-colors",
                    priorityColors[task.priority || "medium"],
                  )}
                >
                  <Flag className="w-3 h-3" />
                  {priorityLabels[task.priority || "medium"]}
                </button>
              )}

              {/* 마감일 */}
              {task.dueDate && (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
                    isOverdue && "text-red-600 bg-red-50",
                    isDueSoon && !isOverdue && "text-orange-600 bg-orange-50",
                    !isOverdue && !isDueSoon && "text-gray-600 bg-gray-50",
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  {task.dueDate.toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })}
                  {daysUntilDue !== null && (
                    <span className="ml-1">
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)}일 지남`
                        : daysUntilDue === 0
                          ? "오늘"
                          : `${daysUntilDue}일 남음`}
                    </span>
                  )}
                </div>
              )}

              {/* 생성 시간 */}
              <span className="text-xs text-gray-400">
                {task.createdAt.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 편집 버튼 */}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* 마감일 설정 */}
          {showDueDate && (
            <input
              type="date"
              value={
                task.dueDate ? task.dueDate.toISOString().split("T")[0] : ""
              }
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="w-4 h-4 opacity-0 absolute cursor-pointer"
            />
          )}

          {/* 삭제 버튼 */}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 완료 시간 표시 */}
      {task.completed && task.completedAt && (
        <div className="mt-2 ml-9 text-xs text-gray-500">
          ✅ {task.completedAt.toLocaleString("ko-KR")}에 완료
        </div>
      )}

      {/* 경고 표시 */}
      {isOverdue && !task.completed && (
        <div className="absolute -top-1 -right-1">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
      )}
    </div>
  );
};
