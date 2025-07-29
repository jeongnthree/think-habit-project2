'use client';

import { DiagnosticResults, QuestionResponse } from '@/types/diagnosis';
import {
  ArrowLeft,
  BarChart3,
  Download,
  Share2,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ResultsData {
  sessionId: string;
  templateId: string;
  responses: QuestionResponse[];
  completedAt: string;
}

export default function DiagnosticResultsPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  useEffect(() => {
    // 실제로는 API에서 가져와야 함
    const savedData = localStorage.getItem(`diagnosis_results_${sessionId}`);
    if (savedData) {
      const data: ResultsData = JSON.parse(savedData);
      setResultsData(data);

      // 결과 계산
      const calculatedResults = calculateResults(data.responses);
      setResults(calculatedResults);
    }
  }, [sessionId]);

  const calculateResults = (
    responses: QuestionResponse[]
  ): DiagnosticResults => {
    const overallScore =
      responses.reduce((sum, r) => sum + r.score, 0) / responses.length;

    // 카테고리별 점수 계산
    const categoryScores: Record<
      string,
      { average: number; total: number; count: number }
    > = {};

    responses.forEach(response => {
      if (!categoryScores[response.category]) {
        categoryScores[response.category] = { total: 0, count: 0, average: 0 };
      }
      categoryScores[response.category].total += response.score;
      categoryScores[response.category].count += 1;
    });

    Object.keys(categoryScores).forEach(category => {
      const data = categoryScores[category];
      data.average = data.total / data.count;
    });

    // 강점과 개선점 분석
    const sortedCategories = Object.entries(categoryScores).sort(
      ([, a], [, b]) => b.average - a.average
    );

    const strengths = sortedCategories
      .slice(0, 2)
      .map(([category]) => category);

    const improvements = sortedCategories
      .slice(-2)
      .map(([category]) => category);

    // 추천사항 생성
    const recommendations = generateRecommendations(
      overallScore,
      categoryScores
    );

    return {
      overallScore,
      categoryScores,
      strengths,
      improvements,
      recommendations,
      completedAt: new Date().toISOString(),
    };
  };

  const generateRecommendations = (
    overallScore: number,
    categoryScores: Record<
      string,
      { average: number; total: number; count: number }
    >
  ): string[] => {
    const recommendations: string[] = [];

    if (overallScore >= 7) {
      recommendations.push(
        '전반적으로 우수한 생각습관을 보이고 있습니다. 현재 수준을 유지하며 지속적인 발전을 위해 노력하세요.'
      );
    } else if (overallScore >= 5) {
      recommendations.push(
        '보통 수준의 생각습관을 가지고 있습니다. 약점 영역을 집중적으로 개선해보세요.'
      );
    } else {
      recommendations.push(
        '생각습관 개선이 필요합니다. 체계적인 훈련을 통해 점진적으로 발전시켜 나가세요.'
      );
    }

    // 카테고리별 추천
    const lowestCategory = Object.entries(categoryScores).sort(
      ([, a], [, b]) => a.average - b.average
    )[0];

    if (lowestCategory) {
      const [category, score] = lowestCategory;
      if (score.average < 5) {
        recommendations.push(
          `${category} 영역의 집중적인 개선이 필요합니다. 관련 훈련 프로그램을 추천드립니다.`
        );
      }
    }

    recommendations.push(
      '정기적인 진단을 통해 개선 상황을 점검하시기 바랍니다.'
    );

    return recommendations;
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 7) return 'bg-green-50 border-green-200';
    if (score >= 5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const handleDownload = () => {
    if (!results || !resultsData) return;

    const reportData = {
      sessionId,
      completedAt: resultsData.completedAt,
      overallScore: results.overallScore,
      categoryScores: results.categoryScores,
      responses: resultsData.responses,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnosis_report_${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!resultsData || !results) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            결과를 불러오는 중...
          </h1>
          <p className='text-gray-600'>진단 결과를 찾을 수 없습니다.</p>
          <Link
            href='/diagnosis'
            className='text-blue-600 hover:text-blue-700 font-medium mt-4 inline-block'
          >
            진단 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* 헤더 */}
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center'>
            <Link
              href='/diagnosis'
              className='flex items-center text-gray-600 hover:text-gray-900 mr-6'
            >
              <ArrowLeft className='w-5 h-5 mr-1' />
              진단 목록
            </Link>
            <h1 className='text-3xl font-bold text-gray-900'>진단 결과</h1>
          </div>

          <div className='flex space-x-3'>
            <button
              onClick={handleDownload}
              className='flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
            >
              <Download className='w-4 h-4 mr-2' />
              다운로드
            </button>
            <button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
              <Share2 className='w-4 h-4 mr-2' />
              공유하기
            </button>
          </div>
        </div>

        {/* 전체 요약 */}
        <div
          className={`rounded-lg border-2 p-8 mb-8 ${getScoreBackground(results.overallScore)}`}
        >
          <div className='text-center'>
            <div className='flex items-center justify-center mb-4'>
              <BarChart3 className='w-8 h-8 text-gray-600 mr-3' />
              <h2 className='text-2xl font-bold text-gray-900'>
                전체 평균 점수
              </h2>
            </div>
            <div
              className={`text-6xl font-bold mb-4 ${getScoreColor(results.overallScore)}`}
            >
              {results.overallScore.toFixed(1)}
            </div>
            <p className='text-lg text-gray-600'>
              9점 만점 중 {results.overallScore.toFixed(1)}점을 획득하셨습니다.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
          {/* 카테고리별 점수 */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center mb-6'>
              <TrendingUp className='w-6 h-6 text-blue-600 mr-3' />
              <h3 className='text-xl font-bold text-gray-900'>
                카테고리별 점수
              </h3>
            </div>

            <div className='space-y-4'>
              {Object.entries(results.categoryScores)
                .sort(([, a], [, b]) => b.average - a.average)
                .map(([category, data]) => (
                  <div
                    key={category}
                    className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'
                  >
                    <div>
                      <h4 className='font-medium text-gray-900'>{category}</h4>
                      <p className='text-sm text-gray-600'>
                        {data.count}개 문항
                      </p>
                    </div>
                    <div className='text-right'>
                      <div
                        className={`text-2xl font-bold ${getScoreColor(data.average)}`}
                      >
                        {data.average.toFixed(1)}
                      </div>
                      <div className='w-24 bg-gray-200 rounded-full h-2 mt-1'>
                        <div
                          className={`h-2 rounded-full ${
                            data.average >= 7
                              ? 'bg-green-500'
                              : data.average >= 5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${(data.average / 9) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 강점과 개선점 */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center mb-6'>
              <Target className='w-6 h-6 text-green-600 mr-3' />
              <h3 className='text-xl font-bold text-gray-900'>분석 결과</h3>
            </div>

            <div className='space-y-6'>
              <div>
                <h4 className='font-semibold text-green-900 mb-3'>주요 강점</h4>
                <div className='space-y-2'>
                  {results.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className='flex items-center p-3 bg-green-50 rounded-lg'
                    >
                      <div className='w-2 h-2 bg-green-500 rounded-full mr-3' />
                      <span className='text-green-800 font-medium'>
                        {strength}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className='font-semibold text-red-900 mb-3'>개선 영역</h4>
                <div className='space-y-2'>
                  {results.improvements.map((improvement, index) => (
                    <div
                      key={index}
                      className='flex items-center p-3 bg-red-50 rounded-lg'
                    >
                      <div className='w-2 h-2 bg-red-500 rounded-full mr-3' />
                      <span className='text-red-800 font-medium'>
                        {improvement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추천사항 */}
        <div className='bg-white rounded-lg shadow-sm border p-6 mb-8'>
          <h3 className='text-xl font-bold text-gray-900 mb-4'>
            맞춤 추천사항
          </h3>
          <div className='space-y-3'>
            {results.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className='flex items-start p-4 bg-blue-50 rounded-lg'
              >
                <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5'>
                  {index + 1}
                </div>
                <p className='text-blue-900'>{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 응답 */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <h3 className='text-xl font-bold text-gray-900 mb-6'>
            상세 응답 내역
          </h3>
          <div className='space-y-4'>
            {resultsData.responses.map((response, index) => (
              <div
                key={response.questionId}
                className='border-l-4 border-blue-200 pl-4 py-3'
              >
                <div className='flex justify-between items-start mb-2'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>
                      {index + 1}. {response.questionText}
                    </h4>
                    <p className='text-sm text-gray-600 mt-1'>
                      카테고리: {response.category}
                    </p>
                  </div>
                  <div className='text-right ml-4'>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(response.score)}`}
                    >
                      {response.score}점
                    </div>
                    <div className='text-xs text-gray-500'>
                      {response.stage1Choice} → {response.stage2Choice}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className='text-center mt-8'>
          <div className='space-x-4'>
            <Link
              href='/diagnosis'
              className='inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors'
            >
              다른 진단 받기
            </Link>
            <Link
              href='/training'
              className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              훈련 프로그램 시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
