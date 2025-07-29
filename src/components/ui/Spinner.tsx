"use client";

import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";

// Spinner 컴포넌트의 props 타입 정의
export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "blue" | "gray" | "green" | "red" | "yellow" | "white";
  className?: string;
}

// LoadingOverlay props 타입
export interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  size?: SpinnerProps["size"];
  color?: SpinnerProps["color"];
}

// size별 스타일 정의
const getSizeStyles = (size: SpinnerProps["size"] = "md") => {
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };
  return sizes[size];
};

// color별 스타일 정의
const getColorStyles = (color: SpinnerProps["color"] = "blue") => {
  const colors = {
    blue: "text-blue-600",
    gray: "text-gray-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
    white: "text-white",
  };
  return colors[color];
};

// 메인 Spinner 컴포넌트
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "blue",
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-block animate-spin",
        getSizeStyles(size),
        className,
      )}
      role="status"
      aria-label="로딩 중"
    >
      <svg
        className={cn("w-full h-full", getColorStyles(color))}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );
};

// 점 스타일 스피너
export const DotSpinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "blue",
  className,
}) => {
  const dotSize = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  return (
    <div
      className={cn("flex space-x-1", className)}
      role="status"
      aria-label="로딩 중"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "rounded-full animate-bounce",
            dotSize[size],
            getColorStyles(color).replace("text-", "bg-"),
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
};

// 펄스 스타일 스피너
export const PulseSpinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "blue",
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-full animate-pulse",
        getSizeStyles(size),
        getColorStyles(color).replace("text-", "bg-"),
        className,
      )}
      role="status"
      aria-label="로딩 중"
    />
  );
};

// 링 스타일 스피너
export const RingSpinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "blue",
  className,
}) => {
  const borderWidth = {
    xs: "border-2",
    sm: "border-2",
    md: "border-2",
    lg: "border-4",
    xl: "border-4",
  };

  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        getSizeStyles(size),
        borderWidth[size],
        "border-gray-200",
        `border-t-${getColorStyles(color).split("-")[1]}-600`,
        className,
      )}
      role="status"
      aria-label="로딩 중"
    />
  );
};

// 전체 화면 로딩 오버레이
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  text = "로딩 중...",
  size = "lg",
  color = "white",
}) => {
  if (!isVisible) return null;

  const overlayContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size={size} color={color === "white" ? "blue" : color} />
          {text && <p className="text-gray-700 font-medium">{text}</p>}
        </div>
      </div>
    </div>
  );

  // Portal을 사용하여 body에 렌더링
  return createPortal(overlayContent, document.body);
};

// 인라인 로딩 컴포넌트
export const InlineLoading: React.FC<{
  text?: string;
  size?: SpinnerProps["size"];
  color?: SpinnerProps["color"];
}> = ({ text = "로딩 중...", size = "sm", color = "blue" }) => {
  return (
    <div className="flex items-center space-x-2">
      <Spinner size={size} color={color} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// 버튼 내 로딩 스피너
export const ButtonSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
}> = ({ size = "sm" }) => {
  const spinnerSize = {
    sm: "xs" as const,
    md: "sm" as const,
    lg: "md" as const,
  };

  return <Spinner size={spinnerSize[size]} color="white" className="mr-2" />;
};

export default Spinner;
