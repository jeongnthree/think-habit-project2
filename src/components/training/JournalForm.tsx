// Think-Habit Lite Journal Form (간소화)

import { Button, Input } from '@/components/ui';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';

interface Category {
  id: string;
  name: string;
  description?: string;
  template?: string;
}

interface Journal {
  id?: string;
  studentId: string;
  categoryId: string;
  title: string;
  content: string;
  attachments: string[];
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface JournalFormProps {
  category: Category;
  studentId: string;
  existingJournal?: Journal;
  onSave?: (journal: Journal) => void;
  onCancel?: () => void;
}

export const JournalForm: React.FC<JournalFormProps> = ({
  category,
  studentId,
  existingJournal,
  onSave,
  onCancel,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 폼 상태
  const [title, setTitle] = useState(existingJournal?.title || '');
  const [content, setContent] = useState(existingJournal?.content || category.template || '');
  const [isPublic, setIsPublic] = useState(existingJournal?.isPublic || false);
  const [attachments, setAttachments] = useState<string[]>(existingJournal?.attachments || []);

  // 로딩 상태
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 저장 함수
  const handleSave = async () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const journalData: Journal = {
        id: existingJournal?.id,
        studentId,
        categoryId: category.id,
        title: title.trim(),
        content: content.trim(),
        attachments,
        isPublic,
      };

      const response = await fetch('/api/journals', {
        method: existingJournal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journalData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '저장에 실패했습니다.');
      }

      setSuccess('훈련 일지가 저장되었습니다!');

      if (onSave) {
        onSave(result.data);
      } else {
        setTimeout(() => {
          router.push('/training');
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 파일 업로드 (간단한 버전)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // 실제로는 파일을 서버에 업로드하고 URL을 받아야 함
    // 여기서는 간단히 파일명만 저장
    const fileNames = Array.from(files).map(file => file.name);
    setAttachments(prev => [...prev, ...fileNames]);
  };

  // 첨부파일 삭제
  const handleDeleteAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {existingJournal ? '훈련 일지 수정' : '새 훈련 일지'}
            </h1>
            <p className="text-gray-600 mt-1">{category.name}</p>
          </div>
        </div>

        {/* 제목 입력 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목 <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="훈련 일지 제목을 입력하세요"
            disabled={saving}
          />
        </div>
      </div>

      {/* 내용 입력 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="훈련 내용을 자세히 작성해주세요..."
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />
      </div>

      {/* 첨부파일 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">첨부파일</h3>
        
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            variant="secondary"
          >
            파일 추가
          </Button>
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((filename, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{filename}</span>
                <button
                  onClick={() => handleDeleteAttachment(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  disabled={saving}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 공개 설정 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">공개 설정</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mr-2"
            disabled={saving}
          />
          <span className="text-sm">커뮤니티에 공개하기</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          공개로 설정하면 다른 사용자들이 볼 수 있고 댓글을 남길 수 있습니다.
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border p-6">
        <div>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={saving}
            >
              취소
            </Button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            loading={saving}
          >
            {existingJournal ? '수정' : '저장'}
          </Button>
        </div>
      </div>

      {/* 상태 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-700">{success}</div>
        </div>
      )}
    </div>
  );
};