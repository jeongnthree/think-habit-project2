/**
 * 2단계 진단 세션 컴포넌트
 */

'use client';

import { DiagnosticQuestion, QuestionResponse } from '@/types/diagnosis';
import { useState } from 'react';

interface TwoStageDiagnosticSessionProps {
  questions: DiagnosticQuestion[];
  onComplete: (responses: QuestionResponse[]) => void;
  onProgress?: (current: number, total: number) => void;
}

type StageChoice = 'high' | 'medium' | 'low';

export default function TwoStageDiagnosticSession({
  questions,
  onComplete,
  onProgress,
}: TwoStageDiagnosticSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState<1 | 2>(1);
  const [stage1Choice, setStage1Choice] = useState<StageChoice | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // 2단계 선택에 따른 점수 계산
  const calculateScore = (stage1: StageChoice, stage2: StageChoice): number => {
    const stage1Scores = { high: 7, medium: 4, low: 1 };
    const stage2Adjustments = { high: 2, medium: 0, low: -2 };

    return Math.max(
      1,
      Math.min(9, stage1Scores[stage1] + stage2Adjustments[stage2])
    );
  };

  const handleStage1Choice = (choice: StageChoice) => {
    setStage1Choice(choice);
    setCurrentStage(2);
  };

  const handleStage2Choice = (choice: StageChoice) => {
    if (!stage1Choice) return;

    const score = calculateScore(stage1Choice, choice);
    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      score,
      category: currentQuestion.category,
      stage1Choice,
      stage2Choice: choice,
      timestamp: new Date().toISOString(),
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    // 진행률 업데이트
    if (onProgress) {
      onProgress(currentQuestionIndex + 1, questions.length);
    }

    if (isLastQuestion) {
      // 진단 완료
      onComplete(newResponses);
    } else {
      // 다음 질문으로
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentStage(1);
      setStage1Choice(null);
    }
  };

  const handlePrevious = () => {
    if (currentStage === 2) {
      setCurrentStage(1);
      setStage1Choice(null);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentStage(1);
      setStage1Choice(null);
      // 이전 응답 제거
      setResponses(prev => prev.slice(0, -1));
      if (onProgress) {
        onProgress(currentQuestionIndex, questions.length);
      }
    }
  };

  const getChoiceText = (choice: StageChoice, stage: 1 | 2) => {
    if (stage === 1) {
      switch (choice) {
        case 'high':
          return '상 (높음)';
        case 'medium':
          return '중 (보통)';
        case 'low':
          return '하 (낮음)';
      }
    } else {
      if (!stage1Choice) return '';
      const baseText =
        stage1Choice === 'high'
          ? '상'
          : stage1Choice === 'medium'
            ? '중'
            : '하';
      switch (choice) {
        case 'high':
          return `${baseText} 범위에서 높음`;
        case 'medium':
          return `${baseText} 범위에서 보통`;
        case 'low':
          return `${baseText} 범위에서 낮음`;
      }
    }
  };

  const getStageDescription = () => {
    if (currentStage === 1) {
      return '먼저 전체적인 범위를 선택해주세요.';
    } else {
      const rangeText =
        stage1Choice === 'high'
          ? '상'
          : stage1Choice === 'medium'
            ? '중'
            : '하';
      return `'${rangeText}' 범위 내에서 더 구체적으로 평가해주세요.`;
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border p-8'>
      {/* 진행률 표시 */}
      <div className='mb-8'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium text-gray-700'>
            진행률: {currentQuestionIndex + 1} / {questions.length}
          </span>
          <span className='text-sm text-gray-500'>
            {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 질문 표시 */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <span className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium'>
            {currentQuestion.category}
          </span>
          <span className='ml-3 text-sm text-gray-500'>
            {currentStage}단계 / 2단계
          </span>
        </div>

        <h2 className='text-2xl font-bold text-gray-900 mb-4'>
          {currentQuestion.text}
        </h2>

        <p className='text-gray-600 mb-6'>{getStageDescription()}</p>
      </div>

      {/* 1단계 선택 표시 (2단계일 때) */}
      {currentStage === 2 && stage1Choice && (
        <div className='bg-blue-50 rounded-lg p-4 mb-6'>
          <p className='text-sm text-blue-700 mb-2'>1단계에서 선택한 범위:</p>
          <p className='font-medium text-blue-900'>
            {getChoiceText(stage1Choice, 1)}
          </p>
        </div>
      )}

      {/* 선택 옵션 */}
      <div className='space-y-3 mb-8'>
        {(['high', 'medium', 'low'] as StageChoice[]).map(choice => (
          <button
            key={choice}
            onClick={() => {
              if (currentStage === 1) {
                handleStage1Choice(choice);
              } else {
                handleStage2Choice(choice);
              }
            }}
            className='w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <div className='flex items-center justify-between'>
              <span className='font-medium text-gray-900'>
                {getChoiceText(choice, currentStage)}
              </span>
              <div className='w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center'>
                <div className='w-3 h-3 bg-blue-600 rounded-full opacity-0 transition-opacity duration-200' />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 네비게이션 버튼 */}
      <div className='flex justify-between'>
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 && currentStage === 1}
          className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          이전
        </button>

        <div className='text-sm text-gray-500 flex items-center'>
          {currentStage === 1 ? '범위를 선택하세요' : '세부 평가를 선택하세요'}
        </div>
      </div>
    </div>
  );
}
