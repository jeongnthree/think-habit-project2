import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userInfo, accessToken, idToken } = await request.json();

    if (!userInfo || !userInfo.email) {
      return NextResponse.json(
        { error: '사용자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('Google 로그인 요청:', {
      email: userInfo.email,
      name: userInfo.name,
      hasAccessToken: !!accessToken,
      hasIdToken: !!idToken,
    });

    // 테스트용 간단한 응답 반환
    return NextResponse.json({
      success: true,
      user: {
        id: 'test-user-id',
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        provider: 'google',
      },
    });
  } catch (error) {
    console.error('Google 로그인 처리 오류:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
