import { NextRequest, NextResponse } from 'next/server';

// 구글 OAuth 토큰 교환 인터페이스
interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 환경 변수 확인
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth 환경 변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류입니다.' },
        { status: 500 }
      );
    }

    // 구글에 토큰 요청
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Google 토큰 교환 실패:', errorData);
      return NextResponse.json(
        { error: '토큰 교환에 실패했습니다.' },
        { status: 400 }
      );
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('토큰 교환 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
