'use client';

import { useFormValidation } from '@/hooks/useFormValidation';
import { useNetworkStatus, useOfflineStorage } from '@/hooks/useNetworkStatus';
import { PhotoJournalSubmission } from '@/types/training';
import {
  customValidationRules,
  getRecoveryStrategy,
  validatePhotoJournal,
} from '@/utils';
import { compressImage, getOptimalImageFormat } from '@/utils/imageUtils';
import { Camera, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { ErrorMessage } from '../ui/ErrorMessage';
import LazyImage from '../ui/LazyImage';

interface PhotoJournalFormProps {
  categoryId: string;
  onSubmit: (data: PhotoJournalSubmission) => Promise<void>;
  onCancel: () => void;
}

interface PhotoPreview {
  file: File;
  url: string;
  description: string;
}

export default function PhotoJournalForm({
  categoryId,
  onSubmit,
  onCancel,
}: PhotoJournalFormProps) {
  // Network status and offline storage
  const { isOnline, isSlowConnection, getRecommendedBehavior } =
    useNetworkStatus();
  const [offlineDraft, setOfflineDraft] = useOfflineStorage(
    `photo_journal_draft_${categoryId}`,
    null
  );

  // Form validation
  const {
    values,
    isValid,
    isSubmitting,
    hasErrors,
    isDirty,
    setFieldValue,
    setFieldError,
    setFieldErrors,
    getFieldProps,
    submitForm,
    resetForm,
  } = useFormValidation({
    initialValues: {
      photos: [] as File[],
      photo_descriptions: [] as string[],
      description: '',
      category_id: categoryId,
      journal_type: 'photo' as const,
    },
    validationRules: [
      {
        field: 'photos',
        validator: value => {
          if (!value || value.length === 0) {
            return '최소 1장의 사진을 업로드해주세요.';
          }
          if (value.length > 10) {
            return '최대 10장까지 업로드할 수 있습니다.';
          }

          // Validate each file
          for (const file of value) {
            const fileValidation =
              customValidationRules.validateFileUpload(file);
            if (!fileValidation.isValid) {
              return fileValidation.message || null;
            }
          }

          return null;
        },
      },
      {
        field: 'description',
        validator: value => {
          if (value && value.length > 1000) {
            return '전체 설명은 1000자 이하로 입력해주세요.';
          }
          return null;
        },
      },
    ],
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Local state
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Network behavior recommendations
  const networkBehavior = getRecommendedBehavior();

  // 파일 검증 (using validation utils)
  const validateFile = (file: File): string | null => {
    const validation = customValidationRules.validateFileUpload(file);
    return validation.isValid ? null : validation.message || null;
  };

  // Get optimal compression settings based on network
  const getCompressionOptions = useCallback(() => {
    const format = getOptimalImageFormat();
    return {
      maxWidth: isSlowConnection ? 1280 : 1920,
      maxHeight: isSlowConnection ? 720 : 1080,
      quality: isSlowConnection ? 0.6 : 0.8,
      format,
    };
  }, [isSlowConnection]);

  // 파일 추가 처리
  const handleFiles = useCallback(
    async (files: FileList) => {
      const newErrors: string[] = [];
      const newPhotos: PhotoPreview[] = [];
      const currentPhotoCount = photos.length;

      // Check total file count
      if (currentPhotoCount + files.length > 10) {
        setFieldError('photos', '최대 10장까지 업로드할 수 있습니다.');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const error = validateFile(file);

        if (error) {
          newErrors.push(`${file.name}: ${error}`);
          continue;
        }

        try {
          // Compress image based on network conditions
          const processedFile = networkBehavior.reduceImageQuality
            ? await compressImage(file, getCompressionOptions())
            : file;
          const url = URL.createObjectURL(processedFile);

          newPhotos.push({
            file: processedFile,
            url,
            description: '',
          });
        } catch (error) {
          newErrors.push(`${file.name}: 이미지 처리 중 오류가 발생했습니다`);
        }
      }

      if (newErrors.length > 0) {
        setFieldError('photos', newErrors.join(', '));
      } else {
        setFieldError('photos', null);
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);

      // Update form values
      setFieldValue(
        'photos',
        updatedPhotos.map(p => p.file)
      );
      setFieldValue(
        'photo_descriptions',
        updatedPhotos.map(p => p.description)
      );
    },
    [
      getCompressionOptions,
      photos,
      networkBehavior.reduceImageQuality,
      setFieldValue,
      setFieldError,
    ]
  );

  // 드래그 앤 드롭 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  // 사진 제거
  const removePhoto = useCallback(
    (index: number) => {
      setPhotos(prev => {
        const newPhotos = [...prev];
        URL.revokeObjectURL(newPhotos[index].url);
        newPhotos.splice(index, 1);

        // Update form values
        setFieldValue(
          'photos',
          newPhotos.map(p => p.file)
        );
        setFieldValue(
          'photo_descriptions',
          newPhotos.map(p => p.description)
        );

        return newPhotos;
      });
    },
    [setFieldValue]
  );

  // 사진 설명 업데이트
  const updatePhotoDescription = useCallback(
    (index: number, description: string) => {
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index].description = description;

        // Update form values
        setFieldValue(
          'photo_descriptions',
          newPhotos.map(p => p.description)
        );

        return newPhotos;
      });
    },
    [setFieldValue]
  );

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    await submitForm(
      async formValues => {
        try {
          // Validate with Zod schema
          const validation = validatePhotoJournal(formValues);
          if (!validation.success) {
            setFieldErrors(validation.fieldErrors);
            throw new Error('입력 내용을 확인해주세요.');
          }

          const submissionData: PhotoJournalSubmission = {
            categoryId,
            photos: photos.map(p => p.file),
            description: formValues.description,
            photoDescriptions: photos.map(p => p.description),
          };

          // Submit with file upload retry mechanism
          if (isOnline) {
            await onSubmit(submissionData);
          } else {
            // Save to offline storage for later submission
            setOfflineDraft(
              JSON.stringify({
                ...submissionData,
                timestamp: new Date().toISOString(),
              })
            );
            throw new Error(
              '오프라인 상태입니다. 연결이 복구되면 자동으로 제출됩니다.'
            );
          }

          // Clear draft after successful submission
          setOfflineDraft(null);
        } catch (error: any) {
          const recoveryStrategy = getRecoveryStrategy(error);
          setSubmitError(recoveryStrategy.message);

          // Handle specific error types
          if (error.isValidationError && error.validationErrors) {
            const fieldErrors: Record<string, string> = {};
            error.validationErrors.forEach((ve: any) => {
              fieldErrors[ve.field] = ve.message;
            });
            setFieldErrors(fieldErrors);
          }

          throw error; // Re-throw to be handled by submitForm
        }
      },
      {
        validateBeforeSubmit: true,
        onValidationError: errors => {
          const firstError = Object.values(errors).find(
            error => error !== null
          );
          if (firstError) {
            setSubmitError(firstError);
          }
        },
      }
    );
  };

  return (
    <div className='max-w-4xl mx-auto p-6 relative'>
      {isSubmitting && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg'>
            <div className='flex items-center space-x-3'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
              <span>
                {retryCount > 0
                  ? `재시도 중... (${retryCount}회)`
                  : '사진을 업로드하는 중...'}
              </span>
            </div>
          </div>
        </div>
      )}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-2xl font-bold text-gray-900'>사진 일지 작성</h2>
          <p className='text-gray-600 mt-2'>
            손으로 작성한 노트나 스케치 사진을 업로드하여 일지를 작성하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Network status warning */}
          {!isOnline && (
            <ErrorMessage
              type='warning'
              title='오프라인 모드'
              message='현재 인터넷에 연결되어 있지 않습니다. 작성한 내용은 자동으로 저장되며, 연결이 복구되면 제출할 수 있습니다.'
              showRetry={false}
            />
          )}

          {isSlowConnection && (
            <ErrorMessage
              type='info'
              title='느린 연결'
              message='현재 인터넷 연결이 느립니다. 이미지가 자동으로 압축됩니다.'
              showRetry={false}
            />
          )}

          {/* Submit error */}
          {submitError && (
            <ErrorMessage
              type='error'
              title='제출 오류'
              message={submitError}
              onRetry={
                retryCount < 3
                  ? () => handleSubmit({ preventDefault: () => {} } as any)
                  : undefined
              }
              showRetry={retryCount < 3}
            />
          )}

          {/* Validation errors */}
          {hasErrors && (
            <ErrorMessage
              type='warning'
              title='입력 확인 필요'
              message='아래 항목들을 확인해주세요.'
              showRetry={false}
            />
          )}

          {/* 파일 업로드 영역 */}
          <div className='space-y-4'>
            <label className='block text-sm font-medium text-gray-700'>
              사진 업로드 *
            </label>
            {getFieldProps('photos').error && (
              <p className='text-sm text-red-600'>
                {getFieldProps('photos').error}
              </p>
            )}

            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*'
                onChange={handleFileSelect}
                className='hidden'
              />

              <div className='space-y-4'>
                <div className='flex justify-center'>
                  <Upload className='h-12 w-12 text-gray-400' />
                </div>
                <div>
                  <p className='text-lg font-medium text-gray-900'>
                    사진을 드래그하여 놓거나 클릭하여 선택하세요
                  </p>
                  <p className='text-sm text-gray-500 mt-1'>
                    JPG, PNG, HEIC, WebP 형식 지원 (최대 10MB)
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  <Camera className='h-4 w-4 mr-2' />
                  파일 선택
                </button>
              </div>
            </div>
          </div>

          {/* 업로드된 사진 미리보기 */}
          {photos.length > 0 && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                업로드된 사진 ({photos.length}장)
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    <div className='relative'>
                      <LazyImage
                        src={photo.url}
                        alt={`업로드된 사진 ${index + 1}`}
                        width={400}
                        height={300}
                        className='w-full h-48 object-cover rounded-md'
                        quality={75}
                      />
                      <button
                        type='button'
                        onClick={() => removePhoto(index)}
                        className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                    <div className='mt-3'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        사진 설명 (선택사항)
                      </label>
                      <textarea
                        value={photo.description}
                        onChange={e =>
                          updatePhotoDescription(index, e.target.value)
                        }
                        placeholder='이 사진에 대한 설명을 입력하세요...'
                        className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 전체 설명 */}
          <div className='space-y-2'>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700'
            >
              전체 설명 및 성찰 (선택사항)
            </label>
            <textarea
              id='description'
              {...getFieldProps('description')}
              onChange={e => setFieldValue('description', e.target.value)}
              placeholder='오늘의 훈련에 대한 전체적인 생각이나 느낀 점을 자유롭게 작성해주세요...'
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                getFieldProps('description').error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              rows={4}
            />
            <div className='flex justify-between text-xs text-gray-500'>
              <span>{values.description.length}/1000자</span>
              {getFieldProps('description').error && (
                <span className='text-red-600'>
                  {getFieldProps('description').error}
                </span>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className='flex justify-end space-x-3 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={onCancel}
              disabled={isSubmitting}
              className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
            >
              취소
            </button>
            <button
              type='submit'
              disabled={
                !isValid ||
                isSubmitting ||
                (!isOnline && !networkBehavior.allowUploads)
              }
              className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  {!isOnline ? '오프라인 저장 중...' : '제출 중...'}
                </div>
              ) : !isOnline ? (
                '📱 오프라인 저장'
              ) : (
                '일지 제출'
              )}
            </button>
            {retryCount > 0 && (
              <span className='text-sm text-gray-500'>
                재시도 {retryCount}회
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default PhotoJournalForm;
