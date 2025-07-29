import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id;

    // 실제로는 데이터베이스에서 삭제해야 함
    // 여기서는 임시 응답 반환
    return NextResponse.json({
      success: true,
      message: `Comment ${commentId} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
