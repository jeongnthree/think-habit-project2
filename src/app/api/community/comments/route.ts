import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { journal_id, content, comment_type } = await request.json();

    // 입력 검증
    if (!journal_id || !content || !comment_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 실제로는 데이터베이스에 저장해야 함
    // 여기서는 임시 응답 반환
    const newComment = {
      id: `comment-${Date.now()}`,
      journal_id,
      author_id: 'current-user-id', // 실제로는 인증된 사용자 ID
      content,
      comment_type,
      created_at: new Date().toISOString(),
      author: {
        id: 'current-user-id',
        full_name: '현재 사용자', // 실제로는 인증된 사용자 이름
        role: 'student',
      },
    };

    return NextResponse.json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
