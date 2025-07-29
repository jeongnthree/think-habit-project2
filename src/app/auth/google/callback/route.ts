// 간단한 테스트용 콜백
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  console.log('🔄 간단 콜백 테스트:', { hasCode: !!code, error });

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=no_code', requestUrl.origin)
    );
  }

  // 일단 성공으로 간주하고 대시보드로 리다이렉트
  console.log('✅ 코드 받음, 대시보드로 리다이렉트');
  
  const response = NextResponse.redirect(
    new URL('/dashboard', requestUrl.origin)
  );

  // 성공 쿠키 설정
  response.cookies.set('temp-login-success', 'true', {
    httpOnly: true,
    maxAge: 60 * 10, // 10분
  });

  return response;
}