'use client';

import { TwoStageRatingConfig, TwoStageResponse } from '@/types/diagnosis';
import { useState } from 'react';

interface TwoStageRatingProps {
  config: TwoStageRatingConfig;
  value?: TwoStageResponse | null;
  onChange: (value: TwoStageResponse) => void;
  questionText: string;
}

export function TwoStageRating({
  config,
  value,
  onChange,
  questionText,
}: TwoStageRatingProps) {
  const [stage1Value, setStage1Value] = useState<number | null>(
    value?.stage1_value || null
  );
  const [stage2Value, setStage2Value] = useState<number | null>(
    value?.stage2_value || null
  );

  // 최종 점수 계산 (1-9 척도)
  const calculateFinalScore = (s1: number, s2: number): number => {
    // 상(3) -> 7,8,9점 / 중(2) -> 4,5,6점 / 하(1) -> 1,2,3점
    const baseScore = (s1 - 1) * 3; // 0, 3, 6
    return baseScore + s2; // 1-9 범위
  };

  const handleStage1Change = (newValue: number) => {
    setStage1Value(newValue);
    setStage2Value(null); // 1단계 변경 시 2단계 초기화

    // 1단계만 선택된 경우는 onChange 호출하지 않음
  };

  const handleStage2Change = (newValue: number) => {
    if (stage1Value === null) return;

    setStage2Value(newValue);

    const finalScore = calculateFinalScore(stage1Value, newValue);
    const response: TwoStageResponse = {
      stage1_value: stage1Value,
      stage2_value: newValue,
      final_score: finalScore,
      stage1_label: config.stage1_labels[stage1Value - 1],
      stage2_label: config.stage2_labels[newValue - 1],
    };

    onChange(response);
  };

  const getStage1Description = (value: number): string => {
    const label = config.stage1_labels[value - 1];
    switch (value) {
      case 3:
        return `${label} (7-9점 수준)`;
      case 2:
        return `${label} (4-6점 수준)`;
      case 1:
        return `${label} (1-3점 수준)`;
      default:
        return label;
    }
  };

  const getStage2Description = (stage1: number, stage2: number): string => {
    const finalScore = calculateFinalScore(stage1, stage2);
    return `최종 ${finalScore}점`;
  };

  return (
    <div className='space-y-6'>
      {/* 1단계 평가 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium'>
            1
          </div>
          <h3 className='font-medium text-gray-900'>
            {config.stage1_instruction || '먼저 전반적인 수준을 선택해주세요'}
          </h3>
        </div>

        <div className='grid grid-cols-3 gap-3'>
          {config.stage1_labels.map((label, index) => {
            const value = index + 1;
            const isSelected = stage1Value === value;

            return (
              <button
                key={value}
                type='button'
                onClick={() => handleStage1Change(value)}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className='font-medium text-lg mb-1'>{label}</div>
                <div className='text-xs text-gray-500'>
                  {getStage1Description(value)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2단계 평가 */}
      {stage1Value && (
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium'>
              2
            </div>
            <h3 className='font-medium text-gray-900'>
              {config.stage2_instruction ||
                `'${config.stage1_labels[stage1Value - 1]}' 중에서 더 구체적으로 선택해주세요`}
            </h3>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            {config.stage2_labels.map((label, index) => {
              const value = index + 1;
              const isSelected = stage2Value === value;

              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => handleStage2Change(value)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className='font-medium text-lg mb-1'>{label}</div>
                  <div className='text-xs text-gray-500'>
                    {getStage2Description(stage1Value, value)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 최종 점수 표시 */}
      {stage1Value && stage2Value && (
        <div className='bg-gray-50 p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm text-gray-600'>선택한 평가</div>
              <div className='font-medium'>
                {config.stage1_labels[stage1Value - 1]} →{' '}
                {config.stage2_labels[stage2Value - 1]}
              </div>
            </div>
            <div className='text-right'>
              <div className='text-sm text-gray-600'>최종 점수</div>
              <div className='text-2xl font-bold text-blue-600'>
                {calculateFinalScore(stage1Value, stage2Value)}점
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
