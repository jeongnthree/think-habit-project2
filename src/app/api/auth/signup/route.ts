import { NextRequest, NextResponse } from 'next/server';

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  membershipType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: SignupData = await request.json();
    const { email, password, name, phone, membershipType } = data;

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 중복 이메일 체크 (간단한 예시)
    if (email === 'test@think-habit.com') {
      return NextResponse.json(
        { success: false, error: '이미 가입된 이메일입니다.' },
        { status: 409 }
      );
    }

    // 임시로 성공 응답 (실제로는 데이터베이스에 저장)
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      phone: phone || '',
      membershipType: membershipType || 'individual',
      provider: 'email',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 임시 토큰 생성
    const token = `signup-token-${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: newUser,
      token,
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
