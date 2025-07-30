import { AuthResult, LoginCredentials } from '../../../../../shared/types/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();
    const { email, password } = credentials;

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: '이메일과 패스워드를 모두 입력해주세요.',
        } as AuthResult,
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: '올바른 이메일 형식을 입력해주세요.',
        } as AuthResult,
        { status: 400 }
      );
    }

    // TODO: 실제 데이터베이스 인증 로직 구현
    // 현재는 임시 하드코딩된 사용자로 테스트
    const testUser = {
      email: 'test@think-habit.com',
      password: 'test123',
    };

    if (email === testUser.email && password === testUser.password) {
      // 로그인 성공
      const authResult: AuthResult = {
        success: true,
        user: {
          id: '1',
          email: email,
          name: '테스트 사용자',
          provider: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: generateJWT({ userId: '1', email }),
      };

      return NextResponse.json(authResult);
    } else {
      // 로그인 실패
      return NextResponse.json(
        {
          success: false,
          error: '이메일 또는 패스워드가 일치하지 않습니다.',
        } as AuthResult,
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('로그인 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      } as AuthResult,
      { status: 500 }
    );
  }
}

// 임시 JWT 토큰 생성 함수 (나중에 실제 JWT 라이브러리로 교체)
function generateJWT(payload: { userId: string; email: string }): string {
  // 실제 구현에서는 jsonwebtoken 라이브러리 사용
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 86400000 })); // 24시간
  const signature = btoa('temporary-signature'); // 실제로는 서명 생성

  return `${header}.${body}.${signature}`;
}

// Supabase와 연동하는 실제 인증 함수 (참고용)
/*
async function authenticateWithSupabase(email: string, password: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
*/
