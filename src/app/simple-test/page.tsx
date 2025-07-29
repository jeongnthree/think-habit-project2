'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
    }
  };

  const handleSimpleUpload = async () => {
    if (files.length === 0) {
      setError('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log('📤 간단 업로드 시작...', files);

      const formData = new FormData();

      files.forEach((file, index) => {
        console.log(`파일 ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
        });
        formData.append('files', file);
      });

      formData.append('userId', 'test-user-simple');

      const response = await fetch('/api/upload/simple', {
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

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <div className='bg-white rounded-lg shadow-sm border p-8'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>
          🚀 간단한 업로드 테스트
        </h1>

        <div className='space-y-6'>
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
                선택된 파일:{' '}
                {files
                  .map(
                    f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`
                  )
                  .join(', ')}
              </div>
            )}
          </div>

          {/* 업로드 버튼 */}
          <div>
            <button
              onClick={handleSimpleUpload}
              disabled={uploading || files.length === 0}
              className='bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {uploading ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  업로드 중...
                </div>
              ) : (
                '간단한 업로드 테스트'
              )}
            </button>
          </div>

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
                  {result.data?.successCount || 0}개
                </p>
                <p>
                  <strong>전체 파일 수:</strong> {result.data?.totalFiles || 0}
                  개
                </p>
                <p>
                  <strong>업로드 시간:</strong> {result.data?.uploadedAt}
                </p>
                {result.data?.urls && (
                  <div className='mt-4'>
                    <strong>업로드된 이미지:</strong>
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                      {result.data.urls.map((url: string, index: number) => (
                        <div key={index} className='border rounded p-2'>
                          <img
                            src={url}
                            alt={`업로드된 이미지 ${index + 1}`}
                            className='w-full h-32 object-cover rounded mb-2'
                          />
                          <p className='text-xs text-gray-600 break-all'>
                            {url}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.warnings && (
                  <div className='mt-2 text-yellow-700'>
                    <strong>경고:</strong> {result.warnings.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 사용법 안내 */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <h3 className='text-blue-900 font-semibold mb-2'>📋 사용법</h3>
            <div className='text-sm text-blue-800 space-y-1'>
              <p>1. 이미지 파일을 선택하세요 (JPG, PNG, GIF, WebP)</p>
              <p>2. "간단한 업로드 테스트" 버튼을 클릭하세요</p>
              <p>3. 브라우저 개발자 도구(F12) → Console에서 로그 확인</p>
              <p>4. Network 탭에서 /api/upload/simple 요청 확인</p>
            </div>
          </div>

          {/* 보안 확인 */}
          <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
            <h3 className='text-yellow-900 font-semibold mb-2'>🔒 보안 확인</h3>
            <div className='text-sm text-yellow-800 space-y-1'>
              <p>• Service Role Key가 클라이언트에 노출되지 않는지 확인</p>
              <p>• 모든 업로드가 서버사이드 API를 통해 처리됨</p>
              <p>• Supabase Storage에 안전하게 저장됨</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
