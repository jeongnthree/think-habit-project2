import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { source, token, timestamp } = await request.json();

    console.log('🔄 인증 동기화 요청:', { source, hasToken: !!token, timestamp });

    // 토큰 검증 (실제로는 JWT 검증 등을 수행해야 함)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    // 웹에서 세션 쿠키 설정
    const cookieStore = await cookies();
    const response = NextResponse.json({
      success: true,
      message: '인증 동기화가 완료되었습니다.',
      source: source,
      syncedAt: new Date().toISOString()
    });

    // 동기화된 토큰을 쿠키에 저장
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24시간
    });

    console.log('✅ 인증 동기화 성공');
    return response;

  } catch (error) {
    console.error('❌ 인증 동기화 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '인증 동기화 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}