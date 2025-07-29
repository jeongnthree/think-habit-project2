'use client';

import { useState } from 'react';

export default function SurveyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 40개 질문 데이터
  const questions = [
    // 흑백사고 (5문항)
    '일이 완벽하지 않으면 완전히 실패한 것이라고 생각한다.',
    '사람을 좋은 사람 또는 나쁜 사람으로만 분류하는 경향이 있다.',
    '작은 실수도 큰 실패로 느껴진다.',
    '중간 정도의 성과에 만족하기 어렵다.',
    '상황을 극단적인 관점에서 바라보는 경우가 많다.',

    // 과잉일반화 (5문항)
    '한 번 실패하면 항상 실패할 것이라고 생각한다.',
    '한 사람이 나를 거절하면 모든 사람이 나를 싫어한다고 느낀다.',
    '나쁜 일이 하나 생기면 모든 것이 잘못될 것 같다.',
    '항상, 절대, 모든 같은 단어를 자주 사용한다.',
    '과거의 부정적 경험이 미래도 같을 것이라고 확신한다.',

    // 정신적 여과 (5문항)
    '부정적인 면만 계속 생각하게 된다.',
    '좋은 일보다 나쁜 일이 더 기억에 오래 남는다.',
    '칭찬보다 비판이 더 마음에 와닿는다.',
    '작은 실수나 문제에 계속 집착하게 된다.',
    '전체적으로는 잘 되었어도 부족한 부분만 신경 쓰인다.',

    // 긍정 할인 (5문항)
    '좋은 일이 생겨도 우연히 잘된 것이라고 생각한다.',
    '칭찬을 받아도 그냥 하는 말이라고 여긴다.',
    '성공해도 별거 아니다라고 생각한다.',
    '긍정적인 피드백을 받아들이기 어렵다.',
    '좋은 결과가 나와도 다음엔 잘 안될 것이라고 생각한다.',

    // 결론 도약 (5문항)
    '충분한 근거 없이 결론을 내리는 경우가 많다.',
    '다른 사람의 표정만 보고 그들의 생각을 안다고 확신한다.',
    '미래에 나쁜 일이 일어날 것이라고 확신한다.',
    '작은 신호만으로도 큰 의미를 부여한다.',
    '상대방이 무슨 생각을 하는지 정확히 안다고 믿는다.',

    // 확대/축소 (5문항)
    '작은 문제를 크게 과장해서 생각한다.',
    '나의 장점은 별것 아니라고 생각하지만 단점은 심각하다고 여긴다.',
    '실수를 했을 때 큰일났다는 생각이 먼저 든다.',
    '다른 사람의 성취는 대단하지만 내 성취는 평범하다고 생각한다.',
    '문제 상황을 실제보다 더 심각하게 받아들인다.',

    // 감정적 추론 (5문항)
    '기분이 나쁘면 실제로 상황이 나쁘다고 생각한다.',
    '불안하면 실제로 위험한 일이 일어날 것이라고 확신한다.',
    '죄책감이 들면 정말로 잘못한 것이라고 생각한다.',
    '감정이 현실을 정확히 반영한다고 믿는다.',
    '기분에 따라 사실을 판단하는 경우가 많다.',

    // 당위적 사고 (5문항)
    '해야 한다, 하면 안 된다는 생각을 자주 한다.',
    '나의 기준에 맞지 않는 사람들을 이해하기 어렵다.',
    '완벽하게 해야 한다는 압박감을 자주 느낀다.',
    '규칙이나 원칙을 어기는 것에 대해 과도하게 죄책감을 느낀다.',
    '다른 사람도 나와 같은 기준을 가져야 한다고 생각한다.',
  ];

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  // 응답 처리
  const handleResponse = (value: number) => {
    setResponses(prev => ({
      ...prev,
      [`q${currentStep + 1}`]: value,
    }));
  };

  // 다음 단계
  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 이전 단계
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // 제출
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      console.log('🔍 제출 시작');
      console.log('📊 현재 응답:', responses);
      console.log('📈 응답 개수:', Object.keys(responses).length);
      console.log('📝 총 질문 수:', questions.length);

      const requestData = {
        responses: responses,
        metadata: {
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          deviceType: 'desktop',
        },
      };

      console.log('📤 전송 데이터:', requestData);

      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 HTTP 상태:', response.status);

      const result = await response.json();
      console.log('📥 서버 응답:', result);

      if (!response.ok) {
        console.error('❌ HTTP 오류:', response.status, result);
        throw new Error(result.error || `HTTP ${response.status}: 제출 실패`);
      }

      console.log('✅ 설문조사 제출 성공!', result);
      setIsCompleted(true);
    } catch (err) {
      console.error('❌ 제출 오류 상세:', err);
      console.error('❌ 오류 타입:', typeof err);
      console.error(
        '❌ 오류 스택:',
        err instanceof Error ? err.stack : 'No stack'
      );

      alert(
        `제출 실패: ${err instanceof Error ? err.message : JSON.stringify(err)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 완료 화면
  if (isCompleted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12'>
        <div className='max-w-2xl mx-auto px-4'>
          <div className='bg-white p-8 rounded-lg shadow-sm text-center'>
            <div className='text-6xl mb-4'>🎉</div>
            <h2 className='text-3xl font-bold text-gray-800 mb-4'>
              설문조사가 완료되었습니다!
            </h2>
            <p className='text-gray-600 mb-8'>
              귀중한 시간을 내어 설문에 참여해주셔서 감사합니다.
            </p>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg mr-3'
            >
              결과 확인하기
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className='bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg'
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 설문조사 화면
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-2xl mx-auto px-4'>
        {/* 헤더 */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            생각습관 진단 설문조사
          </h1>
          <p className='text-gray-600'>
            질문 {currentStep + 1} / {questions.length}
          </p>
        </div>

        {/* 진행률 바 */}
        <div className='mb-8'>
          <div className='bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-500 h-2 rounded-full transition-all duration-300'
              style={{
                width: `${((currentStep + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
          <p className='text-sm text-gray-500 mt-2 text-center'>
            {Math.round(((currentStep + 1) / questions.length) * 100)}% 완료
          </p>
        </div>

        {/* 질문 카드 */}
        <div className='bg-white p-8 rounded-lg shadow-sm mb-8'>
          <h2 className='text-xl font-medium text-gray-800 mb-8 leading-relaxed'>
            {currentQuestion}
          </h2>

          {/* 10점 척도 */}
          <div className='space-y-4'>
            <div className='flex justify-between text-sm text-gray-600 mb-2'>
              <span>전혀 그렇지 않다</span>
              <span>매우 그렇다</span>
            </div>

            <div className='grid grid-cols-10 gap-2'>
              {Array.from({ length: 10 }, (_, i) => {
                const value = i + 1;
                const isSelected = responses[`q${currentStep + 1}`] === value;

                return (
                  <button
                    key={value}
                    onClick={() => handleResponse(value)}
                    className={`
                      h-12 rounded-lg border-2 font-medium transition-all duration-200
                      ${
                        isSelected
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    {value}
                  </button>
                );
              })}
            </div>

            <div className='flex justify-between text-xs text-gray-500 mt-1'>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className='w-12 text-center'>
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className='flex justify-between'>
          <button
            onClick={handlePrevious}
            disabled={isSubmitting}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }
            `}
          >
            ← 이전
          </button>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg'
          >
            {isSubmitting ? '제출 중...' : isLastStep ? '제출하기' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
