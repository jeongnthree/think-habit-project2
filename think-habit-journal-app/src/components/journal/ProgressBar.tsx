// components/journal/ProgressBar.tsx
// 할 일 진행률을 시각적으로 표시하는 컴포넌트

"use client";

import { cn } from "@/utils";
import { CheckCircle2, Circle, Target } from "lucide-react";
import React from "react";

interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
  showStats?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "purple" | "orange";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  className,
  showStats = true,
  showPercentage = true,
  animated = true,
  size = "md",
  color = "blue",
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = percentage === 100;

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-100",
      fill: "bg-gradient-to-r from-blue-500 to-blue-600",
      text: "text-blue-700",
      icon: "text-blue-600",
    },
    green: {
      bg: "bg-green-100",
      fill: "bg-gradient-to-r from-green-500 to-green-600",
      text: "text-green-700",
      icon: "text-green-600",
    },
    purple: {
      bg: "bg-purple-100",
      fill: "bg-gradient-to-r from-purple-500 to-purple-600",
      text: "text-purple-700",
      icon: "text-purple-600",
    },
    orange: {
      bg: "bg-orange-100",
      fill: "bg-gradient-to-r from-orange-500 to-orange-600",
      text: "text-orange-700",
      icon: "text-orange-600",
    },
  };

  const colorStyle = colorClasses[color];

  const getMotivationalMessage = () => {
    if (percentage === 0) return "시작이 반이에요! 💪";
    if (percentage < 25) return "좋은 시작이에요! 🌟";
    if (percentage < 50) return "순조롭게 진행 중이에요! 🚀";
    if (percentage < 75) return "거의 다 왔어요! 🔥";
    if (percentage < 100) return "마지막 스퍼트! 💨";
    return "완료! 정말 훌륭해요! 🎉";
  };

  const getProgressIcon = () => {
    if (isComplete) {
      return <CheckCircle2 className={cn("w-5 h-5", colorStyle.icon)} />;
    }
    if (percentage >= 50) {
      return <Target className={cn("w-5 h-5", colorStyle.icon)} />;
    }
    return <Circle className={cn("w-5 h-5", colorStyle.icon)} />;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* 상단 정보 */}
      {showStats && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getProgressIcon()}
            <span className={cn("font-medium", colorStyle.text)}>진행률</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {completed}/{total} 완료
            </span>
            {showPercentage && (
              <span className={cn("text-lg font-bold", colorStyle.text)}>
                {percentage}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* 진행률 바 */}
      <div
        className={cn(
          "relative w-full rounded-full overflow-hidden",
          colorStyle.bg,
          sizeClasses[size],
        )}
      >
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-50" />

        {/* 진행률 표시 */}
        <div
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            colorStyle.fill,
            animated && "transition-all duration-700 ease-out",
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* 반짝이는 효과 */}
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full animate-pulse" />
          )}
        </div>

        {/* 완료 시 축하 효과 */}
        {isComplete && animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/50 via-yellow-300/50 to-yellow-200/50 animate-ping" />
        )}
      </div>

      {/* 동기부여 메시지 */}
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-600 font-medium">
          {getMotivationalMessage()}
        </span>
      </div>

      {/* 세부 통계 (큰 사이즈일 때만) */}
      {size === "lg" && showStats && (
        <div className="mt-4 grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{completed}</div>
            <div className="text-xs text-gray-500">완료됨</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {total - completed}
            </div>
            <div className="text-xs text-gray-500">남은 것</div>
          </div>
          <div className="text-center">
            <div className={cn("text-lg font-bold", colorStyle.text)}>
              {percentage}%
            </div>
            <div className="text-xs text-gray-500">진행률</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 원형 진행률 표시 컴포넌트
export const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showPercentage?: boolean;
}> = ({
  percentage,
  size = 60,
  strokeWidth = 6,
  color = "#3B82F6",
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* 진행률 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* 백분율 텍스트 */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700">{percentage}%</span>
        </div>
      )}
    </div>
  );
};

// 미니 진행률 표시 (리스트 아이템용)
export const MiniProgress: React.FC<{
  completed: number;
  total: number;
  className?: string;
}> = ({ completed, total, className }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 font-medium">
        {completed}/{total}
      </span>
    </div>
  );
};
