"use client";

import React, { useState } from "react";
import { cn } from "@/utils";

// Input 컴포넌트의 props 타입 정의
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
}

// 기본 스타일 정의
const getBaseStyles = () =>
  [
    "w-full px-3 py-2 text-base",
    "border rounded-lg",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
    "placeholder:text-gray-400",
  ].join(" ");

// variant별 스타일
const getVariantStyles = (
  variant: InputProps["variant"] = "default",
  hasError: boolean,
) => {
  if (hasError) {
    return "border-red-500 focus:ring-red-500 focus:border-red-500";
  }

  const variants = {
    default: "border-gray-300 bg-white hover:border-gray-400",
    filled: "border-gray-200 bg-gray-50 hover:bg-gray-100 focus:bg-white",
    outlined: "border-2 border-gray-300 bg-white hover:border-gray-400",
  };

  return variants[variant];
};

// 아이콘이 있을 때의 padding 조정
const getIconPadding = (
  leftIcon?: React.ReactNode,
  rightIcon?: React.ReactNode,
) => {
  let padding = "";
  if (leftIcon) padding += " pl-10";
  if (rightIcon) padding += " pr-10";
  return padding;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      variant = "default",
      className,
      id,
      type = "text",
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = Boolean(error);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // 비밀번호 타입일 때 실제 타입 결정
    const actualType =
      type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className={cn("flex flex-col", fullWidth ? "w-full" : "w-auto")}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "mb-2 text-sm font-medium",
              hasError ? "text-red-700" : "text-gray-700",
              disabled && "text-gray-500",
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            disabled={disabled}
            className={cn(
              getBaseStyles(),
              getVariantStyles(variant, hasError),
              getIconPadding(leftIcon, rightIcon || type === "password"),
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              error || helperText ? `${inputId}-description` : undefined
            }
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(rightIcon || type === "password") && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {type === "password" ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={disabled}
                  aria-label={
                    showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                >
                  {showPassword ? (
                    // 눈 감은 아이콘 (비밀번호 숨기기)
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    // 눈 뜬 아이콘 (비밀번호 보기)
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Error Message or Helper Text */}
        {(error || helperText) && (
          <div
            id={`${inputId}-description`}
            className={cn(
              "mt-1 text-sm",
              hasError ? "text-red-600" : "text-gray-600",
            )}
          >
            {error && typeof error === "string" ? error : helperText}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
