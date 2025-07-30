import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 인증 토큰 확인
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const authToken = cookieStore.get('auth_token')?.value;

    const token = bearerToken || sessionToken || authToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 토큰에서 사용자 정보 추출
    const userInfo = extractUserFromToken(token);
    
    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // Supabase에서 사용자 정보 조회
    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userInfo.sub || userInfo.userId)
      .single();

    if (error) {
      console.error('사용자 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        auth_id: user.auth_id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status,
        profile: user.profile,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('❌ 사용자 정보 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
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

// 토큰에서 사용자 정보 추출
function extractUserFromToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]!));
    
    // 토큰 만료 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('토큰 만료됨');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('토큰 파싱 오류:', error);
    return null;
  }
}