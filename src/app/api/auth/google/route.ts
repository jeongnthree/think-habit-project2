import {
  AuthResult,
  GoogleAuthResponse,
  GoogleUserInfo,
} from '../../../../../shared/types/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: '인증 코드가 없습니다.',
        } as AuthResult,
        { status: 400 }
      );
    }

    // Google OAuth 토큰 교환
    const tokenResponse = await exchangeCodeForToken(code);

    // Google 사용자 정보 가져오기
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // 사용자 정보를 데이터베이스에 저장 또는 업데이트
    const user = await saveOrUpdateUser(userInfo);

    // JWT 토큰 생성
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      provider: 'google',
    });

    const authResult: AuthResult = {
      success: true,
      user,
      token,
    };

    return NextResponse.json(authResult);
  } catch (error) {
    console.error('Google 로그인 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Google 로그인에 실패했습니다.',
      } as AuthResult,
      { status: 500 }
    );
  }
}

// Google OAuth 토큰 교환
async function exchangeCodeForToken(code: string): Promise<GoogleAuthResponse> {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('토큰 교환 실패:', errorData);
    throw new Error('토큰 교환에 실패했습니다.');
  }

  return response.json();
}

// Google 사용자 정보 가져오기
async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';

  const response = await fetch(userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('사용자 정보를 가져오는데 실패했습니다.');
  }

  return response.json();
}

// 사용자 정보 저장 또는 업데이트
async function saveOrUpdateUser(googleUser: GoogleUserInfo) {
  // TODO: 실제 데이터베이스 연동
  // 현재는 임시로 Google 사용자 정보를 반환

  const user = {
    id: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    provider: 'google' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Supabase 연동 예시 (주석 처리)
  /*
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      provider: 'google',
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('사용자 저장 오류:', error);
    throw new Error('사용자 정보 저장에 실패했습니다.');
  }

  return data;
  */

  return user;
}

// JWT 토큰 생성 (임시)
function generateJWT(payload: {
  userId: string;
  email: string;
  provider: string;
}): string {
  // 실제 구현에서는 jsonwebtoken 라이브러리 사용
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 86400000, // 24시간
    })
  );
  const signature = btoa('temporary-signature');

  return `${header}.${body}.${signature}`;
}

// OAuth 콜백 처리 (GET 요청)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (code) {
    try {
      // 토큰 교환 및 사용자 정보 처리
      const tokenResponse = await exchangeCodeForToken(code);
      const userInfo = await getUserInfo(tokenResponse.access_token);
      const user = await saveOrUpdateUser(userInfo);
      const token = generateJWT({
        userId: user.id,
        email: user.email,
        provider: 'google',
      });

      // 성공 시 대시보드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
      return NextResponse.redirect(
        new URL(`/dashboard?token=${token}`, request.url)
      );
    } catch (err) {
      console.error('OAuth 콜백 처리 오류:', err);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('Google 로그인에 실패했습니다.')}`,
          request.url
        )
      );
    }
  }

  // 코드나 에러가 없는 경우
  return NextResponse.redirect(new URL('/login', request.url));
}
