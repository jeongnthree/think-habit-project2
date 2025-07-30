'use client';

import { Button, Card } from '@/components/ui';
import {
  DiagnosticQuestion,
  DiagnosticSession as DiagnosticSessionType,
  TwoStageResponse,
} from '@/types/diagnosis';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TwoStageRating } from './TwoStageRating';
import { mockQuestions } from './mockQuestions';

interface DiagnosticSessionProps {
  templateId?: string;
  sessionId?: string;
  onComplete?: (sessionId: string) => void;
}

interface SessionProgress {
  answered: number;
  total: number;
  percentage: number;
}

interface CurrentQuestion extends DiagnosticQuestion {
  section_title: string;
  question_number: number;
  total_questions: number;
}

export function DiagnosticSession({
  templateId,
  sessionId,
  onComplete,
}: DiagnosticSessionProps) {
  const router = useRouter();
  const [session, setSession] = useState<DiagnosticSessionType | null>(null);
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestion | null>(null);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [progress, setProgress] = useState<SessionProgress>({
    answered: 0,
    total: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    initializeSession();
  }, [sessionId, templateId]);

  const initializeSession = async () => {
    try {
      setLoading(true);

      // 목업 세션 생성
      const mockSession: DiagnosticSessionType = {
        id: sessionId || 'mock-session-' + Date.now(),
        userId: 'mock-user',
        templateId: templateId || 'mock-template',
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        responses: [],
      };

      const firstQuestion: CurrentQuestion = {
        ...mockQuestions[0],
        question_number: 1,
        total_questions: mockQuestions.length,
      };

      setSession(mockSession);
      setCurrentQuestion(firstQuestion);
      setProgress({
        answered: 0,
        total: mockQuestions.length,
        percentage: 0,
      });
    } catch (err) {
      setError('세션을 초기화할 수 없습니다.');
      console.error('Error initializing session:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (
      !currentQuestion ||
      currentResponse === null ||
      currentResponse === undefined
    ) {
      setError('응답을 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const currentIndex = mockQuestions.findIndex(
        q => q.id === currentQuestion.id
      );
      const nextIndex = currentIndex + 1;
      const newAnswered = progress.answered + 1;
      const newPercentage = Math.round((newAnswered / progress.total) * 100);

      // 진행률 업데이트
      setProgress({
        answered: newAnswered,
        total: progress.total,
        percentage: newPercentage,
      });

      // 다음 질문이 있는지 확인
      if (nextIndex < mockQuestions.length) {
        const nextQuestion = {
          ...mockQuestions[nextIndex],
          question_number: nextIndex + 1,
          total_questions: mockQuestions.length,
        } as CurrentQuestion;
        setCurrentQuestion(nextQuestion);
        setCurrentResponse(null);
      } else {
        // 진단 완료
        setIsCompleted(true);
        onComplete?.(session?.id || 'mock-session');
      }

      // 백그라운드에서 실제 API 호출 시도 (실패해도 무시)
      try {
        await fetch(`/api/diagnosis/sessions/${session?.id}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            response_value: currentResponse,
          }),
        });
      } catch (apiError) {
        console.log('API 호출 실패, 목업 데이터로 계속 진행:', apiError);
      }
    } catch (err) {
      setError('응답 제출 중 오류가 발생했습니다.');
      console.error('Error submitting response:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'two_stage_rating':
        if (!currentQuestion.two_stage_config) {
          return <div>2단계 평가 설정이 없습니다.</div>;
        }

        return (
          <TwoStageRating
            config={currentQuestion.two_stage_config}
            value={currentResponse as TwoStageResponse}
            onChange={(value: TwoStageResponse) => setCurrentResponse(value)}
            questionText={currentQuestion.text}
          />
        );

      case 'scale':
        return (
          <div className='space-y-3'>
            <p className='text-sm text-gray-600 mb-4'>
              다음 문항에 대해 자신의 생각과 가장 가까운 답을 선택해주세요.
            </p>
            <div className='space-y-2'>
              {currentQuestion.labels?.map((label, index) => (
                <label
                  key={index}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    currentResponse === index + 1
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type='radio'
                    name='response'
                    value={index + 1}
                    checked={currentResponse === index + 1}
                    onChange={e => setCurrentResponse(parseInt(e.target.value))}
                    className='sr-only'
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      currentResponse === index + 1
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {currentResponse === index + 1 && (
                      <div className='w-2 h-2 rounded-full bg-white'></div>
                    )}
                  </div>
                  <span className='text-sm'>{label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className='flex gap-4'>
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${
                currentResponse === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type='radio'
                name='response'
                value='true'
                checked={currentResponse === true}
                onChange={() => setCurrentResponse(true)}
                className='sr-only'
              />
              <div className='font-medium'>예</div>
            </label>
            <label
              className={`flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${
                currentResponse === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type='radio'
                name='response'
                value='false'
                checked={currentResponse === false}
                onChange={() => setCurrentResponse(false)}
                className='sr-only'
              />
              <div className='font-medium'>아니오</div>
            </label>
          </div>
        );

      default:
        return <div>지원하지 않는 질문 유형입니다: {currentQuestion.type}</div>;
    }
  };

  if (loading) {
    return (
      <Card className='p-8'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-6'></div>
          <div className='h-6 bg-gray-200 rounded w-3/4 mb-4'></div>
          <div className='space-y-3'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-12 bg-gray-200 rounded'></div>
            ))}
          </div>
          <div className='flex justify-between mt-6'>
            <div className='h-10 bg-gray-200 rounded w-20'></div>
            <div className='h-10 bg-gray-200 rounded w-20'></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !currentQuestion) {
    return (
      <Card className='p-8 text-center'>
        <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          진단을 불러올 수 없습니다
        </h3>
        <p className='text-gray-600 mb-4'>{error}</p>
        <Button onClick={initializeSession} variant='outline'>
          다시 시도
        </Button>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className='p-8 text-center'>
        <CheckCircle className='h-16 w-16 text-green-500 mx-auto mb-4' />
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          진단이 완료되었습니다!
        </h2>
        <p className='text-gray-600 mb-6'>
          결과를 분석하고 있습니다. 잠시만 기다려주세요.
        </p>
        <div className='flex gap-3 justify-center'>
          <Button
            onClick={() =>
              router.push(`/diagnosis/results/${session?.id || 'mock-session'}`)
            }
          >
            결과 보기
          </Button>
          <Button variant='outline' onClick={() => router.push('/diagnosis')}>
            진단 목록으로
          </Button>
        </div>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className='p-8 text-center'>
        <div className='text-gray-400 text-6xl mb-4'>❓</div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          질문을 불러오는 중입니다
        </h3>
      </Card>
    );
  }

  return (
    <div className='max-w-4xl mx-auto'>
      {/* 진행률 표시 */}
      <div className='mb-6'>
        <div className='flex items-center justify-between text-sm text-gray-600 mb-2'>
          <span>진행률</span>
          <span>
            {progress.answered}/{progress.total} ({progress.percentage}%)
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* 질문 카드 */}
      <Card className='p-8'>
        <div className='mb-6'>
          <div className='text-sm text-blue-600 font-medium mb-2'>
            {currentQuestion.section_title}
          </div>
          <div className='text-sm text-gray-500 mb-4'>
            질문 {currentQuestion.question_number} /{' '}
            {currentQuestion.total_questions}
          </div>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            {currentQuestion.text}
          </h2>
          {currentQuestion.help_text && (
            <p className='text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg'>
              💡 {currentQuestion.help_text}
            </p>
          )}
        </div>

        {/* 질문 입력 */}
        <div className='mb-8'>{renderQuestionInput()}</div>

        {/* 에러 메시지 */}
        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        {/* 버튼 */}
        <div className='flex justify-between'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            disabled={submitting}
          >
            <ChevronLeft className='h-4 w-4 mr-1' />
            이전
          </Button>

          <Button
            onClick={submitResponse}
            disabled={
              submitting ||
              currentResponse === null ||
              currentResponse === undefined
            }
          >
            {submitting ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                제출 중...
              </div>
            ) : (
              <>
                다음
                <ChevronRight className='h-4 w-4 ml-1' />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
