'use client';

import { platformService } from '@/lib/platform';
import React, { useEffect, useState } from 'react';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function WebJournalDemo() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    // 앱 정보 가져오기
    const getAppInfo = async () => {
      try {
        const appVersion = await platformService.appInfo.getVersion();
        const platformName = await platformService.appInfo.getPlatformName();
        setVersion(appVersion);
        setPlatform(platformName);
      } catch (error) {
        console.error('앱 정보 가져오기 실패:', error);
      }
    };

    // 저장된 일지 항목 가져오기
    const loadEntries = async () => {
      try {
        const savedEntries =
          await platformService.storage.get<JournalEntry[]>('journal_entries');
        if (savedEntries) {
          setEntries(savedEntries);
        }
      } catch (error) {
        console.error('일지 항목 로드 실패:', error);
      }
    };

    getAppInfo();
    loadEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content) {
      await platformService.notification.show(
        '입력 오류',
        '제목과 내용을 모두 입력해주세요.'
      );
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);

    // 스토리지에 저장
    await platformService.storage.set('journal_entries', updatedEntries);

    // 알림 표시
    await platformService.notification.show(
      '일지 저장 완료',
      '새 일지가 성공적으로 저장되었습니다.'
    );

    // 입력 필드 초기화
    setTitle('');
    setContent('');
  };

  const handleDelete = async (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);

    // 스토리지에 저장
    await platformService.storage.set('journal_entries', updatedEntries);

    // 알림 표시
    await platformService.notification.show(
      '일지 삭제 완료',
      '일지가 삭제되었습니다.'
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <div className='mb-8 flex justify-between items-center'>
        <h1 className='text-3xl font-bold text-blue-600'>웹 일지 데모</h1>
        <div className='text-sm text-gray-500'>
          버전: {version} ({platform})
        </div>
      </div>

      <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
        <h2 className='text-xl font-semibold mb-4'>새 일지 작성</h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='title'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              제목
            </label>
            <input
              type='text'
              id='title'
              value={title}
              onChange={e => setTitle(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              placeholder='일지 제목을 입력하세요'
            />
          </div>
          <div>
            <label
              htmlFor='content'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              내용
            </label>
            <textarea
              id='content'
              value={content}
              onChange={e => setContent(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              rows={5}
              placeholder='오늘의 생각과 경험을 기록해보세요...'
            />
          </div>
          <button
            type='submit'
            className='bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors'
          >
            저장
          </button>
        </form>
      </div>

      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-xl font-semibold mb-4'>일지 목록</h2>
        {entries.length === 0 ? (
          <p className='text-gray-500 text-center py-8'>
            작성된 일지가 없습니다. 첫 번째 일지를 작성해보세요!
          </p>
        ) : (
          <div className='space-y-4'>
            {entries.map(entry => (
              <div
                key={entry.id}
                className='border border-gray-200 rounded-md p-4'
              >
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg font-medium'>{entry.title}</h3>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className='text-red-500 hover:text-red-700'
                  >
                    삭제
                  </button>
                </div>
                <p className='text-sm text-gray-500 mb-2'>
                  {formatDate(entry.createdAt)}
                </p>
                <p className='whitespace-pre-wrap'>{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
