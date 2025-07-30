'use client';

import {
  DiagnosticQuestion,
  DiagnosticTemplate,
  QuestionResponse,
} from '@/types/diagnosis';
import { ArrowLeft, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 샘플 템플릿 데이터 (실제로는 API에서 가져와야 함)
const SAMPLE_TEMPLATES: Record<string, DiagnosticTemplate> = {
  'basic-thinking-habits': {
    id: 'basic-thinking-habits',
    title: '기본 생각습관 진단',
    description: '일상적인 사고 패턴과 습관을 종합적으로 평가합니다.',
    category: '기본진단',
    estimatedTime: 15,
    questionCount: 20,
    difficulty: 'beginner',
    tags: ['기본', '종합평가', '추천'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
};

// 샘플 질문 데이터
const SAMPLE_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: '1',
    text: '새로운 상황에 직면했을 때 얼마나 빨리 적응하시나요?',
    category: '적응성',
    type: 'two-stage',
    required: true,
  },
  {
    id: '2',
    text: '스트레스를 받을 때 감정을 조절하는 능력은 어느 정도인가요?',
    category: '감정관리',
    type: 'two-stage',
    required: true,
  },
  {
    id: '3',
    text: '목표를 설정하고 지속적으로 추진하는 능력은?',
    category: '의지력',
    type: 'two-stage',
    required: true,
  },
  {
    id: '4',
    text: '다른 사람과의 의사소통에서 자신의 의견을 명확히 전달하는 능력은?',
    category: '대인관계',
    type: 'two-stage',
    required: true,
  },
  {
    id: '5',
    text: '복잡한 문제를 해결할 때 논리적으로 접근하는 능력은?',
    category: '사고능력',
    type: 'two-stage',
    required: true,
  },
];

export default function DiagnosticSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params?.id as string;
  const templateId = searchParams?.get('templateId');

  const [template, setTemplate] = useState<DiagnosticTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (templateId && SAMPLE_TEMPLATES[templateId]) {
      setTemplate(SAMPLE_TEMPLATES[templateId]);
    }
  }, [templateId]);

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex]!;
  const isLastQuestion = currentQuestionIndex === SAMPLE_QUESTIONS.length - 1;

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleResponse = (response: QuestionResponse) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (isLastQuestion) {
      // 결과 페이지로 이동
      const resultsData = {
        sessionId,
        templateId,
        responses: newResponses,
        completedAt: new Date().toISOString(),
      };

      // 실제로는 API에 저장하고 결과 페이지로 이동
      localStorage.setItem(
        `diagnosis_results_${sessionId}`,
        JSON.stringify(resultsData)
      );
      window.location.href = `/diagnosis/results/${sessionId}`;
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setResponses(prev => prev.slice(0, -1));
    }
  };

  if (!template) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            진단 템플릿을 찾을 수 없습니다
          </h1>
          <Link
            href='/diagnosis'
            className='text-blue-600 hover:text-blue-700 font-medium'
          >
            진단 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='bg-white rounded-lg shadow-sm border p-8'>
            <div className='flex items-center mb-6'>
              <Link
                href='/diagnosis'
                className='flex items-center text-gray-600 hover:text-gray-900 mr-4'
              >
                <ArrowLeft className='w-5 h-5 mr-1' />
                돌아가기
              </Link>
            </div>

            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-900 mb-4'>
                {template.title}
              </h1>
              <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                {template.description}
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
              <div className='bg-blue-50 rounded-lg p-6 text-center'>
                <Clock className='w-8 h-8 text-blue-600 mx-auto mb-2' />
                <h3 className='font-semibold text-gray-900 mb-1'>예상 시간</h3>
                <p className='text-blue-600 font-medium'>
                  {template.estimatedTime}분
                </p>
              </div>
              <div className='bg-green-50 rounded-lg p-6 text-center'>
                <Users className='w-8 h-8 text-green-600 mx-auto mb-2' />
                <h3 className='font-semibold text-gray-900 mb-1'>총 문항</h3>
                <p className='text-green-600 font-medium'>
                  {SAMPLE_QUESTIONS.length}개
                </p>
              </div>
              <div className='bg-purple-50 rounded-lg p-6 text-center'>
                <div className='w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2'>
                  <span className='text-white font-bold text-sm'>2</span>
                </div>
                <h3 className='font-semibold text-gray-900 mb-1'>평가 방식</h3>
                <p className='text-purple-600 font-medium'>2단계 평가</p>
              </div>
            </div>

            <div className='bg-yellow-50 rounded-lg p-6 mb-8'>
              <h3 className='font-semibold text-yellow-900 mb-3'>진단 안내</h3>
              <ul className='space-y-2 text-yellow-800'>
                <li>• 각 문항에 대해 2단계로 나누어 평가합니다</li>
                <li>
                  • 1단계에서 전체적인 범위를 선택하고, 2단계에서 세부 평가를
                  진행합니다
                </li>
                <li>• 솔직하고 정확한 답변이 더 나은 결과를 제공합니다</li>
                <li>• 중간에 나가더라도 진행 상황이 저장됩니다</li>
              </ul>
            </div>

            <div className='text-center'>
              <button
                onClick={handleStart}
                className='bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
              >
                진단 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        <div className='mb-6'>
          <div className='flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>
              {template.title}
            </h1>
            <span className='text-sm text-gray-500'>세션 ID: {sessionId}</span>
          </div>
        </div>

        <TwoStageQuestionComponent
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={SAMPLE_QUESTIONS.length}
          onResponse={handleResponse}
          onPrevious={currentQuestionIndex > 0 ? handlePrevious : undefined}
        />
      </div>
    </div>
  );
}

