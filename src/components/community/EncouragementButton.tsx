'use client';

import { Button } from '@/components/ui';
import { useState } from 'react';

interface EncouragementButtonProps {
  journalId: string;
  currentUserId: string;
  encouragementCount: number;
  hasUserEncouraged: boolean;
  onEncourage: () => Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EncouragementButton({
  journalId,
  currentUserId,
  encouragementCount,
  hasUserEncouraged,
  onEncourage,
  disabled = false,
  size = 'md',
}: EncouragementButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEncourage = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    // Optimistic update - 즉시 UI 업데이트
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    try {
      await onEncourage();
    } catch (error) {
      console.error('Error encouraging journal:', error);
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'text-base';
      case 'lg':
        return 'text-xl';
      default:
        return 'text-lg';
    }
  };

  return (
    <Button
      variant={hasUserEncouraged ? 'primary' : 'outline'}
      onClick={handleEncourage}
      disabled={isLoading || disabled}
      aria-label={
        hasUserEncouraged
          ? `격려 취소하기. 현재 ${encouragementCount}명이 격려했습니다.`
          : `격려하기. 현재 ${encouragementCount}명이 격려했습니다.`
      }
      aria-pressed={hasUserEncouraged}
      className={`
        flex items-center justify-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${getSizeClasses()}
        ${
          hasUserEncouraged
            ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
            : 'border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700'
        }
        ${isAnimating ? 'scale-105' : 'scale-100'}
        ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isLoading ? (
        <div className='flex items-center space-x-2'>
          <div
            className={`w-4 h-4 border-2 ${hasUserEncouraged ? 'border-white border-t-transparent' : 'border-blue-600 border-t-transparent'} rounded-full animate-spin`}
            aria-hidden='true'
          ></div>
          <span className='font-medium'>처리 중...</span>
        </div>
      ) : (
        <>
          <span
            className={`
              ${getIconSize()} transition-transform duration-200
              ${isAnimating ? 'animate-bounce' : ''}
            `}
            aria-hidden='true'
          >
            👏
          </span>
          <span className='font-medium'>
            {hasUserEncouraged ? '격려함' : '격려하기'}
          </span>
          {encouragementCount > 0 && (
            <span
              className={`
                px-2 py-0.5 text-xs rounded-full font-medium transition-colors
                ${
                  hasUserEncouraged
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-800'
                }
              `}
              aria-label={`격려 수: ${encouragementCount}`}
            >
              {encouragementCount}
            </span>
          )}
        </>
      )}
    </Button>
  );
}

// 격려 수만 표시하는 간단한 컴포넌트 (버튼 기능 없음)
interface EncouragementCountProps {
  count: number;
  hasUserEncouraged?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EncouragementCount({
  count,
  hasUserEncouraged = false,
  className = '',
  size = 'md',
}: EncouragementCountProps) {
  if (count === 0) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <div
      className={`flex items-center space-x-1 text-gray-600 ${getSizeClasses()} ${className}`}
    >
      <span className={getIconSize()}>👏</span>
      <span className='font-medium'>{count}</span>
      <span>{hasUserEncouraged ? '(내가 격려함)' : '명이 격려했습니다'}</span>
    </div>
  );
}

// 격려 상태를 표시하는 인디케이터 컴포넌트 (카드에서 사용)
interface EncouragementIndicatorProps {
  count: number;
  hasUserEncouraged: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function EncouragementIndicator({
  count,
  hasUserEncouraged,
  size = 'md',
  showText = true,
  className = '',
}: EncouragementIndicatorProps) {
  if (count === 0) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <div
      className={`flex items-center space-x-1 ${getSizeClasses()} ${hasUserEncouraged ? 'text-blue-600' : 'text-gray-600'} ${className}`}
    >
      <span className={getIconSize()}>👏</span>
      <span className='font-medium'>{count}</span>
      {showText && <span>{hasUserEncouraged ? '(격려함)' : ''}</span>}
    </div>
  );
}

// 격려 통계를 보여주는 컴포넌트
interface EncouragementStatsProps {
  count: number;
  hasUserEncouraged: boolean;
  className?: string;
}

export function EncouragementStats({
  count,
  hasUserEncouraged,
  className = '',
}: EncouragementStatsProps) {
  return (
    <div
      className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}
    >
      <div className='flex items-center space-x-1'>
        <span className='text-base'>👏</span>
        <span className='font-medium'>{count}</span>
      </div>
      {hasUserEncouraged && (
        <span className='text-blue-600 text-xs font-medium'>내가 격려함</span>
      )}
    </div>
  );
}
