export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const isDesktopApp = searchParams.get('app') === 'desktop';
    const callbackPort = searchParams.get('port') || '8888';

    console.log('=== Google OAuth API 콜백 ===');
    console.log('Code:', code ? `${code.substring(0, 20)}...` : '❌ 없음');
    console.log('State:', state || '❌ 없음');
    console.log('Error:', error || '✅ 없음');
    console.log('Desktop App:', isDesktopApp);
    console.log('Callback Port:', callbackPort);
    console.log('Full URL:', request.url);

    if (error) {
      if (isDesktopApp) {
        // 데스크톱 앱 에러 콜백
        return NextResponse.redirect(
          `http://localhost:${callbackPort}/auth/callback?error=${encodeURIComponent(error)}`
        );
      } else {
        // 웹 에러 콜백
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?error=${encodeURIComponent(error)}`
        );
      }
    }

    if (!code) {
      const errorMsg = '인증 코드가 없습니다';
      if (isDesktopApp) {
        return NextResponse.redirect(
          `http://localhost:${callbackPort}/auth/callback?error=${encodeURIComponent(errorMsg)}`
        );
      } else {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?error=${encodeURIComponent(errorMsg)}`
        );
      }
    }

    // 인증 코드로 토큰 교환 (간단한 Mock 구현)
    try {
      // Google OAuth 토큰 교환 (실제 구현 시 필요)
      const tokenResponse = await exchangeCodeForToken(code);
      
      if (tokenResponse.success) {
        const { access_token, user } = tokenResponse;

        if (isDesktopApp) {
          // 데스크톱 앱 성공 콜백
          return NextResponse.redirect(
            `http://localhost:${callbackPort}/auth/callback?token=${access_token}&user=${encodeURIComponent(JSON.stringify(user))}`
          );
        } else {
          // 웹 성공 콜백
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?code=${code}&state=${state || ''}`
          );
        }
      } else {
        throw new Error(tokenResponse.error || '토큰 교환 실패');
      }

    } catch (tokenError) {
      console.error('토큰 교환 오류:', tokenError);
      const errorMsg = '인증 처리 중 오류가 발생했습니다';
      
      if (isDesktopApp) {
        return NextResponse.redirect(
          `http://localhost:${callbackPort}/auth/callback?error=${encodeURIComponent(errorMsg)}`
        );
      } else {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?error=${encodeURIComponent(errorMsg)}`
        );
      }
    }

  } catch (error) {
    console.error('Google OAuth API 콜백 오류:', error);
    const errorMsg = '서버 오류가 발생했습니다';
    
    const { searchParams } = new URL(request.url);
    const isDesktopApp = searchParams.get('app') === 'desktop';
    const callbackPort = searchParams.get('port') || '8888';

    if (isDesktopApp) {
      return NextResponse.redirect(
        `http://localhost:${callbackPort}/auth/callback?error=${encodeURIComponent(errorMsg)}`
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?error=${encodeURIComponent(errorMsg)}`
      );
    }
  }
}

// Google OAuth 토큰 교환 함수 (Mock 구현)
async function exchangeCodeForToken(code: string): Promise<{
  success: boolean;
  access_token?: string;
  user?: any;
  error?: string;
}> {
  try {
    // 실제 구현에서는 Google OAuth API 호출
    // 지금은 Mock 데이터 반환
    console.log('🔄 토큰 교환 시작 (Mock):', code.substring(0, 20) + '...');
    
    // Mock 사용자 데이터
    const mockUser = {
      id: '8236e966-ba4c-46d8-9cda-19bc67ec305d',
      email: 'test@google.com',
      name: 'Google 사용자',
      avatar_url: 'https://via.placeholder.com/100'
    };

    const mockToken = `mock_token_${Date.now()}`;

    return {
      success: true,
      access_token: mockToken,
      user: mockUser
    };

    /* 실제 Google OAuth 구현 예시:
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      }),
    });

    const tokenData = await response.json();
    
    if (!response.ok) {
      throw new Error(tokenData.error_description || '토큰 교환 실패');
    }

    // 사용자 정보 조회
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    return {
      success: true,
      access_token: tokenData.access_token,
      user: userData
    };
    */

  } catch (error) {
    console.error('토큰 교환 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}
