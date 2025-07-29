// src/app/auth/google/route.ts
// 직접 Google OAuth 구현 (Supabase Provider 우회)

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🚀 Google OAuth 시작');

  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app');
  const port = searchParams.get('port');
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Google OAuth URL 직접 생성
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  // OAuth 파라미터 설정
  googleAuthUrl.searchParams.set(
    'client_id',
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
  );

  // 데스크톱 앱에서의 요청인지 확인
  if (app === 'desktop' && port) {
    console.log('📱 데스크톱 앱 OAuth 요청:', { port });
    
    // 데스크톱 앱의 로컬 콜백 서버로 리다이렉트
    googleAuthUrl.searchParams.set(
      'redirect_uri',
      `http://localhost:${port}/auth/callback`
    );

    // 상태 파라미터에 데스크톱 정보 포함
    const state = Buffer.from(
      JSON.stringify({
        app: 'desktop',
        port: port,
        timestamp: Date.now(),
      })
    ).toString('base64');

    googleAuthUrl.searchParams.set('state', state);
  } else {
    console.log('🌐 웹 OAuth 요청');
    
    // 웹 앱의 콜백 URL
    googleAuthUrl.searchParams.set(
      'redirect_uri',
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
    );

    // 상태 파라미터 (CSRF 방지)
    const state = Buffer.from(
      JSON.stringify({
        redirectTo: redirectTo,
        timestamp: Date.now(),
      })
    ).toString('base64');

    googleAuthUrl.searchParams.set('state', state);
  }

  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');

  console.log('✅ Google OAuth URL 생성:', googleAuthUrl.toString());

  // Google OAuth 페이지로 리디렉션
  return NextResponse.redirect(googleAuthUrl.toString());
}
