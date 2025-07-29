'use client';

import { DiagnosticTemplate } from '@/types/diagnosis';
import { ChevronRight, Clock, Tag, Users } from 'lucide-react';

interface DiagnosticTemplateListProps {
  onSelectTemplate: (template: DiagnosticTemplate) => void;
  showStartButton?: boolean;
}

// 샘플 진단 템플릿 데이터
const SAMPLE_TEMPLATES: DiagnosticTemplate[] = [
  {
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
  {
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
  {
    id: 'decision-making',
    title: '의사결정 스타일 진단',
    description: '중요한 결정을 내릴 때의 사고 과정과 패턴을 평가합니다.',
    category: '사고능력',
    estimatedTime: 18,
    questionCount: 25,
    difficulty: 'advanced',
    tags: ['의사결정', '논리적사고', '판단력'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'interpersonal-thinking',
    title: '대인관계 사고 진단',
    description: '타인과의 관계에서 나타나는 사고 패턴을 분석합니다.',
    category: '대인관계',
    estimatedTime: 10,
    questionCount: 12,
    difficulty: 'beginner',
    tags: ['대인관계', '소통', '공감'],
    isActive: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

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

export function DiagnosticTemplateList({
  onSelectTemplate,
  showStartButton = false,
}: DiagnosticTemplateListProps) {
  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-gray-900 mb-4'>생각습관 진단</h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          다양한 진단 도구를 통해 자신의 생각습관을 객관적으로 파악하고 개선점을
          찾아보세요.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {SAMPLE_TEMPLATES.map(template => (
          <div
            key={template.id}
            className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer'
            onClick={() => onSelectTemplate(template)}
          >
            <div className='flex justify-between items-start mb-4'>
              <div className='flex-1'>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  {template.title}
                </h3>
                <p className='text-gray-600 text-sm leading-relaxed'>
                  {template.description}
                </p>
              </div>
              <ChevronRight className='w-5 h-5 text-gray-400 ml-4 flex-shrink-0' />
            </div>

            <div className='flex flex-wrap gap-2 mb-4'>
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
                >
                  <Tag className='w-3 h-3 mr-1' />
                  {tag}
                </span>
              ))}
            </div>

            <div className='flex items-center justify-between text-sm text-gray-500'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center'>
                  <Clock className='w-4 h-4 mr-1' />
                  {template.estimatedTime}분
                </div>
                <div className='flex items-center'>
                  <Users className='w-4 h-4 mr-1' />
                  {template.questionCount}문항
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                  template.difficulty
                )}`}
              >
                {getDifficultyText(template.difficulty)}
              </span>
            </div>

            {showStartButton && (
              <div className='mt-4 pt-4 border-t border-gray-100'>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSelectTemplate(template);
                  }}
                  className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors'
                >
                  진단 시작하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className='bg-blue-50 rounded-lg p-6 text-center'>
        <h2 className='text-lg font-semibold text-blue-900 mb-2'>
          2단계 평가 진단 체험하기
        </h2>
        <p className='text-blue-700 mb-4'>
          더 정확한 평가를 위한 2단계 진단 시스템을 체험해보세요.
        </p>
        <button
          onClick={() => (window.location.href = '/diagnosis/two-stage')}
          className='bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'
        >
          2단계 진단 체험하기
        </button>
      </div>
    </div>
  );
}
