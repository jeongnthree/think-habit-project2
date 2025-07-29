// components/survey/SurveyForm.tsx
'use client';

import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProgressBar from './ProgressBar';
import RadioQuestion, { RadioOption } from './RadioQuestion';
import ScaleQuestion from './ScaleQuestion';

// 질문 타입
export type QuestionType = 'radio' | 'scale';

// 질문 인터페이스
export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  required?: boolean;

  // RadioQuestion용
  options?: RadioOption[];

  // ScaleQuestion용
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

// 설문조사 데이터
export interface SurveyData {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

// 응답 데이터
export interface SurveyResponse {
  [questionId: string]: string | number;
}

// SurveyForm 컴포넌트 Props
export interface SurveyFormProps {
  survey: SurveyData;
  initialResponses?: SurveyResponse;
  onSubmit?: (responses: SurveyResponse) => void;
  onSave?: (responses: SurveyResponse) => void;
  onCancel?: () => void;
  showProgress?: boolean;
  allowNavigation?: boolean;
  autoSave?: boolean;
  className?: string;
}

/**
 * 전체 설문조사를 관리하는 메인 폼 컴포넌트
 *
 * @example
 * ```tsx
 * <SurveyForm
 *   survey={surveyData}
 *   onSubmit={handleSubmit}
 *   showProgress
 *   allowNavigation
 * />
 * ```
 */
export default function SurveyForm({
  survey,
  initialResponses = {},
  onSubmit,
  onSave,
  onCancel,
  showProgress = true,
  allowNavigation = true,
  autoSave = false,
  className = '',
}: SurveyFormProps) {
  // 상태 관리
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse>(initialResponses);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentQuestion = survey.questions[currentStep];
  const isLastStep = currentStep === survey.questions.length - 1;
  const isFirstStep = currentStep === 0;

  // 현재 질문이 없으면 에러 처리
  if (!currentQuestion) {
    return (
      <div className='text-center p-8'>
        <p className='text-red-500'>설문조사 데이터에 오류가 있습니다.</p>
      </div>
    );
  }

  /**
   * 자동 저장
   */
  useEffect(() => {
    if (autoSave && onSave && Object.keys(responses).length > 0) {
      const saveTimer = setTimeout(() => {
        handleSave();
      }, 2000); // 2초 후 자동 저장

      return () => clearTimeout(saveTimer);
    }
    return undefined;
  }, [responses, autoSave, onSave]);

  /**
   * 응답 변경 핸들러
   */
  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));

    // 해당 질문의 에러 제거
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  /**
   * 현재 질문 검증
   */
  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion || !currentQuestion.required) return true;

    const response = responses[currentQuestion.id];
    if (response === undefined || response === null || response === '') {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: '이 질문은 필수입니다.',
      }));
      return false;
    }

    return true;
  };

  /**
   * 전체 폼 검증
   */
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    survey.questions.forEach(question => {
      if (question.required) {
        const response = responses[question.id];
        if (response === undefined || response === null || response === '') {
          newErrors[question.id] = '이 질문은 필수입니다.';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 다음 단계로 이동
   */
  const handleNext = () => {
    if (!validateCurrentQuestion()) return;

    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, survey.questions.length - 1));
    }
  };

  /**
   * 이전 단계로 이동
   */
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  /**
   * 특정 단계로 이동
   */
  const handleStepClick = (step: number) => {
    if (allowNavigation) {
      setCurrentStep(step);
    }
  };

  /**
   * 임시 저장
   */
  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(responses);
      setLastSaved(new Date());
    } catch (error) {
      console.error('저장 중 오류:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 최종 제출
   */
  const handleSubmit = async () => {
    if (!validateForm() || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(responses);
    } catch (error) {
      console.error('제출 중 오류:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 질문 컴포넌트 렌더링
   */
  const renderQuestion = (question: SurveyQuestion) => {
    const value = responses[question.id];
    const error = errors[question.id];

    switch (question.type) {
      case 'radio':
        return (
          <RadioQuestion
            id={question.id}
            question={question.question}
            description={question.description}
            options={question.options}
            selectedValue={typeof value === 'string' ? value : undefined}
            onChange={val => handleResponseChange(question.id, val)}
            required={question.required}
            error={error}
          />
        );

      case 'scale':
        return (
          <ScaleQuestion
            id={question.id}
            question={question.question}
            description={question.description}
            min={question.min}
            max={question.max}
            minLabel={question.minLabel}
            maxLabel={question.maxLabel}
            selectedValue={typeof value === 'number' ? value : undefined}
            onChange={val => handleResponseChange(question.id, val)}
            required={question.required}
            error={error}
          />
        );

      default:
        return <div>지원하지 않는 질문 타입입니다.</div>;
    }
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-8 ${className}`}>
      {/* 설문조사 헤더 */}
      <div className='text-center space-y-2'>
        <h1 className='text-2xl font-bold text-gray-900'>{survey.title}</h1>
        {survey.description && (
          <p className='text-gray-600'>{survey.description}</p>
        )}
      </div>

      {/* 진행률 표시 */}
      {showProgress && (
        <ProgressBar
          current={currentStep + 1}
          total={survey.questions.length}
          style='bar'
          label='진행률'
          showPercentage
          showSteps
          onStepClick={allowNavigation ? handleStepClick : undefined}
        />
      )}

      {/* 현재 질문 */}
      <div className='bg-white p-8 rounded-lg shadow-sm border border-gray-200'>
        <div className='mb-6'>
          <span className='text-sm text-gray-500'>
            질문 {currentStep + 1} / {survey.questions.length}
          </span>
        </div>

        {/* 현재 질문이 존재할 때만 렌더링 */}
        {currentQuestion && renderQuestion(currentQuestion)}
      </div>

      {/* 네비게이션 버튼 */}
      <div className='flex justify-between items-center'>
        <div className='flex space-x-3'>
          {/* 이전 버튼 */}
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`
              flex items-center px-4 py-2 rounded-md border text-sm font-medium transition-colors
              ${
                isFirstStep
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <ChevronLeft className='w-4 h-4 mr-1' />
            이전
          </button>

          {/* 저장 버튼 */}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className='flex items-center px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50'
            >
              <Save className='w-4 h-4 mr-1' />
              {isSaving ? '저장 중...' : '임시저장'}
            </button>
          )}
        </div>

        <div className='flex space-x-3'>
          {/* 취소 버튼 */}
          {onCancel && (
            <button
              onClick={onCancel}
              className='px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors'
            >
              취소
            </button>
          )}

          {/* 다음/제출 버튼 */}
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className='flex items-center px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50'
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                제출 중...
              </>
            ) : isLastStep ? (
              <>
                <Check className='w-4 h-4 mr-1' />
                제출하기
              </>
            ) : (
              <>
                다음
                <ChevronRight className='w-4 h-4 ml-1' />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 자동 저장 상태 */}
      {autoSave && lastSaved && (
        <div className='text-center'>
          <span className='text-xs text-gray-500'>
            마지막 저장: {lastSaved.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 샘플 설문조사 데이터
 */
export const sampleSurveyData: SurveyData = {
  id: 'sample-survey',
  title: '생각습관 진단 설문조사',
  description:
    '당신의 생각습관을 파악하기 위한 간단한 설문조사입니다. 총 5분 정도 소요됩니다.',
  questions: [
    {
      id: 'stress-level',
      type: 'scale',
      question: '평소 스트레스 수준은 어느 정도인가요?',
      description: '지난 한 달 동안의 전반적인 스트레스 정도를 평가해주세요.',
      min: 1,
      max: 10,
      minLabel: '전혀 없음',
      maxLabel: '극심함',
      required: true,
    },
    {
      id: 'sleep-quality',
      type: 'radio',
      question: '최근 수면의 질은 어떠신가요?',
      options: [
        { value: '5', label: '매우 좋음' },
        { value: '4', label: '좋음' },
        { value: '3', label: '보통' },
        { value: '2', label: '나쁨' },
        { value: '1', label: '매우 나쁨' },
      ],
      required: true,
    },
    {
      id: 'exercise-frequency',
      type: 'radio',
      question: '일주일에 운동하는 횟수는?',
      options: [
        { value: '0', label: '전혀 하지 않음' },
        { value: '1-2', label: '1-2회' },
        { value: '3-4', label: '3-4회' },
        { value: '5+', label: '5회 이상' },
      ],
      required: false,
    },
    {
      id: 'life-satisfaction',
      type: 'scale',
      question: '현재 삶에 대한 전반적인 만족도는?',
      min: 1,
      max: 10,
      minLabel: '매우 불만족',
      maxLabel: '매우 만족',
      required: true,
    },
  ],
};
