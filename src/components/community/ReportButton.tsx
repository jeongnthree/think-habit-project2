'use client';

import { AlertTriangle, Flag } from 'lucide-react';
import { useState } from 'react';

interface ReportButtonProps {
  contentType: 'comment' | 'journal';
  contentId: string;
  reportedUserId: string;
  className?: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: '스팸/광고' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'harassment', label: '괴롭힘/욕설' },
  { value: 'offensive', label: '혐오 발언' },
  { value: 'other', label: '기타' },
];

export default function ReportButton({
  contentType,
  contentId,
  reportedUserId,
  className = '',
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isReported, setIsReported] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      alert('신고 사유를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/community/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reported_content_type: contentType,
          reported_content_id: contentId,
          reported_user_id: reportedUserId,
          reason: selectedReason,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsReported(true);
        setIsOpen(false);
        alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      } else {
        alert(data.error || '신고 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isReported) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 ${className}`}
      >
        <Flag className='w-3 h-3' />
        신고됨
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${className}`}
        title='신고하기'
      >
        <Flag className='w-3 h-3' />
        신고
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
            <div className='flex items-center gap-2 mb-4'>
              <AlertTriangle className='w-5 h-5 text-red-500' />
              <h3 className='text-lg font-semibold'>콘텐츠 신고</h3>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  신고 사유 *
                </label>
                <div className='space-y-2'>
                  {REPORT_REASONS.map(reason => (
                    <label key={reason.value} className='flex items-center'>
                      <input
                        type='radio'
                        name='reason'
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={e => setSelectedReason(e.target.value)}
                        className='mr-2'
                      />
                      <span className='text-sm'>{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  상세 설명 (선택사항)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='신고 사유에 대한 추가 설명을 입력해주세요...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  rows={3}
                  maxLength={500}
                />
                <div className='text-xs text-gray-500 mt-1'>
                  {description.length}/500자
                </div>
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting || !selectedReason}
                  className='flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors'
                >
                  {isSubmitting ? '신고 중...' : '신고하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
