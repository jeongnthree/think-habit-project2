'use client';

import {
  Book,
  Camera,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  PlusCircle,
  Search,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { ResponsiveContainer } from '../ui/ResponsiveContainer';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  subsections?: GuideSection[];
}

const guideData: GuideSection[] = [
  {
    id: 'getting-started',
    title: '시작하기',
    icon: <Book className='w-5 h-5' />,
    content: (
      <div className='space-y-4'>
        <p>
          Think-Habit Lite에 오신 것을 환영합니다! 이 가이드는 훈련 일지
          시스템을 효과적으로 사용하는 방법을 안내합니다.
        </p>

        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='font-semibold text-blue-900 mb-2'>주요 기능</h4>
          <ul className='list-disc list-inside text-blue-800 space-y-1'>
            <li>구조화된 일지와 사진 일지 작성</li>
            <li>개인별 진행률 추적</li>
            <li>커뮤니티 공유 및 피드백</li>
            <li>다양한 카테고리별 훈련</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'journal-types',
    title: '일지 유형',
    icon: <FileText className='w-5 h-5' />,
    content: (
      <div className='space-y-6'>
        <div>
          <h4 className='font-semibold mb-3 flex items-center'>
            <CheckSquare className='w-4 h-4 mr-2 text-blue-600' />
            구조화된 일지
          </h4>
          <p className='mb-3'>
            미리 정의된 과제를 체크리스트 형태로 완료하는 일지입니다.
          </p>
          <div className='bg-gray-50 p-3 rounded-md'>
            <p className='text-sm text-gray-700'>
              <strong>사용 시기:</strong> 체계적인 학습이 필요할 때, 단계별 과제
              수행 시
            </p>
          </div>
        </div>

        <div>
          <h4 className='font-semibold mb-3 flex items-center'>
            <Camera className='w-4 h-4 mr-2 text-purple-600' />
            사진 일지
          </h4>
          <p className='mb-3'>
            손으로 작성한 노트나 스케치를 사진으로 업로드하는 자유형식
            일지입니다.
          </p>
          <div className='bg-gray-50 p-3 rounded-md'>
            <p className='text-sm text-gray-700'>
              <strong>사용 시기:</strong> 창의적 표현이 필요할 때, 손글씨 연습
              시
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'creating-journals',
    title: '일지 작성하기',
    icon: <PlusCircle className='w-5 h-5' />,
    content: (
      <div className='space-y-6'>
        <div>
          <h4 className='font-semibold mb-3'>1. 일지 유형 선택</h4>
          <ol className='list-decimal list-inside space-y-2 text-gray-700'>
            <li>훈련 페이지에서 "새 일지 작성" 버튼 클릭</li>
            <li>카테고리 확인 후 일지 유형 선택</li>
            <li>구조화된 일지 또는 사진 일지 중 선택</li>
          </ol>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>2. 구조화된 일지 작성</h4>
          <ol className='list-decimal list-inside space-y-2 text-gray-700'>
            <li>제시된 과제 목록 확인</li>
            <li>완료한 과제에 체크 표시</li>
            <li>필요시 추가 메모 작성</li>
            <li>전체 성찰 내용 입력</li>
            <li>"일지 제출" 버튼으로 저장</li>
          </ol>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>3. 사진 일지 작성</h4>
          <ol className='list-decimal list-inside space-y-2 text-gray-700'>
            <li>사진 업로드 영역에 이미지 드래그 또는 클릭하여 선택</li>
            <li>각 사진에 대한 설명 추가 (선택사항)</li>
            <li>전체 설명 및 성찰 내용 작성</li>
            <li>"일지 제출" 버튼으로 저장</li>
          </ol>
        </div>

        <div className='bg-yellow-50 p-4 rounded-lg'>
          <h5 className='font-semibold text-yellow-900 mb-2'>💡 팁</h5>
          <ul className='list-disc list-inside text-yellow-800 space-y-1'>
            <li>사진은 JPG, PNG, HEIC, WebP 형식을 지원합니다</li>
            <li>최대 10MB, 10장까지 업로드 가능합니다</li>
            <li>느린 연결에서는 이미지가 자동으로 압축됩니다</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'progress-tracking',
    title: '진행률 추적',
    icon: <TrendingUp className='w-5 h-5' />,
    content: (
      <div className='space-y-4'>
        <p>개인의 학습 진행 상황을 체계적으로 추적하고 분석할 수 있습니다.</p>

        <div>
          <h4 className='font-semibold mb-3'>주간 진행률</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>현재 주에 완료한 일지 수를 기준으로 계산</li>
            <li>매주 월요일에 진행률 초기화</li>
            <li>이전 주 기록은 통계에 보관</li>
          </ul>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>성취 배지</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>연속 학습일 달성 시 배지 획득</li>
            <li>카테고리별 완료 목표 달성 시 특별 배지</li>
            <li>월간/분기별 우수 학습자 인정</li>
          </ul>
        </div>

        <div className='bg-green-50 p-4 rounded-lg'>
          <h5 className='font-semibold text-green-900 mb-2'>📊 통계 활용법</h5>
          <p className='text-green-800'>
            대시보드의 차트를 통해 학습 패턴을 분석하고, 부족한 영역을 파악하여
            학습 계획을 조정하세요.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'community',
    title: '커뮤니티 참여',
    icon: <Users className='w-5 h-5' />,
    content: (
      <div className='space-y-4'>
        <p>다른 학습자들과 경험을 공유하고 서로 격려할 수 있습니다.</p>

        <div>
          <h4 className='font-semibold mb-3'>공개 일지 설정</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>일지 작성 시 "공개" 옵션 선택</li>
            <li>다른 사용자들이 볼 수 있으며 댓글 가능</li>
            <li>언제든지 비공개로 변경 가능</li>
          </ul>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>댓글 및 격려</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>다른 학습자의 일지에 격려 댓글 작성</li>
            <li>건설적인 피드백과 경험 공유</li>
            <li>부적절한 내용 신고 기능 활용</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'accessibility',
    title: '접근성 기능',
    icon: <Settings className='w-5 h-5' />,
    content: (
      <div className='space-y-4'>
        <p>
          모든 사용자가 편리하게 이용할 수 있도록 다양한 접근성 기능을
          제공합니다.
        </p>

        <div>
          <h4 className='font-semibold mb-3'>키보드 탐색</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>Tab 키로 모든 요소 탐색 가능</li>
            <li>Enter/Space 키로 버튼 활성화</li>
            <li>Escape 키로 모달 및 메뉴 닫기</li>
          </ul>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>화면 읽기 프로그램 지원</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>모든 이미지에 대체 텍스트 제공</li>
            <li>폼 요소에 적절한 레이블 설정</li>
            <li>페이지 구조를 위한 헤딩 계층 구조</li>
          </ul>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>시각적 조정</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>고대비 모드 자동 감지</li>
            <li>움직임 감소 설정 지원</li>
            <li>충분한 색상 대비 제공</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'troubleshooting',
    title: '문제 해결',
    icon: <HelpCircle className='w-5 h-5' />,
    content: (
      <div className='space-y-6'>
        <div>
          <h4 className='font-semibold mb-3'>자주 묻는 질문</h4>

          <div className='space-y-4'>
            <div className='border-l-4 border-blue-500 pl-4'>
              <h5 className='font-medium mb-1'>Q: 일지가 저장되지 않아요</h5>
              <p className='text-gray-700 text-sm'>
                A: 인터넷 연결을 확인하고, 필수 항목이 모두 입력되었는지
                확인하세요. 오프라인 상태에서는 자동으로 임시 저장됩니다.
              </p>
            </div>

            <div className='border-l-4 border-blue-500 pl-4'>
              <h5 className='font-medium mb-1'>Q: 사진 업로드가 안 돼요</h5>
              <p className='text-gray-700 text-sm'>
                A: 파일 크기(10MB 이하)와 형식(JPG, PNG, HEIC, WebP)을
                확인하세요. 느린 연결에서는 시간이 더 걸릴 수 있습니다.
              </p>
            </div>

            <div className='border-l-4 border-blue-500 pl-4'>
              <h5 className='font-medium mb-1'>
                Q: 진행률이 업데이트되지 않아요
              </h5>
              <p className='text-gray-700 text-sm'>
                A: 페이지를 새로고침하거나, 일지가 정상적으로 제출되었는지
                확인하세요. 진행률은 실시간으로 업데이트됩니다.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className='font-semibold mb-3'>성능 최적화 팁</h4>
          <ul className='list-disc list-inside space-y-2 text-gray-700'>
            <li>큰 이미지는 업로드 전에 크기를 줄이세요</li>
            <li>느린 연결에서는 사진 품질이 자동으로 조정됩니다</li>
            <li>브라우저 캐시를 정기적으로 정리하세요</li>
            <li>최신 브라우저 사용을 권장합니다</li>
          </ul>
        </div>

        <div className='bg-red-50 p-4 rounded-lg'>
          <h5 className='font-semibold text-red-900 mb-2'>🚨 긴급 상황</h5>
          <p className='text-red-800 text-sm'>
            시스템 오류나 데이터 손실이 발생한 경우, 즉시 관리자에게 문의하시기
            바랍니다.
          </p>
        </div>
      </div>
    ),
  },
];

export function UserGuide() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['getting-started'])
  );
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const filteredSections = guideData.filter(
    section =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ResponsiveContainer maxWidth='2xl' className='py-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            사용자 가이드
          </h1>
          <p className='text-lg text-gray-600'>
            Think-Habit Lite 훈련 일지 시스템 완전 가이드
          </p>
        </div>

        {/* Search */}
        <div className='relative mb-8'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search className='h-5 w-5 text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='가이드 내용 검색...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
          />
        </div>

        {/* Guide Sections */}
        <div className='space-y-4'>
          {filteredSections.map(section => (
            <div
              key={section.id}
              className='bg-white border border-gray-200 rounded-lg shadow-sm'
            >
              <button
                onClick={() => toggleSection(section.id)}
                className='w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-lg'
                aria-expanded={expandedSections.has(section.id)}
              >
                <div className='flex items-center'>
                  <span className='text-blue-600 mr-3'>{section.icon}</span>
                  <h2 className='text-lg font-semibold text-gray-900'>
                    {section.title}
                  </h2>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronDown className='h-5 w-5 text-gray-500' />
                ) : (
                  <ChevronRight className='h-5 w-5 text-gray-500' />
                )}
              </button>

              {expandedSections.has(section.id) && (
                <div className='px-6 py-4 border-t border-gray-200'>
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className='mt-12 text-center'>
          <div className='bg-blue-50 p-6 rounded-lg'>
            <h3 className='text-lg font-semibold text-blue-900 mb-2'>
              추가 도움이 필요하신가요?
            </h3>
            <p className='text-blue-800 mb-4'>
              이 가이드에서 답을 찾지 못하셨다면 언제든지 문의해 주세요.
            </p>
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <button className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'>
                관리자에게 문의
              </button>
              <button className='px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'>
                커뮤니티 포럼
              </button>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
