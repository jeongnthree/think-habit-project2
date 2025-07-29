// src/components/auth/DirectGoogleLogin.tsx
// 직접 Google OAuth 구현을 사용하는 로그인 컴포넌트

'use client';

import { useState } from 'react';

interface DirectGoogleLoginProps {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DirectGoogleLogin({
  redirectTo = '/dashboard',
  className = '',
  children,
}: DirectGoogleLoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);

    try {
      // URL 파라미터에서 앱 정보 확인
      const urlParams = new URLSearchParams(window.location.search);
      const isDesktopApp = urlParams.get('app') === 'desktop';
      const callbackPort = urlParams.get('port') || '8888';

      // 직접 Google OAuth URL 생성
      const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      // 데스크톱 앱이면 localhost 콜백, 아니면 일반 웹 콜백
      const redirectUri = isDesktopApp 
        ? `${window.location.origin}/auth/google/callback?app=desktop&port=${callbackPort}`
        : `${window.location.origin}/auth/google/callback`;

      // State 파라미터 생성 (보안 및 리디렉션 정보)
      const state = Buffer.from(
        JSON.stringify({
          timestamp: Date.now(),
          redirectTo: redirectTo,
          isDesktopApp: isDesktopApp,
          callbackPort: callbackPort,
        })
      ).toString('base64');

      const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: state,
      });

      const oauthUrl = `${baseUrl}?${params.toString()}`;

      console.log('🚀 Google OAuth 시작:', {
        clientId: clientId?.substring(0, 20) + '...',
        redirectUri,
        isDesktopApp,
        oauthUrl: oauthUrl.substring(0, 100) + '...',
      });

      // Google OAuth 페이지로 리디렉션
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('❌ Google OAuth 시작 실패:', error);
      setIsLoading(false);
      alert('Google 로그인을 시작할 수 없습니다. 다시 시도해주세요.');
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={`
        flex items-center justify-center w-full py-3 px-4 
        border border-gray-300 rounded-md shadow-sm bg-white 
        text-sm font-medium text-gray-700 
        hover:bg-gray-50 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-blue-500 
        disabled:opacity-50 disabled:cursor-not-allowed 
        transition-colors duration-200
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3'></div>
          Google 로그인 중...
        </>
      ) : (
        <>
          <svg className='w-5 h-5 mr-3' viewBox='0 0 24 24'>
            <path
              fill='#4285f4'
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
            />
            <path
              fill='#34a853'
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
            />
            <path
              fill='#fbbc05'
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
            />
            <path
              fill='#ea4335'
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
            />
          </svg>
          {children || 'Google로 간편 로그인'}
        </>
      )}
    </button>
  );
}
