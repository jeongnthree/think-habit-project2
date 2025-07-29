'use client';

import { DiagnosticTemplate } from '@/types/diagnosis';
import { ArrowLeft, Clock, Eye, Play, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  'stress-response': {
    id: 'stress-response',
    title: '스트레스 반응 패턴 진단',
    description: '스트레스 상황에서의 사고와 반응 패턴을 분석합니다.',
    category: '감정관리',
    estimatedTime: 12,
    questionCount: 15,
    difficulty: 'intermediate',
    tags: ['스트레스', '감정', '대처방식'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
};

// 샘플 질문 미리보기
const SAMPLE_QUESTIONS = [
  {
    id: '1',
    text: '새로운 상황에 직면했을 때 얼마나 빨리 적응하시나요?',
    category: '적응성',
  },
  {
    id: '2',
    text: '스트레스를 받을 때 감정을 조절하는 능력은 어느 정도인가요?',
    category: '감정관리',
  },
  {
    id: '3',
    text: '목표를 설정하고 지속적으로 추진하는 능력은?',
    category: '의지력',
  },
];

export default function DiagnosticPreviewPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<DiagnosticTemplate | null>(null);

  useEffect(() => {
    if (templateId && SAMPLE_TEMPLATES[templateId]) {
      setTemplate(SAMPLE_TEMPLATES[templateId]);
    }
  }, [templateId]);

  const handleStartDiagnosis = () => {
    const sessionId = `session_${Date.now()}`;
    window.location.href = `/diagnosis/session/${sessionId}?templateId=${templateId}`;
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return '미정';
    }
  };

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
          <div className='flex items-center text-gray-500'>
            <Eye className='w-5 h-5 mr-2' />
            <span className='text-sm font-medium'>미리보기</span>
          </div>
        </div>

        {/* 템플릿 정보 */}
        <div className='bg-white rounded-lg shadow-sm border p-8 mb-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              {template.title}
            </h1>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              {template.description}
            </p>
          </div>

          {/* 태그 */}
          <div className='flex flex-wrap justify-center gap-2 mb-8'>
            {template.tags.map(tag => (
              <span
                key={tag}
                className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'
              >
                {tag}
              </span>
            ))}
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                template.difficulty
              )}`}
            >
              {getDifficultyText(template.difficulty)}
            </span>
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

          {/* 시작 버튼 */}
          <div className='text-center'>
            <button
              onClick={handleStartDiagnosis}
              className='bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center'
            >
              <Play className='w-5 h-5 mr-2' />
              진단 시작하기
            </button>
          </div>
        </div>

        {/* 질문 미리보기 */}
        <div className='bg-white rounded-lg shadow-sm border p-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            질문 미리보기
          </h2>

          <div className='space-y-4'>
            {SAMPLE_QUESTIONS.map((question, index) => (
              <div
                key={question.id}
                className='border-l-4 border-blue-200 pl-4 py-3'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-medium text-gray-900 mb-1'>
                      {index + 1}. {question.text}
                    </h3>
                    <span className='inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm'>
                      {question.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {template.questionCount > SAMPLE_QUESTIONS.length && (
              <div className='text-center py-4 text-gray-500'>
                ... 외 {template.questionCount - SAMPLE_QUESTIONS.length}개 문항
              </div>
            )}
          </div>
        </div>

        {/* 2단계 평가 설명 */}
        <div className='bg-blue-50 rounded-lg p-8 mt-8'>
          <h3 className='text-xl font-bold text-blue-900 mb-4'>
            2단계 평가 방식 안내
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='font-semibold text-blue-900 mb-2'>
                1단계: 범위 선택
              </h4>
              <p className='text-blue-800 text-sm'>
                각 문항에 대해 [상, 중, 하] 중 전체적인 범위를 선택합니다.
              </p>
            </div>
            <div>
              <h4 className='font-semibold text-blue-900 mb-2'>
                2단계: 세분화 평가
              </h4>
              <p className='text-blue-800 text-sm'>
                선택한 범위 내에서 다시 [상, 중, 하]로 세분화하여 정확한 점수를
                산출합니다.
              </p>
            </div>
          </div>
          <div className='mt-4 p-4 bg-white rounded-lg'>
            <p className='text-sm text-gray-700'>
              <strong>예시:</strong> 1단계에서 '중'을 선택하고, 2단계에서 '상'을
              선택하면 최종 점수는 6점(9점 만점)이 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
