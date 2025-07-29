import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Supabase 서버 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // 현재 세션 확인
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('세션 확인 오류:', error);
      return NextResponse.json({
        isAuthenticated: false,
        error: error.message
      });
    }

    if (!session) {
      return NextResponse.json({
        isAuthenticated: false,
        session: null,
        user: null
      });
    }

    // 사용자 데이터베이스 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('사용자 조회 오류:', userError);
    }

    return NextResponse.json({
      isAuthenticated: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user
      },
      user: user || {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
        avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
      }
    });

  } catch (error) {
    console.error('❌ 인증 상태 확인 실패:', error);
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}