// components/journal/TypeCard.tsx
// 개별 일지 타입을 나타내는 카드 컴포넌트

"use client";

import { cn } from "@/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface TypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  color: "blue" | "purple" | "green" | "orange";
  isSelected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const TypeCard: React.FC<TypeCardProps> = ({
  icon: Icon,
  title,
  description,
  features,
  color,
  isSelected = false,
  disabled = false,
  onClick,
}) => {
  const colorClasses = {
    blue: {
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      icon: "text-blue-600",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
      hover: "hover:border-blue-300 hover:shadow-blue-100",
      selected: "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100",
    },
    purple: {
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      icon: "text-purple-600",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
      hover: "hover:border-purple-300 hover:shadow-purple-100",
      selected:
        "border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100",
    },
    green: {
      bg: "from-green-50 to-green-100",
      border: "border-green-200",
      icon: "text-green-600",
      gradient: "bg-gradient-to-br from-green-500 to-green-600",
      hover: "hover:border-green-300 hover:shadow-green-100",
      selected: "border-green-500 bg-gradient-to-br from-green-50 to-green-100",
    },
    orange: {
      bg: "from-orange-50 to-orange-100",
      border: "border-orange-200",
      icon: "text-orange-600",
      gradient: "bg-gradient-to-br from-orange-500 to-orange-600",
      hover: "hover:border-orange-300 hover:shadow-orange-100",
      selected:
        "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100",
    },
  };

  const colorStyle = colorClasses[color];

  return (
    <div
      className={cn(
        // 기본 스타일
        "relative overflow-hidden rounded-xl border-2 p-6 cursor-pointer transition-all duration-300",
        "transform hover:scale-105 hover:shadow-xl",

        // 색상 및 상태 스타일
        isSelected
          ? colorStyle.selected
          : `bg-gradient-to-br ${colorStyle.bg} ${colorStyle.border} ${colorStyle.hover}`,

        // 비활성화 상태
        disabled &&
          "opacity-50 cursor-not-allowed transform-none hover:scale-100 hover:shadow-none",

        // 선택 시 글로우 효과
        isSelected && "shadow-lg ring-2 ring-offset-2 ring-opacity-50",
        isSelected && color === "blue" && "ring-blue-400",
        isSelected && color === "purple" && "ring-purple-400",
        isSelected && color === "green" && "ring-green-400",
        isSelected && color === "orange" && "ring-orange-400",
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
        <div
          className={cn("w-full h-full rounded-full", colorStyle.gradient)}
        />
      </div>

      {/* 아이콘 영역 */}
      <div className="relative mb-4">
        <div
          className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-lg",
            colorStyle.gradient,
            "shadow-md",
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* 선택 표시 */}
        {isSelected && (
          <div className="absolute -top-2 -right-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                colorStyle.gradient,
                "shadow-md",
              )}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

      {/* 설명 */}
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
        {description}
      </p>

      {/* 기능 목록 */}
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-700">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full mr-3",
                colorStyle.gradient,
              )}
            />
            {feature}
          </li>
        ))}
      </ul>

      {/* 호버 시 강조 효과 */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
          "hover:opacity-5",
          colorStyle.gradient,
        )}
      />
    </div>
  );
};
