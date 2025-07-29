// components/survey/ScaleQuestion.tsx
'use client';

import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

// ScaleQuestion 컴포넌트 Props
export interface ScaleQuestionProps {
  id: string;
  question: string;
  min?: number;
  max?: number;
  selectedValue?: number;
  onChange?: (value: number) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  minLabel?: string;
  maxLabel?: string;
  description?: string;
  helpText?: string;
  className?: string;
}

/**
 * 평점 척도 질문을 위한 간단한 버튼 컴포넌트
 */
export default function ScaleQuestion({
  id,
  question,
  min = 1,
  max = 10,
  selectedValue,
  onChange,
  required = false,
  error,
  disabled = false,
  minLabel,
  maxLabel,
  description,
  helpText,
  className = '',
}: ScaleQuestionProps) {
  const [internalValue, setInternalValue] = useState<number | null>(null);

  const currentValue =
    selectedValue !== undefined ? selectedValue : internalValue;

  const scaleValues = [];
  for (let i = min; i <= max; i++) {
    scaleValues.push(i);
  }

  const handleValueChange = (value: number) => {
    if (disabled) return;

    if (onChange) {
      onChange(value);
    } else {
      setInternalValue(value);
    }
  };

  const isValid = !required || currentValue !== null;
  const showError = error || (required && !isValid);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 질문 제목 */}
      <div className='space-y-2'>
        <h3 className='text-lg font-medium text-gray-900'>
          {question}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </h3>

        {description && <p className='text-sm text-gray-600'>{description}</p>}
      </div>

      {/* 라벨 */}
      {(minLabel || maxLabel) && (
        <div className='flex justify-between text-sm text-gray-600'>
          <span>{minLabel || min}</span>
          <span>{maxLabel || max}</span>
        </div>
      )}

      {/* 버튼 척도 */}
      <div className='flex flex-wrap gap-2 justify-center'>
        {scaleValues.map(value => {
          const isSelected = currentValue === value;

          return (
            <button
              key={value}
              type='button'
              onClick={() => handleValueChange(value)}
              disabled={disabled}
              className={`
                w-12 h-12 rounded-full border-2 font-medium transition-all duration-200
                ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                    : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:scale-105 bg-white'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              aria-label={`${value}점 선택`}
              aria-pressed={isSelected}
            >
              {value}
            </button>
          );
        })}
      </div>

      {/* 현재 선택값 표시 */}
      {currentValue !== null && (
        <div className='text-center'>
          <span className='text-sm text-gray-600'>
            선택한 값:{' '}
            <span className='font-medium text-gray-900'>{currentValue}점</span>
          </span>
        </div>
      )}

      {/* 에러 메시지 */}
      {showError && (
        <div className='flex items-center space-x-2 text-sm text-red-600'>
          <AlertCircle className='h-4 w-4' />
          <span>
            {error ||
              (required && currentValue === null
                ? '이 질문은 필수입니다.'
                : '')}
          </span>
        </div>
      )}

      {/* 도움말 */}
      {helpText && !showError && (
        <p className='text-xs text-gray-500'>{helpText}</p>
      )}
    </div>
  );
}

/**
 * 사용 예시
 */
export const sampleScaleQuestions = {
  satisfaction: {
    id: 'satisfaction',
    question: '이 서비스에 대해 전반적으로 얼마나 만족하시나요?',
    min: 1,
    max: 5,
    minLabel: '매우 불만족',
    maxLabel: '매우 만족',
    required: true,
  },

  stress: {
    id: 'stress-level',
    question: '현재 스트레스 수준은 어느 정도인가요?',
    min: 1,
    max: 10,
    minLabel: '전혀 없음',
    maxLabel: '극심함',
    description: '지난 일주일 동안의 스트레스를 기준으로 선택해주세요.',
    required: true,
  },
};
