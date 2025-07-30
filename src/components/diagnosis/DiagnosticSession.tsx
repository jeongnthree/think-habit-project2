'use client';

import { Button, Card } from '@/components/ui';
import {
  DiagnosticQuestion,
  DiagnosticSession as DiagnosticSessionType,
} from '@/types/diagnosis';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    if (templateId) {
      createNewSession();
    } else {
      // 목업 모드: 바로 첫 번째 질문 시작
      const mockSession = {
        id: sessionId || 'mock-session-' + Date.now(),
        userId: 'mock-user',
        templateId: templateId || 'mock-template',
        status: 'in_progress' as const,
        startedAt: new Date().toISOString(),
        responses: [],
      };

      const mockFirstQuestion = {
        id: 'perfectionism_1',
        text: '일을 할 때 완벽하지 않으면 의미가 없다고 생각한다',
        category: 'perfectionism',
        type: 'scale' as const,
        required: true,
        scale: 5,
        labels: [
          '전혀 그렇지 않다',
          '그렇지 않다',
          '보통이다',
          '그렇다',
          '매우 그렇다',
        ],
        section_title: '완벽주의 성향',
        question_number: 1,
        total_questions: 8,
      };

      setSession(mockSession);
      setCurrentQuestion(mockFirstQuestion);
      setProgress({
        answered: 0,
        total: 8,
        percentage: 0,
      });
      setLoading(false);
    }
  }, [sessionId, templateId]);

  const createNewSession = async () => {
    try {
      setLoading(true);

      // API 호출 시도
      try {
        const response = await fetch('/api/diagnosis/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSession(data.data.session);
          setCurrentQuestion(data.data.first_question);
          setProgress({
            answered: 0,
            total: data.data.template.total_questions,
            percentage: 0,
          });
          return;
        }
      } catch (apiError) {
        console.log('API 호출 실패, 목업 데이터 사용:', apiError);
      }

      // API 실패 시 목업 데이터 사용
      const mockSession = {
        id: 'mock-session-' + Date.now(),
        userId: 'mock-user',
        templateId: templateId,
        status: 'in_progress' as const,
        startedAt: new Date().toISOString(),
        responses: [],
      };

      const mockFirstQuestion = {
        id: 'perfectionism_1',
        text: '일을 할 때 완벽하지 않으면 의미가 없다고 생각한다',
        category: 'perfectionism',
        type: 'scale' as const,
        required: true,
        scale: 5,
        labels: [
          '전혀 그렇지 않다',
          '그렇지 않다',
          '보통이다',
          '그렇다',
          '매우 그렇다',
        ],
        section_title: '완벽주의 성향',
        question_number: 1,
        total_questions: 8,
      };

      setSession(mockSession);
      setCurrentQuestion(mockFirstQuestion);
      setProgress({
        answered: 0,
        total: 8,
        percentage: 0,
      });
    } catch (err) {
      setError('Network error occurred');
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionData = async () => {
    // 목업 모드: API 호출 없이 바로 목업 데이터 사용
    console.log('목업 모드: fetchSessionData 스킵');
    setLoading(false);
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

      // 목업 질문 데이터 (8개 질문으로 확장)
      const mockQuestions = [
        {
          id: 'perfectionism_1',
          text: '일을 할 때 완벽하지 않으면 의미가 없다고 생각한다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '완벽주의 성향',
        },
        {
          id: 'perfectionism_2',
          text: '실수를 하면 자신을 심하게 비난한다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '완벽주의 성향',
        },
        {
          id: 'blackwhite_1',
          text: '사람이나 상황을 좋거나 나쁘게만 판단한다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '흑백논리 성향',
        },
        {
          id: 'catastrophic_1',
          text: '작은 문제가 생기면 최악의 상황을 먼저 생각한다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '파국적 사고 성향',
        },
        {
          id: 'personalization_1',
          text: '나쁜 일이 생기면 내 탓이라고 생각한다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '개인화 사고 성향',
        },
        {
          id: 'emotional_1',
          text: '기분이 나쁘면 실제로 나쁜 일이 일어날 것이라고 생각한다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '감정적 추론 성향',
        },
        {
          id: 'perfectionism_3',
          text: '완벽하게 할 수 없다면 아예 시작하지 않는다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '완벽주의 성향',
        },
        {
          id: 'blackwhite_2',
          text: '중간 지점이나 회색 영역을 인정하기 어렵다',
          type: 'likert' as const,
          scale: 5,
          labels: [
            '전혀 그렇지 않다',
            '그렇지 않다',
            '보통이다',
            '그렇다',
            '매우 그렇다',
          ],
          section_title: '흑백논리 성향',
        },
      ];

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
          total_questions: progress.total,
        };
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
      setError('Network error occurred');
      console.error('Error submitting response:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'likert':
        return (
          <div className='space-y-3'>
            <p className='text-sm text-gray-600 mb-4'>
              다음 문항에 대해 자신의 생각과 가장 가까운 답을 선택해주세요.
            </p>
            <div className='space-y-2'>
              {currentQuestion.labels?.map((label, index) => (
                <label
                  key={index}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentResponse === index + 1
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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

      case 'multiple_choice':
        return (
          <div className='space-y-2'>
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentResponse === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type='radio'
                  name='response'
                  value={option}
                  checked={currentResponse === option}
                  onChange={e => setCurrentResponse(e.target.value)}
                  className='sr-only'
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    currentResponse === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {currentResponse === option && (
                    <div className='w-2 h-2 rounded-full bg-white'></div>
                  )}
                </div>
                <span className='text-sm'>{option}</span>
              </label>
            ))}
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

      case 'text':
        return (
          <textarea
            value={currentResponse || ''}
            onChange={e => setCurrentResponse(e.target.value)}
            placeholder='자유롭게 답변해주세요...'
            className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            rows={4}
          />
        );

      default:
        return <div>지원하지 않는 질문 유형입니다.</div>;
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
        <Button onClick={fetchSessionData} variant='outline'>
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
    <div className='max-w-2xl mx-auto'>
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
            <p className='text-sm text-gray-600 mb-4'>
              {currentQuestion.help_text}
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
            className={`${
              currentResponse !== null && currentResponse !== undefined
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                제출 중...
              </div>
            ) : currentResponse === null || currentResponse === undefined ? (
              <>
                답변을 선택해주세요
                <ChevronRight className='h-4 w-4 ml-1 opacity-50' />
              </>
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
