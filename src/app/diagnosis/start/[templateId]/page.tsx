'use client';

import { DiagnosticTemplate } from '@/types/diagnosis';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 샘플 템플릿 데이터
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

export default function DiagnosticStartPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.templateId as string;

  const [template, setTemplate] = useState<DiagnosticTemplate | null>(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (templateId && SAMPLE_TEMPLATES[templateId]) {
      setTemplate(SAMPLE_TEMPLATES[templateId]);
    }
  }, [templateId]);

  const handleStartDiagnosis = async () => {
    if (!isAgreed || !template) return;

    setIsStarting(true);

    try {
      // 실제로는 API를 호출하여 세션을 생성해야 함
      const sessionId = `session_${Date.now()}`;

      // 세션 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      router.push(`/diagnosis/session/${sessionId}?templateId=${templateId}`);
    } catch (error) {
      console.error('Error starting diagnosis:', error);
      setIsStarting(false);
    }
  };

  if (!template) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            템플릿을 찾을 수 없습니다
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

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='max-w-4xl mx-auto px-4'>
        {/* 헤더 */}
        <div className='flex items-center mb-8'>
          <Link
            href='/diagnosis'
            className='flex items-center text-gray-600 hover:text-gray-900 mr-6'
          >
            <ArrowLeft className='w-5 h-5 mr-1' />
            진단 목록
          </Link>
        </div>

        {/* 메인 콘텐츠 */}
        <div className='bg-white rounded-lg shadow-sm border p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              {template.title}
            </h1>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              {template.description}
            </p>
          </div>

          {/* 진단 정보 */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <div className='bg-blue-50 rounded-lg p-6 text-center'>
              <Clock className='w-8 h-8 text-blue-600 mx-auto mb-3' />
              <h3 className='font-semibold text-gray-900 mb-2'>예상 시간</h3>
              <p className='text-blue-600 font-medium text-lg'>
                {template.estimatedTime}분
              </p>
            </div>
            <div className='bg-green-50 rounded-lg p-6 text-center'>
              <Users className='w-8 h-8 text-green-600 mx-auto mb-3' />
              <h3 className='font-semibold text-gray-900 mb-2'>총 문항</h3>
              <p className='text-green-600 font-medium text-lg'>
                {template.questionCount}개
              </p>
            </div>
            <div className='bg-purple-50 rounded-lg p-6 text-center'>
              <div className='w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3'>
                <span className='text-white font-bold text-sm'>2</span>
              </div>
              <h3 className='font-semibold text-gray-900 mb-2'>평가 방식</h3>
              <p className='text-purple-600 font-medium text-lg'>2단계 평가</p>
            </div>
          </div>

          {/* 주의사항 */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8'>
            <div className='flex items-start'>
              <AlertCircle className='w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-yellow-900 mb-3'>
                  진단 전 주의사항
                </h3>
                <ul className='space-y-2 text-yellow-800 text-sm'>
                  <li>• 조용하고 집중할 수 있는 환경에서 진행해주세요</li>
                  <li>• 각 문항에 대해 솔직하고 정확하게 답변해주세요</li>
                  <li>• 중간에 나가더라도 진행 상황이 자동으로 저장됩니다</li>
                  <li>
                    • 한 번 제출한 답변은 수정할 수 없으니 신중하게 선택해주세요
                  </li>
                  <li>• 진단 결과는 개인정보로 안전하게 보호됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2단계 평가 설명 */}
          <div className='bg-blue-50 rounded-lg p-6 mb-8'>
            <h3 className='font-semibold text-blue-900 mb-4'>
              2단계 평가 방식 안내
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='flex items-start'>
                <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5'>
                  1
                </div>
                <div>
                  <h4 className='font-medium text-blue-900 mb-1'>
                    1단계: 범위 선택
                  </h4>
                  <p className='text-blue-800 text-sm'>
                    각 문항에 대해 [상, 중, 하] 중 전체적인 범위를 선택합니다.
                  </p>
                </div>
              </div>
              <div className='flex items-start'>
                <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5'>
                  2
                </div>
                <div>
                  <h4 className='font-medium text-blue-900 mb-1'>
                    2단계: 세분화 평가
                  </h4>
                  <p className='text-blue-800 text-sm'>
                    선택한 범위 내에서 다시 [상, 중, 하]로 세분화하여 정확한
                    점수를 산출합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 동의 체크박스 */}
          <div className='bg-gray-50 rounded-lg p-6 mb-8'>
            <label className='flex items-start cursor-pointer'>
              <input
                type='checkbox'
                checked={isAgreed}
                onChange={e => setIsAgreed(e.target.checked)}
                className='mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <div className='text-sm text-gray-700'>
                <p className='font-medium mb-2'>진단 참여 동의</p>
                <p>
                  위의 주의사항을 모두 확인했으며, 진단 과정에서 수집되는
                  개인정보의 처리에 동의합니다. 진단 결과는 개인의 발전을 위한
                  목적으로만 사용되며, 제3자에게 제공되지 않습니다.
                </p>
              </div>
            </label>
          </div>

          {/* 시작 버튼 */}
          <div className='text-center'>
            <button
              onClick={handleStartDiagnosis}
              disabled={!isAgreed || isStarting}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                isAgreed && !isStarting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                  진단 세션 생성 중...
                </div>
              ) : (
                <div className='flex items-center'>
                  <CheckCircle className='w-5 h-5 mr-2' />
                  진단 시작하기
                </div>
              )}
            </button>

            {!isAgreed && (
              <p className='text-sm text-gray-500 mt-3'>
                진단을 시작하려면 위의 동의사항에 체크해주세요.
              </p>
            )}
          </div>
        </div>

        {/* 추가 정보 */}
        <div className='mt-8 text-center'>
          <Link
            href={`/diagnosis/preview/${templateId}`}
            className='text-blue-600 hover:text-blue-700 font-medium'
          >
            질문 미리보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