// 2단계 질문 컴포넌트
interface TwoStageQuestionComponentProps {
  question: DiagnosticQuestion;
  questionNumber: number;
  totalQuestions: number;
  onResponse: (response: QuestionResponse) => void;
  onPrevious?: () => void;
}

function TwoStageQuestionComponent({
  question,
  questionNumber,
  totalQuestions,
  onResponse,
  onPrevious,
}: TwoStageQuestionComponentProps) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [stage1Choice, setStage1Choice] = useState<
    'high' | 'medium' | 'low' | null
  >(null);

  const calculateScore = (
    stage1: 'high' | 'medium' | 'low',
    stage2: 'high' | 'medium' | 'low'
  ): number => {
    const stage1Scores = { high: 7, medium: 4, low: 1 };
    const stage2Adjustments = { high: 2, medium: 0, low: -2 };
    return Math.max(
      1,
      Math.min(9, stage1Scores[stage1] + stage2Adjustments[stage2])
    );
  };

  const handleStage1Choice = (choice: 'high' | 'medium' | 'low') => {
    setStage1Choice(choice);
    setStage(2);
  };

  const handleStage2Choice = (choice: 'high' | 'medium' | 'low') => {
    if (!stage1Choice) return;

    const score = calculateScore(stage1Choice, choice);
    const response: QuestionResponse = {
      questionId: question.id,
      questionText: question.text,
      score,
      category: question.category,
      stage1Choice,
      stage2Choice: choice,
      timestamp: new Date().toISOString(),
    };

    onResponse(response);
  };

  const getChoiceText = (
    choice: 'high' | 'medium' | 'low',
    currentStage: 1 | 2
  ) => {
    if (currentStage === 1) {
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

  return (
    <div className='bg-white rounded-lg shadow-sm border p-8'>
      {/* 진행률 */}
      <div className='mb-8'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium text-gray-700'>
            진행률: {questionNumber} / {totalQuestions}
          </span>
          <span className='text-sm text-gray-500'>
            {Math.round((questionNumber / totalQuestions) * 100)}%
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* 질문 */}
      <div className='mb-8'>
        <div className='flex items-center mb-4'>
          <span className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium'>
            {question.category}
          </span>
          <span className='ml-3 text-sm text-gray-500'>
            {stage}단계 / 2단계
          </span>
        </div>

        <h2 className='text-2xl font-bold text-gray-900 mb-4'>
          {question.text}
        </h2>

        <p className='text-gray-600 mb-6'>
          {stage === 1
            ? '먼저 전체적인 범위를 선택해주세요.'
            : `'${stage1Choice === 'high' ? '상' : stage1Choice === 'medium' ? '중' : '하'}' 범위 내에서 더 구체적으로 평가해주세요.`}
        </p>
      </div>

      {/* 1단계 선택 표시 */}
      {stage === 2 && stage1Choice && (
        <div className='bg-blue-50 rounded-lg p-4 mb-6'>
          <p className='text-sm text-blue-700 mb-2'>1단계에서 선택한 범위:</p>
          <p className='font-medium text-blue-900'>
            {getChoiceText(stage1Choice, 1)}
          </p>
        </div>
      )}

      {/* 선택 옵션 */}
      <div className='space-y-3 mb-8'>
        {(['high', 'medium', 'low'] as const).map(choice => (
          <button
            key={choice}
            onClick={() => {
              if (stage === 1) {
                handleStage1Choice(choice);
              } else {
                handleStage2Choice(choice);
              }
            }}
            className='w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200'
          >
            <span className='font-medium text-gray-900'>
              {getChoiceText(choice, stage)}
            </span>
          </button>
        ))}
      </div>

      {/* 네비게이션 */}
      <div className='flex justify-between'>
        <button
          onClick={() => {
            if (stage === 2) {
              setStage(1);
              setStage1Choice(null);
            } else if (onPrevious) {
              onPrevious();
            }
          }}
          disabled={!onPrevious && stage === 1}
          className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          이전
        </button>

        <div className='text-sm text-gray-500 flex items-center'>
          {stage === 1 ? '범위를 선택하세요' : '세부 평가를 선택하세요'}
        </div>
      </div>
    </div>
  );
}
