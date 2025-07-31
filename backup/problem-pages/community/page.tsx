'use client';

import CommunityHelp from '@/components/community/CommunityHelp';
import { Button, Card } from '@/components/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PublicJournal {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  category_id: string;
  student_id: string;
  is_public: boolean;
  attachments?: string[]; // 이미지 URL 배열 추가
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    full_name: string;
  };
  comment_count: number;
  encouragement_count: number;
  user_has_encouraged: boolean;
  sync_source?: 'web' | 'desktop_app' | 'mobile_app';
  app_version?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function CommunityPage() {
  const [journals, setJournals] = useState<PublicJournal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (data.success) {
        const allCategories = [
          { id: 'all', name: '전체' },
          ...data.data.map((cat: any) => ({ id: cat.id, name: cat.name })),
        ];
        setCategories(allCategories);
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      // 기본 카테고리 사용
      setCategories([
        { id: 'all', name: '전체' },
        { id: 'category1', name: '비판적 사고' },
        { id: 'category2', name: '창의적 사고' },
        { id: 'category3', name: '감정 조절' },
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 공개 일지 목록 로드
  const loadPublicJournals = async (
    categoryId: string = 'all',
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = new URLSearchParams();
      if (categoryId !== 'all') {
        params.append('categoryId', categoryId);
      }
      params.append('page', page.toString());
      params.append('limit', '10'); // 한 번에 10개씩 로드

      const response = await fetch(
        `/api/community/journals?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch journals');
      }

      if (data.success) {
        if (append) {
          setJournals(prev => [...prev, ...(data.data || [])]);
        } else {
          setJournals(data.data || []);
        }

        // 페이지네이션 정보 업데이트
        if (data.pagination) {
          setTotalCount(data.pagination.total);
          setHasMore(page < data.pagination.totalPages);
        }

        setRetryCount(0);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error loading public journals:', err);
      setError(
        err instanceof Error
          ? err.message
          : '공개 일지를 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 재시도 함수
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadPublicJournals(selectedCategory);
  };

  // 초기 로드
  useEffect(() => {
    loadCategories();
    loadPublicJournals();
  }, []);

  // 카테고리 변경 시 일지 다시 로드
  useEffect(() => {
    if (categories.length > 0) {
      setCurrentPage(1);
      setHasMore(true);
      loadPublicJournals(selectedCategory, 1, false);
    }
  }, [selectedCategory]);

  // 더 많은 일지 로드
  const loadMoreJournals = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadPublicJournals(selectedCategory, nextPage, true);
  };

  // 일지 내용 미리보기 (첫 100자)
  const getPreview = (content: string) => {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  // 이미지 렌더링 컴포넌트
  const renderImages = (attachments: string[] | undefined) => {
    if (!attachments || attachments.length === 0) {
      return null;
    }

    return (
      <div className='mb-4'>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
          {attachments.slice(0, 6).map((imageUrl, index) => (
            <div
              key={index}
              className='relative aspect-square bg-gray-100 rounded-lg overflow-hidden'
            >
              <img
                src={imageUrl}
                alt={`일지 이미지 ${index + 1}`}
                className='w-full h-full object-cover hover:scale-105 transition-transform duration-200'
                onError={e => {
                  // 이미지 로드 실패 시 대체 이미지 표시
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-image.png';
                  target.alt = '이미지를 불러올 수 없습니다';
                }}
                loading='lazy'
              />
              {/* 더 많은 이미지가 있을 때 오버레이 표시 */}
              {index === 5 && attachments.length > 6 && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                  <span className='text-white font-medium text-sm'>
                    +{attachments.length - 6}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {attachments.length > 0 && (
          <p className='text-xs text-gray-500 mt-2'>
            📷 이미지 {attachments.length}개
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'>
      {/* 헤더 */}
      <div className='mb-6 sm:mb-8'>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
              커뮤니티
            </h1>
            <p className='text-gray-600 mt-2 text-sm sm:text-base'>
              다른 학습자들의 훈련 일지를 확인하고 서로 격려해보세요.
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <CommunityHelp />
          </div>
        </div>
      </div>

      {/* 에러 발생 시 재시도 버튼 */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='flex justify-between items-center'>
            <div className='text-red-700'>{error}</div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRetry}
              className='text-red-600 border-red-300 hover:bg-red-50'
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className='mb-6'>
        <div className='flex flex-wrap gap-2 sm:gap-3'>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
              aria-label={`${category.name} 카테고리 필터`}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 일지 목록 */}
      {journals.length > 0 ? (
        <div className='space-y-6'>
          {journals.map(journal => (
            <Card
              key={journal.id}
              className='p-4 sm:p-6 hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
            >
              <div className='flex justify-between items-start mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center mb-2 flex-wrap gap-2'>
                    <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium'>
                      {journal.category.name}
                    </span>

                    {/* 동기화 소스 표시 */}
                    {journal.sync_source && journal.sync_source !== 'web' && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          journal.sync_source === 'desktop_app'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {journal.sync_source === 'desktop_app'
                          ? '🖥️ 데스크톱'
                          : '📱 모바일'}
                      </span>
                    )}

                    <span className='text-gray-300'>•</span>
                    <span className='text-sm text-gray-500'>
                      {journal.author.full_name}
                    </span>
                    <span className='mx-2 text-gray-300'>•</span>
                    <span className='text-sm text-gray-500'>
                      {new Date(journal.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Link
                    href={`/community/journal/${journal.id}`}
                    className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
                  >
                    <h2 className='text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-3 transition-colors duration-200'>
                      {journal.title}
                    </h2>
                  </Link>

                  <p className='text-gray-600 mb-4 text-sm sm:text-base leading-relaxed'>
                    {getPreview(journal.content)}
                  </p>

                  {/* 이미지 표시 */}
                  {renderImages(journal.attachments)}
                </div>
              </div>

              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0'>
                <div className='flex items-center space-x-3 sm:space-x-4'>
                  <div className='flex items-center text-xs sm:text-sm text-gray-500'>
                    <svg
                      className='w-4 h-4 mr-1'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                      />
                    </svg>
                    <span aria-label={`댓글 ${journal.comment_count}개`}>
                      댓글 {journal.comment_count}개
                    </span>
                  </div>
                  <div className='flex items-center text-xs sm:text-sm text-gray-500'>
                    <span className='mr-1' aria-hidden='true'>
                      👏
                    </span>
                    <span aria-label={`격려 ${journal.encouragement_count}개`}>
                      {journal.encouragement_count}
                    </span>
                    {journal.user_has_encouraged && (
                      <span className='ml-1 text-blue-600 text-xs'>
                        (격려함)
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/community/journal/${journal.id}`}
                  className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
                >
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full sm:w-auto'
                  >
                    자세히 보기
                  </Button>
                </Link>
              </div>
            </Card>
          ))}

          {/* 더 보기 버튼 */}
          {hasMore && (
            <div className='text-center mt-6 sm:mt-8'>
              <Button
                variant='outline'
                onClick={loadMoreJournals}
                disabled={loadingMore}
                aria-label={`더 많은 일지 보기. ${totalCount - journals.length}개 남음`}
                className='px-6 sm:px-8 py-3 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                {loadingMore ? (
                  <div className='flex items-center justify-center space-x-2'>
                    <div
                      className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin'
                      aria-hidden='true'
                    ></div>
                    <span>로딩 중...</span>
                  </div>
                ) : (
                  `더 보기 (${totalCount - journals.length}개 남음)`
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className='text-center py-8 sm:py-12'>
          <div className='text-gray-400 mb-4'>
            <svg
              className='w-12 h-12 sm:w-16 sm:h-16 mx-auto'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
              />
            </svg>
          </div>
          <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-2'>
            {selectedCategory === 'all'
              ? '공개된 일지가 없습니다'
              : '해당 카테고리의 공개 일지가 없습니다'}
          </h3>
          <p className='text-sm sm:text-base text-gray-500 mb-6'>
            다른 카테고리를 선택하거나 나중에 다시 확인해보세요.
          </p>
          <Link
            href='/training'
            className='focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded'
          >
            <Button className='w-full sm:w-auto'>내 일지 작성하기</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
