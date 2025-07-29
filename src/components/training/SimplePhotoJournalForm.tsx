'use client';

import { Upload, X } from 'lucide-react';
import { useState } from 'react';

interface PhotoJournalFormProps {
  categoryId: string;
  categoryName: string;
  onSubmit: (data: {
    photos: File[];
    title: string;
    content: string;
    isPublic: boolean;
    voiceMemo?: File;
  }) => Promise<void>;
}

interface PhotoPreview {
  file: File;
  url: string;
  description: string;
}

export default function SimplePhotoJournalForm({
  categoryId,
  categoryName,
  onSubmit,
}: PhotoJournalFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isPublic, setIsPublic] = useState(true); // 기본값을 공개로 설정
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // 파일 검증 및 추가
    Array.from(files).forEach(file => {
      // 이미지 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return;
      }

      // 파일 크기 검증 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`${file.name}의 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.`);
        return;
      }

      // 최대 파일 개수 검증
      if (photos.length >= 5) {
        alert('최대 5개의 사진만 업로드할 수 있습니다.');
        return;
      }

      const url = URL.createObjectURL(file);
      setPhotos(prev => [...prev, { file, url, description: '' }]);
    });

    // 입력 필드 초기화 (같은 파일을 다시 선택할 수 있도록)
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].url);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index].description = description;
      return newPhotos;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        photos: photos.map(p => p.file),
        title: title.trim(),
        content: content.trim(),
        isPublic: isPublic,
      });
    } catch (error) {
      console.error('Submit error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='bg-white rounded-lg shadow-sm border p-8'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          📷 {categoryName} - 사진 일지
        </h2>
        <p className='text-gray-600'>
          사진과 함께 오늘의 훈련 내용을 기록해보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* 제목 */}
        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            제목 <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='title'
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='일지 제목을 입력하세요'
          />
          <div className='text-xs text-gray-500 mt-1'>{title.length}/100자</div>
        </div>

        {/* 사진 업로드 */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            사진 업로드
          </label>

          {/* 업로드 영역 */}
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors'>
            <div className='text-4xl mb-4'>📷</div>
            <p className='text-gray-600 mb-4'>
              사진을 선택하거나 여기에 드래그하세요
            </p>
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={handlePhotoUpload}
              className='hidden'
              id='photo-upload'
            />
            <label
              htmlFor='photo-upload'
              className='inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors'
            >
              <Upload className='w-4 h-4 mr-2' />
              사진 선택
            </label>
          </div>

          {/* 사진 미리보기 */}
          {photos.length > 0 && (
            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className='relative border border-gray-200 rounded-lg p-4'
                >
                  <button
                    type='button'
                    onClick={() => removePhoto(index)}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                  >
                    <X className='w-4 h-4' />
                  </button>

                  <img
                    src={photo.url}
                    alt={`업로드된 사진 ${index + 1}`}
                    className='w-full h-32 object-cover rounded mb-3'
                  />

                  <textarea
                    value={photo.description}
                    onChange={e =>
                      updatePhotoDescription(index, e.target.value)
                    }
                    placeholder='사진 설명 (선택사항)'
                    className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div>
          <label
            htmlFor='content'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            내용 <span className='text-red-500'>*</span>
          </label>
          <textarea
            id='content'
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={6}
            maxLength={1000}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='오늘의 훈련에 대한 생각이나 느낀 점을 자유롭게 작성해주세요...'
          />
          <div className='flex justify-between text-xs text-gray-500 mt-1'>
            <span>최소 10자 이상 작성해주세요</span>
            <span>{content.length}/1000자</span>
          </div>
        </div>

        {/* 공개/비공개 설정 */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            공개 설정
          </label>
          <div className='space-y-2'>
            <label className='flex items-center'>
              <input
                type='radio'
                name='visibility'
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
                className='mr-3'
                disabled={isSubmitting}
              />
              <span className='text-sm text-gray-700'>
                비공개 (나만 볼 수 있음)
              </span>
            </label>
            <label className='flex items-center'>
              <input
                type='radio'
                name='visibility'
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className='mr-3'
                disabled={isSubmitting}
              />
              <span className='text-sm text-gray-700'>
                공개 (커뮤니티에서 공유)
              </span>
            </label>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
          <button
            type='button'
            onClick={() => window.history.back()}
            disabled={isSubmitting}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50'
          >
            취소
          </button>
          <button
            type='submit'
            disabled={
              isSubmitting ||
              !title.trim() ||
              !content.trim() ||
              content.length < 10
            }
            className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
              <div className='flex items-center'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                저장 중...
              </div>
            ) : (
              '일지 저장'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
