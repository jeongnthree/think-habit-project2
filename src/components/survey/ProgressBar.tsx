// components/survey/ProgressBar.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

// 진행률 스타일 타입
export type ProgressStyle = 'bar' | 'circle' | 'steps' | 'minimal';

// ProgressBar 컴포넌트 Props
export interface ProgressBarProps {
  // 필수 Props
  current: number;
  total: number;

  // 스타일 설정
  style?: ProgressStyle;
  showPercentage?: boolean;
  showSteps?: boolean;
  showLabels?: boolean;
  animated?: boolean;

  // 색상 및 크기
  color?: string;
  backgroundColor?: string;
  height?: number;
  className?: string;

  // 레이블 및 텍스트
  label?: string;
  completedLabel?: string;
  currentStepLabel?: string;

  // 단계별 정보
  stepLabels?: string[];

  // 콜백
  onStepClick?: (step: number) => void;
}

/**
 * 설문조사 진행 상황을 보여주는 프로그레스 바 컴포넌트
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   current={3}
 *   total={10}
 *   style="bar"
 *   showPercentage
 *   showSteps
 *   label="설문조사 진행률"
 * />
 * ```
 */
export default function ProgressBar({
  current,
  total,
  style = 'bar',
  showPercentage = true,
  showSteps = true,
  showLabels = false,
  animated = true,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  height = 8,
  className = '',
  label,
  completedLabel = '완료',
  currentStepLabel = '현재',
  stepLabels = [],
  onStepClick,
}: ProgressBarProps) {
  // 애니메이션을 위한 상태
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // 진행률 계산
  const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
  const isCompleted = current >= total;

  /**
   * 애니메이션 효과
   */
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(percentage);
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setAnimatedProgress(percentage);
    }
    return undefined;
  }, [percentage, animated]);

  /**
   * 단계 클릭 핸들러
   */
  const handleStepClick = (step: number) => {
    if (onStepClick && step <= current) {
      onStepClick(step);
    }
    return;
  };

  /**
   * 바 스타일 프로그레스
   */
  const renderBarProgress = () => (
    <div className='space-y-3'>
      {/* 라벨 */}
      {label && (
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium text-gray-700'>{label}</span>
          {showPercentage && (
            <span className='text-sm text-gray-500'>
              {Math.round(animatedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* 프로그레스 바 */}
      <div
        className='w-full rounded-full overflow-hidden'
        style={{ backgroundColor, height: `${height}px` }}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isCompleted ? 'bg-green-500' : ''
          }`}
          style={{
            width: `${animatedProgress}%`,
            backgroundColor: isCompleted ? '#22c55e' : color,
          }}
        />
      </div>

      {/* 단계 표시 */}
      {showSteps && (
        <div className='flex justify-between items-center text-xs text-gray-500'>
          <span>
            {current}/{total}
          </span>
          {isCompleted && (
            <span className='text-green-600 font-medium'>{completedLabel}</span>
          )}
        </div>
      )}
    </div>
  );

  /**
   * 원형 프로그레스
   */
  const renderCircleProgress = () => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
      circumference - (animatedProgress / 100) * circumference;

    return (
      <div className='flex flex-col items-center space-y-3'>
        {label && (
          <span className='text-sm font-medium text-gray-700'>{label}</span>
        )}

        <div className='relative'>
          <svg className='w-24 h-24 transform -rotate-90' viewBox='0 0 100 100'>
            {/* 배경 원 */}
            <circle
              cx='50'
              cy='50'
              r={radius}
              stroke={backgroundColor}
              strokeWidth='8'
              fill='transparent'
            />
            {/* 진행 원 */}
            <circle
              cx='50'
              cy='50'
              r={radius}
              stroke={isCompleted ? '#22c55e' : color}
              strokeWidth='8'
              fill='transparent'
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap='round'
              className='transition-all duration-700 ease-out'
            />
          </svg>

          {/* 중앙 텍스트 */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            {showPercentage ? (
              <span className='text-lg font-bold text-gray-900'>
                {Math.round(animatedProgress)}%
              </span>
            ) : (
              <span className='text-sm font-medium text-gray-700'>
                {current}/{total}
              </span>
            )}
            {isCompleted && (
              <span className='text-xs text-green-600'>{completedLabel}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * 단계별 프로그레스
   */
  const renderStepsProgress = () => (
    <div className='space-y-4'>
      {label && (
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium text-gray-700'>{label}</span>
          <span className='text-sm text-gray-500'>
            {current}/{total}
          </span>
        </div>
      )}

      <div className='flex items-center space-x-2'>
        {Array.from({ length: total }, (_, index) => {
          const stepNumber = index + 1;
          const isCurrentStep = stepNumber === current;
          const isCompletedStep = stepNumber < current;
          const isClickable = onStepClick && stepNumber <= current;

          return (
            <div key={stepNumber} className='flex items-center'>
              {/* 단계 원 */}
              <button
                onClick={() => handleStepClick(stepNumber)}
                disabled={!isClickable}
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-200
                  ${
                    isCompletedStep
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrentStep
                        ? 'border-blue-500 text-blue-500 bg-blue-50'
                        : 'border-gray-300 text-gray-400'
                  }
                  ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                `}
              >
                {isCompletedStep ? (
                  <CheckCircle className='w-4 h-4' />
                ) : (
                  stepNumber
                )}
              </button>

              {/* 단계 라벨 */}
              {showLabels && stepLabels[index] && (
                <span className='ml-2 text-xs text-gray-600'>
                  {stepLabels[index]}
                </span>
              )}

              {/* 연결선 */}
              {index < total - 1 && (
                <div
                  className={`
                    w-8 h-1 mx-2 rounded-full transition-all duration-300
                    ${isCompletedStep ? 'bg-green-500' : 'bg-gray-300'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 현재 단계 정보 */}
      {showLabels && (
        <div className='text-center'>
          <span className='text-sm text-gray-600'>
            {currentStepLabel}: {stepLabels[current - 1] || `단계 ${current}`}
          </span>
        </div>
      )}
    </div>
  );

  /**
   * 미니멀 프로그레스
   */
  const renderMinimalProgress = () => (
    <div className='space-y-2'>
      {/* 간단한 바 */}
      <div
        className='w-full rounded-full bg-gray-200'
        style={{ height: '4px' }}
      >
        <div
          className='h-full rounded-full bg-blue-500 transition-all duration-500 ease-out'
          style={{ width: `${animatedProgress}%` }}
        />
      </div>

      {/* 간단한 텍스트 */}
      <div className='flex justify-between text-xs text-gray-500'>
        <span>
          {current}/{total}
        </span>
        <span>{Math.round(animatedProgress)}%</span>
      </div>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {style === 'bar' && renderBarProgress()}
      {style === 'circle' && renderCircleProgress()}
      {style === 'steps' && renderStepsProgress()}
      {style === 'minimal' && renderMinimalProgress()}
      {/* 기본 fallback */}
      {style !== 'bar' &&
        style !== 'circle' &&
        style !== 'steps' &&
        style !== 'minimal' && <div>지원하지 않는 스타일입니다.</div>}
    </div>
  );
}

/**
 * ProgressBar 사전 정의된 설정들
 */
export const ProgressBarPresets = {
  // 기본 설문조사용
  survey: {
    style: 'bar' as ProgressStyle,
    showPercentage: true,
    showSteps: true,
    animated: true,
    color: '#3b82f6',
    height: 8,
  },

  // 단계별 진행
  stepper: {
    style: 'steps' as ProgressStyle,
    showLabels: true,
    animated: true,
  },

  // 간단한 표시
  minimal: {
    style: 'minimal' as ProgressStyle,
    animated: true,
  },

  // 원형 진행률
  circular: {
    style: 'circle' as ProgressStyle,
    showPercentage: true,
    animated: true,
  },
};

/**
 * 사용 예시를 위한 샘플 데이터
 */
export const sampleProgressBars = {
  basic: {
    current: 3,
    total: 10,
    label: '설문조사 진행률',
    ...ProgressBarPresets.survey,
  },

  steps: {
    current: 2,
    total: 5,
    label: '단계별 진행',
    stepLabels: ['기본정보', '설문응답', '추가정보', '검토', '완료'],
    ...ProgressBarPresets.stepper,
  },

  circular: {
    current: 7,
    total: 10,
    label: '완료율',
    ...ProgressBarPresets.circular,
  },
};
