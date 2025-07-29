import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();

    console.log('🔐 데스크톱 앱 OAuth 토큰 교환 요청');

    if (!code) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // Google OAuth 토큰 교환
    const tokenResponse = await exchangeCodeForToken(code);

    // Google 사용자 정보 가져오기
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // 사용자 정보를 Supabase에 저장 또는 업데이트
    const user = await saveOrUpdateUser(userInfo);

    // 임시 세션 토큰 생성 (Supabase OAuth 우회)
    const session = {
      access_token: generateTempToken(userInfo),
      user: {
        id: userInfo.id,
        email: userInfo.email,
        user_metadata: {
          name: userInfo.name,
          avatar_url: userInfo.picture
        }
      }
    };

    console.log('✅ 데스크톱 앱 OAuth 성공:', user.name);

    return NextResponse.json({
      success: true,
      user: user,
      session: session,
      token: session.access_token
    });

  } catch (error) {
    console.error('❌ 데스크톱 앱 OAuth 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

// Google OAuth 토큰 교환
async function exchangeCodeForToken(code: string) {
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:8888/auth/callback', // 데스크톱 앱의 콜백 URL
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
async function getUserInfo(accessToken: string) {
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

// Supabase 클라이언트 생성
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// 사용자 정보 저장 또는 업데이트
async function saveOrUpdateUser(googleUser: any) {
  const supabase = getSupabaseAdmin();

  // 먼저 기존 사용자 확인
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('*')
    .eq('email', googleUser.email)
    .single();

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('사용자 조회 오류:', selectError);
    throw new Error('사용자 조회에 실패했습니다.');
  }

  const userData = {
    auth_id: googleUser.id, // Google ID를 auth_id로 사용
    email: googleUser.email,
    name: googleUser.name,
    avatar_url: googleUser.picture,
    role: 1, // 기본 학습자 역할
    status: 'active',
    profile: {
      provider: 'google',
      google_id: googleUser.id
    },
    updated_at: new Date().toISOString()
  };

  if (existingUser) {
    // 기존 사용자 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(userData)
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('사용자 업데이트 오류:', updateError);
      throw new Error('사용자 정보 업데이트에 실패했습니다.');
    }

    return updatedUser;
  } else {
    // 새 사용자 생성
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        ...userData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('사용자 생성 오류:', insertError);
      throw new Error('새 사용자 생성에 실패했습니다.');
    }

    return newUser;
  }
}

// Supabase OAuth 완전 우회 - 직접 토큰 생성만 사용

// 임시 토큰 생성 (Supabase 세션 생성 실패 시 대체용)
function generateTempToken(googleUser: any): string {
  const payload = {
    sub: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    provider: 'google',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24시간
  };

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa('temp-desktop-signature');

  return `${header}.${body}.${signature}`;
}