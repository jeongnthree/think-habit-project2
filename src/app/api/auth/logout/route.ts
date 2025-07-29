import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('👋 로그아웃 요청 수신');

    const response = NextResponse.json({
      success: true,
      message: '로그아웃이 완료되었습니다.'
    });

    // 모든 인증 관련 쿠키 삭제
    response.cookies.delete('session_token');
    response.cookies.delete('auth_token');
    response.cookies.delete('sb-project-auth-token');

    console.log('✅ 로그아웃 완료');
    return response;

  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '로그아웃 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}