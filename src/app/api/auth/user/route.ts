import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 실제로는 인증 시스템에서 현재 사용자 정보를 가져와야 함
    // 여기서는 임시 사용자 정보 반환
    const currentUser = {
      id: 'current-user-id',
      email: 'user@example.com',
      name: '현재 사용자',
      role: 'student',
    };

    return NextResponse.json({
      success: true,
      user: currentUser,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
