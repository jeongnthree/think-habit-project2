'use client';

import { Button, Card, ConfirmModal } from '@/components/ui';
import { JournalWithDetails, TaskTemplate } from '@/types/database';
import { AlertTriangle, Camera, Save, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

interface EditJournalFormProps {
  journal: JournalWithDetails;
  onSave: (updatedJournal: any) => void;
  onCancel: () => void;
}

interface PhotoPreview {
  id?: string;
  file?: File;
  url: string;
  caption: string;
  isNew?: boolean;
  toDelete?: boolean;
}

interface TaskCompletionEdit {
  id?: string;
  task_template_id: string;
  is_completed: boolean;
  completion_note: string;
  task_template?: TaskTemplate;
}

export function EditJournalForm({
  journal,
  onSave,
  onCancel,
}: EditJournalFormProps) {
  const [title, setTitle] = useState(journal.title);
  const [content, setContent] = useState(journal.content);
  const [isPublic, setIsPublic] = useState(journal.is_public);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // For structured journals
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletionEdit[]>(
    []
  );

  // For photo journals
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Initialize form data based on journal type
  useEffect(() => {
    if (journal.journal_type === 'structured') {
      const completions = (journal as any).task_completions || [];
      setTaskCompletions(
        completions.map((tc: any) => ({
          id: tc.id,
          task_template_id: tc.task_template_id,
          is_completed: tc.is_completed,
          completion_note: tc.completion_note || '',
          task_template: tc.task_template,
        }))
      );
    } else if (journal.journal_type === 'photo') {
      const journalPhotos = (journal as any).journal_photos || [];
      setPhotos(
        journalPhotos.map((photo: any) => ({
          id: photo.id,
          url: photo.photo_url,
          caption: photo.caption || '',
          isNew: false,
        }))
      );
    }
  }, [journal]);

  // Track changes
  useEffect(() => {
    const hasChanged =
      title !== journal.title ||
      content !== journal.content ||
      isPublic !== journal.is_public ||
      (journal.journal_type === 'structured' && hasTaskChanges()) ||
      (journal.journal_type === 'photo' && hasPhotoChanges());

    setHasChanges(hasChanged);
  }, [title, content, isPublic, taskCompletions, photos, journal]);

  // Check if task completions have changed
  const hasTaskChanges = useCallback(() => {
    const originalCompletions = (journal as any).task_completions || [];
    if (taskCompletions.length !== originalCompletions.length) return true;

    return taskCompletions.some((tc, index) => {
      const original = originalCompletions[index];
      return (
        tc.is_completed !== original?.is_completed ||
        tc.completion_note !== (original?.completion_note || '')
      );
    });
  }, [taskCompletions, journal]);

  // Check if photos have changed
  const hasPhotoChanges = useCallback(() => {
    const originalPhotos = (journal as any).journal_photos || [];
    const currentPhotos = photos.filter(p => !p.toDelete);

    // Check if any photos are marked for deletion
    if (photos.some(p => p.toDelete)) return true;

    // Check if any new photos are added
    if (photos.some(p => p.isNew)) return true;

    // Check if captions have changed
    return photos.some((photo, index) => {
      const original = originalPhotos.find((op: any) => op.id === photo.id);
      return original && photo.caption !== (original.caption || '');
    });
  }, [photos, journal]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue =
          '변경사항이 저장되지 않았습니다. 정말로 나가시겠습니까?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // File validation for photo journals
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return '지원되는 이미지 형식: JPG, PNG, HEIC, WebP';
    }

    if (file.size > maxSize) {
      return '파일 크기는 10MB 이하여야 합니다';
    }

    return null;
  };

  // Handle file upload for photo journals
  const handleFiles = useCallback(async (files: FileList) => {
    const newPhotos: PhotoPreview[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      if (error) {
        errors.push(`${file.name}: ${error}`);
        continue;
      }

      const url = URL.createObjectURL(file);
      newPhotos.push({
        file,
        url,
        caption: '',
        isNew: true,
      });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  // Drag and drop handlers
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

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  // Remove photo
  const removePhoto = useCallback((index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      const photo = newPhotos[index];

      if (photo.isNew) {
        // Remove new photo completely
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
        newPhotos.splice(index, 1);
      } else {
        // Mark existing photo for deletion
        newPhotos[index] = { ...photo, toDelete: true };
      }

      return newPhotos;
    });
  }, []);

  // Update photo caption
  const updatePhotoCaption = useCallback((index: number, caption: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index] = { ...newPhotos[index], caption };
      return newPhotos;
    });
  }, []);

  // Update task completion
  const updateTaskCompletion = useCallback(
    (
      taskId: string,
      field: keyof TaskCompletionEdit,
      value: boolean | string
    ) => {
      setTaskCompletions(prev =>
        prev.map(tc =>
          tc.task_template_id === taskId ? { ...tc, [field]: value } : tc
        )
      );
    },
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const updateData: any = {
        title: title.trim(),
        content: content.trim(),
        is_public: isPublic,
      };

      // Add journal-type specific data
      if (journal.journal_type === 'structured') {
        updateData.task_completions = taskCompletions.map(tc => ({
          id: tc.id,
          task_template_id: tc.task_template_id,
          is_completed: tc.is_completed,
          completion_note: tc.completion_note.trim() || null,
        }));
      } else if (journal.journal_type === 'photo') {
        // Handle photo updates
        const photosToDelete = photos.filter(p => p.toDelete && p.id).map(p => p.id!);
        const photosToUpdate = photos
          .filter(p => !p.toDelete && !p.isNew && p.id)
          .map(p => ({ id: p.id!, caption: p.caption }));
        const newPhotos = photos.filter(p => p.isNew && p.file);

        updateData.photos_to_delete = photosToDelete;
        updateData.photos_to_update = photosToUpdate;
        updateData.new_photos = newPhotos;
      }

      const response = await fetch(`/api/training/journals/${journal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        onSave(result.data);
      } else {
        setError(result.error || '일지 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating journal:', error);
      setError('일지 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel with confirmation if there are changes
  const handleCancel = () => {
    if (hasChanges) {
      setConfirmModal({
        isOpen: true,
        title: '변경사항 취소',
        message: '저장하지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?',
        onConfirm: () => {
          setConfirmModal({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {},
          });
          onCancel();
        },
      });
    } else {
      onCancel();
    }
  };

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <h1 className='text-2xl font-bold text-gray-900'>일지 수정</h1>
          <div className='flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600'>
            {journal.journal_type === 'structured'
              ? '구조화된 일지'
              : '사진 일지'}
          </div>
          {hasChanges && (
            <span className='px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full'>
              변경됨
            </span>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className='h-4 w-4 mr-2' />
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>
            <Save className='h-4 w-4 mr-2' />
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Error Message */}
        {error && (
          <Card className='p-4 bg-red-50 border-red-200'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-red-500 mt-0.5 flex-shrink-0' />
              <div className='text-red-700 text-sm whitespace-pre-line'>
                {error}
              </div>
            </div>
          </Card>
        )}

        {/* Journal Type Info */}
        <Card className='p-4 bg-blue-50 border-blue-200'>
          <p className='text-sm text-blue-700'>
            <strong>참고:</strong>{' '}
            {journal.journal_type === 'structured'
              ? '구조화된 일지의 태스크 완료 상태와 메모를 수정할 수 있습니다.'
              : '사진 일지의 사진과 설명을 수정할 수 있습니다.'}
          </p>
        </Card>

        {/* Title */}
        <Card className='p-6'>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            제목 *
          </label>
          <input
            type='text'
            id='title'
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='일지 제목을 입력하세요'
            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            maxLength={200}
            disabled={isSubmitting}
          />
          <div className='text-right text-xs text-gray-500 mt-1'>
            {title.length}/200
          </div>
        </Card>

        {/* Journal Type Specific Content */}
        {journal.journal_type === 'structured' ? (
          <StructuredJournalEditContent
            taskCompletions={taskCompletions}
            onUpdateTaskCompletion={updateTaskCompletion}
            isSubmitting={isSubmitting}
          />
        ) : (
          <PhotoJournalEditContent
            photos={photos}
            onRemovePhoto={removePhoto}
            onUpdateCaption={updatePhotoCaption}
            onFileSelect={handleFileSelect}
            onDrag={handleDrag}
            onDrop={handleDrop}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Content/Description */}
        <Card className='p-6'>
          <label
            htmlFor='content'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            {journal.journal_type === 'photo' ? '설명 및 성찰' : '성찰 노트'} *
          </label>
          <textarea
            id='content'
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              journal.journal_type === 'photo'
                ? '사진에 대한 설명과 성찰을 입력하세요'
                : '훈련에 대한 성찰을 입력하세요'
            }
            rows={8}
            className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical'
            disabled={isSubmitting}
          />
          <div className='text-right text-xs text-gray-500 mt-1'>
            {content.length} 글자
          </div>
        </Card>

        {/* Public Setting */}
        <Card className='p-6'>
          <label className='flex items-center gap-3'>
            <input
              type='checkbox'
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
              disabled={isSubmitting}
            />
            <div>
              <span className='text-sm font-medium text-gray-700'>
                공개 일지로 설정
              </span>
              <p className='text-xs text-gray-500'>
                다른 사용자들이 이 일지를 볼 수 있습니다.
              </p>
            </div>
          </label>
        </Card>

        {/* Submit Button */}
        <div className='flex justify-end pt-6 border-t border-gray-200'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type='submit' disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {},
          })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel='확인'
        cancelLabel='취소'
        type='warning'
      />
    </div>
  );
}

// Structured Journal Edit Content Component
function StructuredJournalEditContent({
  taskCompletions,
  onUpdateTaskCompletion,
  isSubmitting,
}: {
  taskCompletions: TaskCompletionEdit[];
  onUpdateTaskCompletion: (
    taskId: string,
    field: keyof TaskCompletionEdit,
    value: boolean | string
  ) => void;
  isSubmitting: boolean;
}) {
  const completedTasks = taskCompletions.filter(tc => tc.is_completed).length;
  const totalTasks = taskCompletions.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className='p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
        태스크 완료 상태
      </h3>

      {/* Progress Summary */}
      <div className='bg-blue-50 rounded-lg p-4 mb-6'>
        <div className='flex items-center justify-between mb-2'>
          <span className='font-semibold text-blue-900'>완료율</span>
          <span className='text-blue-700 font-medium'>{completionRate}%</span>
        </div>
        <div className='w-full bg-blue-200 rounded-full h-2 mb-2'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className='text-sm text-blue-700'>
          {completedTasks}개 완료 / 총 {totalTasks}개 태스크
        </p>
      </div>

      {/* Task List */}
      <div className='space-y-4'>
        {taskCompletions.map((completion, index) => (
          <div
            key={completion.task_template_id}
            className={`border rounded-lg p-4 transition-all ${
              completion.is_completed
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className='flex items-start gap-4'>
              <input
                type='checkbox'
                checked={completion.is_completed}
                onChange={e =>
                  onUpdateTaskCompletion(
                    completion.task_template_id,
                    'is_completed',
                    e.target.checked
                  )
                }
                className='h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1'
                disabled={isSubmitting}
              />
              <div className='flex-1'>
                <h4
                  className={`font-medium ${
                    completion.is_completed
                      ? 'text-green-900 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {index + 1}.{' '}
                  {completion.task_template?.title || '태스크 제목 없음'}
                </h4>
                {completion.task_template?.description && (
                  <p
                    className={`text-sm mt-1 ${
                      completion.is_completed
                        ? 'text-green-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {completion.task_template.description}
                  </p>
                )}
                <div className='mt-3'>
                  <label className='block text-xs font-medium text-gray-500 mb-1'>
                    완료 메모
                  </label>
                  <textarea
                    value={completion.completion_note}
                    onChange={e =>
                      onUpdateTaskCompletion(
                        completion.task_template_id,
                        'completion_note',
                        e.target.value
                      )
                    }
                    placeholder='이 태스크를 어떻게 완료했는지 메모해보세요...'
                    rows={2}
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500'
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Photo Journal Edit Content Component
function PhotoJournalEditContent({
  photos,
  onRemovePhoto,
  onUpdateCaption,
  onFileSelect,
  onDrag,
  onDrop,
  dragActive,
  fileInputRef,
  isSubmitting,
}: {
  photos: PhotoPreview[];
  onRemovePhoto: (index: number) => void;
  onUpdateCaption: (index: number, caption: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  dragActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isSubmitting: boolean;
}) {
  const visiblePhotos = photos.filter(p => !p.toDelete);

  return (
    <Card className='p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>사진 관리</h3>

      {/* Add New Photos */}
      <div className='mb-6'>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept='image/*'
            onChange={onFileSelect}
            className='hidden'
            disabled={isSubmitting}
          />
          <div className='space-y-2'>
            <Upload className='h-8 w-8 text-gray-400 mx-auto' />
            <p className='text-sm text-gray-600'>
              새 사진을 추가하려면 드래그하거나 클릭하세요
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Camera className='h-4 w-4 mr-2' />
              파일 선택
            </Button>
          </div>
        </div>
      </div>

      {/* Existing Photos */}
      {visiblePhotos.length > 0 && (
        <div>
          <h4 className='font-medium text-gray-900 mb-3'>
            사진 ({visiblePhotos.length}장)
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {visiblePhotos.map((photo, index) => (
              <div
                key={photo.id || index}
                className='border border-gray-200 rounded-lg p-4'
              >
                <div className='relative'>
                  <Image
                    src={photo.url}
                    alt={`사진 ${index + 1}`}
                    width={400}
                    height={300}
                    className='w-full h-48 object-cover rounded-md'
                  />
                  <button
                    type='button'
                    onClick={() => onRemovePhoto(index)}
                    className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500'
                    disabled={isSubmitting}
                  >
                    <X className='h-4 w-4' />
                  </button>
                  {photo.isNew && (
                    <span className='absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded'>
                      새 사진
                    </span>
                  )}
                </div>
                <div className='mt-3'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    사진 설명
                  </label>
                  <textarea
                    value={photo.caption}
                    onChange={e => onUpdateCaption(index, e.target.value)}
                    placeholder='이 사진에 대한 설명을 입력하세요...'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
