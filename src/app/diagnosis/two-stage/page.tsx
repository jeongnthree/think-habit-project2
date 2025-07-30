'use client';

import TwoStageDiagnosticSession from '@/components/diagnosis/TwoStageDiagnosticSession';
import { useState } from 'react';

// 샘플 진단 질문들
const SAMPLE_QUESTIONS = [
  {
    id: '1',
    text: '당신의 성실한 정도',
    category: '성격특성',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '2',
    text: '스트레스 관리 능력',
    category: '감정관리',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '3',
    text: '목표 달성을 위한 지속성',
    category: '의지력',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '4',
    text: '새로운 상황에 대한 적응력',
    category: '적응성',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '5',
    text: '타인과의 소통 능력',
    category: '대인관계',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '6',
    text: '문제 해결 시 창의적 사고',
    category: '사고능력',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '7',
    text: '감정 조절 능력',
    category: '감정관리',
    type: 'two-stage' as const,
    required: true,
  },
  {
    id: '8',
    text: '책임감과 신뢰성',
    category: '성격특성',
    type: 'two-stage' as const,
    required: true,
  },
];

interface QuestionResponse {
  questionId: string;
  questionText: string;
  score: number;
  category: string;
}

export default function TwoStageDiagnosisPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [results, setResults] = useState<QuestionResponse[] | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleStart = () => {
    setIsStarted(true);
    setResults(null);
  };

  const handleComplete = (responses: QuestionResponse[]) => {
    setResults(responses);
    console.log('진단 완료:', responses);
  };

  const handleProgress = (current: number, total: number) => {
    setProgress({ current, total });
  };

  const handleRestart = () => {
    setIsStarted(false);
    setResults(null);
    setProgress({ current: 0, total: 0 });
  };

  const calculateCategoryScores = (responses: QuestionResponse[]) => {
    const categoryScores: Record<
      string,
      { total: number; count: number; average: number }
    > = {};

    responses.forEach(response => {
      if (!categoryScores[response.category]) {
        categoryScores[response.category] = { total: 0, count: 0, average: 0 };
      }
      categoryScores[response.category]!.total += response.score;
      categoryScores[response.category]!.count += 1;
    });

    Object.keys(categoryScores).forEach(category => {
      const data = categoryScores[category]!;
      data.average = data.total / data.count;
    });

    return categoryScores;
  };

  if (!isStarted) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='bg-white rounded-lg shadow-sm border p-8 text-center'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              2단계 평가 생각습관 진단
            </h1>
            <p className='text-lg text-gray-600 mb-6'>
              각 문항에 대해 2단계로 나누어 정확한 평가를 진행합니다.
            </p>

            <div className='bg-blue-50 rounded-lg p-6 mb-8'>
              <h2 className='text-xl font-semibold text-blue-900 mb-4'>
                진단 방식 안내
              </h2>
              <div className='text-left space-y-3'>
                <div className='flex items-start'>
                  <span className='bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5'>
                    1
                  </span>
                  <div>
                    <p className='font-medium text-blue-900'>
                      1단계: 범위 선택
                    </p>
                    <p className='text-blue-700 text-sm'>
                      각 문항에 대해 [상, 중, 하] 중 선택합니다.
                    </p>
                  </div>
                </div>
                <div className='flex items-start'>
                  <span className='bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5'>
                    2
                  </span>
                  <div>
                    <p className='font-medium text-blue-900'>
                      2단계: 세분화 평가
                    </p>
                    <p className='text-blue-700 text-sm'>
                      선택한 범위 내에서 다시 [상, 중, 하]로 세분화합니다.
                    </p>
                  </div>
                </div>
                <div className='flex items-start'>
                  <span className='bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5'>
                    ✓
                  </span>
                  <div>
                    <p className='font-medium text-green-900'>최종 점수</p>
                    <p className='text-green-700 text-sm'>
                      1-9점 스케일로 정확한 점수가 산출됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-semibold text-gray-900 mb-2'>총 문항 수</h3>
                <p className='text-2xl font-bold text-blue-600'>
                  {SAMPLE_QUESTIONS.length}개
                </p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-semibold text-gray-900 mb-2'>
                  예상 소요시간
                </h3>
                <p className='text-2xl font-bold text-green-600'>5-10분</p>
              </div>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-semibold text-gray-900 mb-2'>평가 범위</h3>
                <p className='text-2xl font-bold text-purple-600'>1-9점</p>
              </div>
            </div>

            <button
              onClick={handleStart}
              className='bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              진단 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    const categoryScores = calculateCategoryScores(results);
    const overallAverage =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;

    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='bg-white rounded-lg shadow-sm border p-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-6 text-center'>
              진단 결과
            </h1>

            {/* 전체 요약 */}
            <div className='bg-blue-50 rounded-lg p-6 mb-8'>
              <h2 className='text-xl font-semibold text-blue-900 mb-4'>
                전체 요약
              </h2>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <p className='text-sm text-blue-700'>전체 평균</p>
                  <p className='text-2xl font-bold text-blue-900'>
                    {overallAverage.toFixed(1)}점
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-blue-700'>최고 점수</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {Math.max(...results.map(r => r.score))}점
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-blue-700'>최저 점수</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {Math.min(...results.map(r => r.score))}점
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-sm text-blue-700'>완료 문항</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {results.length}개
                  </p>
                </div>
              </div>
            </div>

            {/* 카테고리별 점수 */}
            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                카테고리별 점수
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {Object.entries(categoryScores).map(([category, data]) => (
                  <div key={category} className='bg-gray-50 rounded-lg p-4'>
                    <h3 className='font-medium text-gray-900 mb-2'>
                      {category}
                    </h3>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>평균 점수</span>
                      <span className='text-lg font-bold text-blue-600'>
                        {data.average.toFixed(1)}점
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-gray-600'>문항 수</span>
                      <span className='text-sm text-gray-800'>
                        {data.count}개
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 상세 결과 */}
            <div className='mb-8'>
              <h2 className='text-xl font-semibold text-gray-900 mb-4'>
                상세 결과
              </h2>
              <div className='space-y-3'>
                {results.map((response, index) => (
                  <div
                    key={response.questionId}
                    className='bg-gray-50 rounded-lg p-4'
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <p className='font-medium text-gray-900'>
                          {index + 1}. {response.questionText}
                        </p>
                        <p className='text-sm text-gray-600 mt-1'>
                          카테고리: {response.category}
                        </p>
                      </div>
                      <div className='text-right ml-4'>
                        <p className='text-2xl font-bold text-blue-600'>
                          {response.score}점
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='text-center'>
              <button
                onClick={handleRestart}
                className='bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors'
              >
                다시 진단하기
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
        <TwoStageDiagnosticSession
          questions={SAMPLE_QUESTIONS}
          onComplete={handleComplete}
          onProgress={handleProgress}
        />
      </div>
    </div>
  );
}
