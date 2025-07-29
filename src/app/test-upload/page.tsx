'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles(fileArray);

      // 파일 정보 디버깅
      const fileInfo = fileArray.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }));
      setDebugInfo(`선택된 파일: ${JSON.stringify(fileInfo, null, 2)}`);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log('📤 업로드 시작...', files);

      const formData = new FormData();

      files.forEach((file, index) => {
        console.log(`파일 ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        formData.append('files', file);
      });

      formData.append('userId', '8236e966-ba4c-46d8-9cda-19bc67ec305d');
      formData.append('journalId', `test-${Date.now()}`);

      console.log('FormData 생성 완료');

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      console.log('API 응답 상태:', response.status);

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (response.ok && data.success) {
        setResult(data);
        console.log('✅ 업로드 성공:', data);
      } else {
        throw new Error(data.error || `HTTP ${response.status}: 업로드 실패`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      console.error('❌ 업로드 오류:', err);
    } finally {
      setUploading(false);
    }
  };

  // 간단한 API 테스트
  const testAPI = async () => {
    try {
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });

      const data = await response.json();
      console.log('API 테스트 결과:', data);
      setDebugInfo(`API 테스트: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error('API 테스트 오류:', err);
      setDebugInfo(`API 테스트 오류: ${err}`);
    }
  };

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <div className='bg-white rounded-lg shadow-sm border p-8'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>
          🧪 보안 이미지 업로드 테스트
        </h1>

        <div className='space-y-6'>
          {/* API 테스트 버튼 */}
          <div>
            <button
              onClick={testAPI}
              className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 mr-4'
            >
              API 연결 테스트
            </button>
          </div>

          {/* 파일 선택 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              이미지 파일 선택
            </label>
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={handleFileSelect}
              className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
            />
            {files.length > 0 && (
              <div className='mt-2 text-sm text-gray-600'>
                선택된 파일: {files.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {/* 업로드 버튼 */}
          <div>
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {uploading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  업로드 중...
                </div>
              ) : (
                '업로드 테스트'
              )}
            </button>
          </div>

          {/* 디버그 정보 */}
          {debugInfo && (
            <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
              <h3 className='text-gray-900 font-semibold mb-2'>
                🔍 디버그 정보
              </h3>
              <pre className='text-sm text-gray-700 whitespace-pre-wrap'>
                {debugInfo}
              </pre>
            </div>
          )}

          {/* 오류 메시지 */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-md p-4'>
              <div className='text-red-700'>❌ {error}</div>
            </div>
          )}

          {/* 성공 결과 */}
          {result && (
            <div className='bg-green-50 border border-green-200 rounded-md p-4'>
              <div className='text-green-900 font-semibold mb-2'>
                ✅ 업로드 성공!
              </div>
              <div className='text-sm text-green-800'>
                <p>
                  <strong>업로드된 파일 수:</strong>{' '}
                  {result.data?.urls?.length || 0}개
                </p>
                <p>
                  <strong>업로드 시간:</strong> {result.data?.uploadedAt}
                </p>
                {result.data?.urls && (
                  <div className='mt-2'>
                    <strong>업로드된 이미지:</strong>
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                      {result.data.urls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`업로드된 이미지 ${index + 1}`}
                          className='w-full h-32 object-cover rounded border'
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 보안 검증 정보 */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <h3 className='text-blue-900 font-semibold mb-2'>
              🔒 보안 검증 포인트
            </h3>
            <div className='text-sm text-blue-800 space-y-1'>
              <p>
                • 브라우저 개발자 도구(F12) → Network 탭에서 /api/upload/images
                호출 확인
              </p>
              <p>• Service Role Key가 클라이언트에 노출되지 않는지 확인</p>
              <p>• 파일 검증: 10MB 이하, 이미지 파일만, 최대 5개</p>
              <p>• 서버사이드에서만 Supabase Storage 접근</p>
            </div>
          </div>

          {/* 테스트 가이드 */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
            <h3 className='text-yellow-900 font-semibold mb-2'>
              📋 테스트 방법
            </h3>
            <div className='text-sm text-yellow-800 space-y-1'>
              <p>1. "API 연결 테스트" 버튼으로 서버 연결 확인</p>
              <p>2. 이미지 파일 선택 (JPG, PNG 등)</p>
              <p>3. "업로드 테스트" 버튼 클릭</p>
              <p>4. 성공 시 업로드된 이미지 확인</p>
              <p>5. 개발자 도구에서 네트워크 요청 확인</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
