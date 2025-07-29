'use client';

import { useState } from 'react';

type RatingLevel = '상' | '중' | '하';

interface TwoStageRatingProps {
  questionText: string;
  onScoreChange: (score: number) => void;
  disabled?: boolean;
}

// 점수 매핑 테이블
const SCORE_MAPPING: Record<RatingLevel, Record<RatingLevel, number>> = {
  상: { 상: 9, 중: 8, 하: 7 },
  중: { 상: 6, 중: 5, 하: 4 },
  하: { 상: 3, 중: 2, 하: 1 },
};

export default function TwoStageRatingComponent({
  questionText,
  onScoreChange,
  disabled = false,
}: TwoStageRatingProps) {
  const [stage1Choice, setStage1Choice] = useState<RatingLevel | null>(null);
  const [stage2Choice, setStage2Choice] = useState<RatingLevel | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const handleStage1Selection = (choice: RatingLevel) => {
    if (disabled) return;

    setStage1Choice(choice);
    setStage2Choice(null); // 1단계 변경 시 2단계 초기화
    setFinalScore(null);
  };

  const handleStage2Selection = (choice: RatingLevel) => {
    if (disabled || !stage1Choice) return;

    setStage2Choice(choice);
    const score = SCORE_MAPPING[stage1Choice][choice];
    setFinalScore(score);
    onScoreChange(score);
  };

  const resetSelection = () => {
    if (disabled) return;

    setStage1Choice(null);
    setStage2Choice(null);
    setFinalScore(null);
  };

  return (
    <div className='two-stage-rating bg-white p-6 rounded-lg shadow-sm border'>
      {/* 질문 표시 */}
      <div className='question-section mb-6'>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>설문 문항</h3>
        <p className='text-gray-700'>
          {questionText} <span className='font-medium'>[상, 중, 하]</span> 중에
          어디에 속한다고 보시나요?
        </p>
      </div>

      {/* 1단계 선택 */}
      <div className='stage1-section mb-6'>
        <h4 className='text-md font-medium text-gray-800 mb-3'>
          1단계: 범위 선택
        </h4>
        <div className='flex gap-3'>
          {(['상', '중', '하'] as RatingLevel[]).map(level => (
            <button
              key={level}
              onClick={() => handleStage1Selection(level)}
              disabled={disabled}
              className={`
                px-6 py-3 rounded-lg border-2 font-medium transition-all
                ${
                  stage1Choice === level
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* 2단계 선택 (1단계 선택 후에만 표시) */}
      {stage1Choice && (
        <div className='stage2-section mb-6'>
          <h4 className='text-md font-medium text-gray-800 mb-2'>
            2단계: 세분화 평가
          </h4>
          <p className='text-gray-600 mb-3'>
            당신이 '{questionText}'을(를) '
            <span className='font-medium text-blue-600'>{stage1Choice}</span>
            '으로 평가하셨습니다.
          </p>
          <p className='text-gray-600 mb-3'>
            그렇다면 '<span className='font-medium'>{stage1Choice}</span>'이라는
            평가는 다시 <span className='font-medium'>[상, 중, 하]</span> 어디에
            속하나요?
          </p>
          <div className='flex gap-3'>
            {(['상', '중', '하'] as RatingLevel[]).map(level => (
              <button
                key={level}
                onClick={() => handleStage2Selection(level)}
                disabled={disabled}
                className={`
                  px-6 py-3 rounded-lg border-2 font-medium transition-all
                  ${
                    stage2Choice === level
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 최종 점수 표시 */}
      {finalScore !== null && (
        <div className='result-section mb-4'>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <h4 className='text-md font-medium text-green-800 mb-2'>
              최종 점수
            </h4>
            <p className='text-green-700'>
              <span className='text-2xl font-bold'>{finalScore}점</span>
              <span className='text-sm ml-2'>
                (1단계: {stage1Choice}, 2단계: {stage2Choice})
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 재설정 버튼 */}
      {stage1Choice && (
        <div className='action-section'>
          <button
            onClick={resetSelection}
            disabled={disabled}
            className='px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            다시 선택하기
          </button>
        </div>
      )}
    </div>
  );
}

// 점수 계산 유틸리티 함수 (외부에서 사용 가능)
export function calculateTwoStageScore(
  stage1: RatingLevel,
  stage2: RatingLevel
): number {
  return SCORE_MAPPING[stage1][stage2];
}

// 점수를 단계별 선택으로 역변환하는 함수
export function scoreToStages(
  score: number
): { stage1: RatingLevel; stage2: RatingLevel } | null {
  for (const [stage1, stage2Map] of Object.entries(SCORE_MAPPING)) {
    for (const [stage2, mappedScore] of Object.entries(stage2Map)) {
      if (mappedScore === score) {
        return {
          stage1: stage1 as RatingLevel,
          stage2: stage2 as RatingLevel,
        };
      }
    }
  }
  return null;
}
