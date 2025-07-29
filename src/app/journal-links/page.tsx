'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function JournalLinksPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-lg p-8 max-w-md w-full'>
        <h1 className='text-2xl font-bold text-blue-600 mb-6'>
          Think-Habit Journal 테스트 링크
        </h1>

        <div className='space-y-4'>
          <Link
            href='/journal-test'
            className='block w-full bg-blue-100 hover:bg-blue-200 text-blue-800 p-4 rounded-md transition-colors'
          >
            기본 테스트 페이지
          </Link>

          <Link
            href='/journal-web'
            className='block w-full bg-green-100 hover:bg-green-200 text-green-800 p-4 rounded-md transition-colors'
          >
            웹 일지 데모
          </Link>

          {isClient && (
            <div className='mt-8 pt-4 border-t border-gray-200'>
              <h2 className='text-lg font-semibold mb-2'>로컬 스토리지 정보</h2>
              <div className='bg-gray-50 p-3 rounded-md'>
                <p className='text-sm mb-1'>
                  <strong>사용자:</strong>{' '}
                  {localStorage.getItem('user') ? '저장됨' : '없음'}
                </p>
                <p className='text-sm'>
                  <strong>토큰:</strong>{' '}
                  {localStorage.getItem('tokens') ? '저장됨' : '없음'}
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.clear();
                  alert('로컬 스토리지가 초기화되었습니다.');
                  window.location.reload();
                }}
                className='mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors text-sm'
              >
                로컬 스토리지 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
