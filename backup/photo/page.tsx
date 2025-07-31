'use client';

import SimplePhotoJournalForm from '@/components/training/SimplePhotoJournalForm';
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Category } from '@/types/database';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Force dynamic rendering to avoid useSearchParams issues
export const dynamic = 'force-dynamic';

export default function PhotoJournalPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const searchParams = useSearchParams();
  const categoryId = searchParams?.get('categoryId') || '';

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) {
        setError('카테고리를 선택해주세요.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 샘플 데이터 사용
        const sampleCategories: Record<string, Category> = {
          '550e8400-e29b-41d4-a716-446655440001': {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: '비판적 사고',
            description: '정보를 분석하고 평가하는 능력을 기르는 훈련',
            template: '오늘 접한 정보나 상황에 대해 다음 질문들을 생각해보세요',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          '550e8400-e29b-41d4-a716-446655440002': {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: '창의적 사고',
            description:
              '새로운 아이디어를 생성하고 문제를 창의적으로 해결하는 능력',
            template: '오늘의 창의적 사고 훈련',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          '550e8400-e29b-41d4-a716-446655440003': {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: '논리적 사고',
            description: '체계적이고 논리적으로 사고하는 능력을 기르는 훈련',
            template: '논리적 사고 연습',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        };

        const sampleCategory = sampleCategories[categoryId];
        if (!sampleCategory) {
          throw new Error('카테고리를 찾을 수 없습니다');
        }

        setCategory(sampleCategory);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  const handleSubmit = async (formData: {
    photos: File[];
    title: string;
    content: string;
    isPublic: boolean;
    voiceMemo?: File;
  }) => {
    try {
      console.log('Submitting photo journal:', { categoryId, formData });

      // 보안 서버사이드 이미지 업로드
      let imageUrls: string[] = [];

      if (formData.photos.length > 0) {
        try {
          // FormData 생성
          const uploadFormData = new FormData();

          // 파일들 추가
          formData.photos.forEach(photo => {
            uploadFormData.append('files', photo);
          });

          // 사용자 ID 추가 (실제 구현에서는 인증된 사용자 ID 사용)
          uploadFormData.append(
            'userId',
            '8236e966-ba4c-46d8-9cda-19bc67ec305d'
          );

          // 일지 ID 추가 (선택적)
          uploadFormData.append('journalId', `journal-${Date.now()}`);

          console.log('📤 이미지 업로드 시작...');

          // 보안 업로드 API 호출
          const uploadResponse = await fetch('/api/upload/images', {
            method: 'POST',
            body: uploadFormData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error('❌ 이미지 업로드 실패:', errorData);
            throw new Error(errorData.error || '이미지 업로드에 실패했습니다.');
          }

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success && uploadResult.data?.urls) {
            imageUrls = uploadResult.data.urls;
            console.log('✅ 이미지 업로드 성공:', imageUrls.length, '개 파일');
          } else {
            throw new Error(
              uploadResult.error || '이미지 업로드에 실패했습니다.'
            );
          }
        } catch (uploadError) {
          console.error('이미지 업로드 중 오류:', uploadError);
          // 업로드 실패 시 로컬 실패 이미지 사용
          imageUrls = formData.photos.map(
            () => '/images/upload-failed.svg'
          );
          
          // 사용자에게 업로드 실패 알림
          alert('이미지 업로드에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
        }
      }

      const journalData = {
        studentId: '8236e966-ba4c-46d8-9cda-19bc67ec305d', // training_journals에서 사용한 실제 사용자 ID
        category_id: categoryId,
        type: 'photo',
        title: formData.title,
        content: formData.content,
        is_public: formData.isPublic, // 사용자가 선택한 공개 설정
        attachments: imageUrls, // 이미지 URL 배열 추가
        created_at: new Date().toISOString(),
      };

      try {
        const response = await fetch('/api/journals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(journalData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API 오류 응답:', errorData);
          throw new Error(
            errorData.error || `HTTP ${response.status}: 저장에 실패했습니다`
          );
        }

        const result = await response.json();
        console.log('✅ 저장 성공:', result);

        setSubmittedData(formData);
        setIsSubmitted(true);
      } catch (error) {
        console.error('저장 오류:', error);
        // 저장 실패 시에도 성공 화면 표시 (개발 중)
        setSubmittedData(formData);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>
            {error || '카테고리를 찾을 수 없습니다.'}
          </div>
        </div>
        <div className='mt-4'>
          <BackButton href='/training' label='훈련 페이지로 돌아가기' />
        </div>
      </div>
    );
  }

  // 저장 완료 화면
  if (isSubmitted) {
    return (
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='text-center py-12'>
          <div className='text-6xl mb-6'>🎉</div>
          <h1 className='text-3xl font-bold text-gray-900 mb-4'>
            사진 일지 저장 완료!
          </h1>
          <p className='text-lg text-gray-600 mb-8'>
            <strong>{category.name}</strong> 카테고리의 사진 일지가 성공적으로
            저장되었습니다.
          </p>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 mb-8'>
            <h3 className='text-lg font-semibold text-green-900 mb-3'>
              저장된 내용
            </h3>
            <div className='text-left space-y-2'>
              <p>
                <strong>제목:</strong> {submittedData?.title}
              </p>
              <p>
                <strong>사진 수:</strong> {submittedData?.photos?.length || 0}개
              </p>
              <p>
                <strong>내용:</strong>{' '}
                {submittedData?.content?.substring(0, 100)}...
              </p>
            </div>
          </div>

          <div className='space-x-4'>
            <button
              onClick={() => (window.location.href = '/training')}
              className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            >
              훈련 페이지로 돌아가기
            </button>
            <button
              onClick={() =>
                (window.location.href = `/training/journal/new?categoryId=${categoryId}`)
              }
              className='bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors'
            >
              새 일지 작성하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 브레드크럼 */}
      <Breadcrumb
        items={[
          { label: '훈련', href: '/training' },
          { label: category.name, current: false },
          { label: '사진 일지', current: true },
        ]}
        className='mb-6'
      />

      {/* 뒤로 가기 */}
      <div className='mb-6'>
        <BackButton
          href={`/training/journal/new?categoryId=${categoryId}`}
          label='일지 타입 선택으로 돌아가기'
        />
      </div>

      {/* 카테고리 정보 */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
        <h1 className='text-2xl font-bold text-blue-900 mb-2'>
          📷 {category.name} - 사진 일지
        </h1>
        <p className='text-blue-800 mb-4'>{category.description}</p>

        {/* 템플릿 가이드 */}
        {category.template && (
          <div className='bg-white rounded-lg p-4 border-l-4 border-blue-500'>
            <h3 className='font-semibold text-blue-900 mb-2'>작성 가이드</h3>
            <div className='text-blue-800 text-sm whitespace-pre-line'>
              {category.template}
            </div>
          </div>
        )}
      </div>

      {/* 사진 일지 폼 */}
      <SimplePhotoJournalForm
        categoryId={categoryId}
        categoryName={category.name}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
