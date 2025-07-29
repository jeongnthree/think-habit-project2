import { NextRequest, NextResponse } from 'next/server';

// 임시 데이터 저장소
const encouragements = new Map<string, Set<string>>();

export async function POST(request: NextRequest) {
  try {
    const { journal_id } = await request.json();

    if (!journal_id) {
      return NextResponse.json(
        { success: false, error: 'Journal ID is required' },
        { status: 400 }
      );
    }

    // 현재 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
    const currentUserId = 'current-user-id';

    // 해당 일지에 대한 격려 목록 가져오기
    if (!encouragements.has(journal_id)) {
      encouragements.set(journal_id, new Set());
    }

    const journalEncouragements = encouragements.get(journal_id)!;
    const isEncouraged = journalEncouragements.has(currentUserId);

    // 토글: 이미 격려했으면 취소, 아니면 추가
    if (isEncouraged) {
      journalEncouragements.delete(currentUserId);
    } else {
      journalEncouragements.add(currentUserId);
    }

    return NextResponse.json({
      success: true,
      data: {
        journal_id,
        encouragement_count: journalEncouragements.size,
        is_encouraged: !isEncouraged,
      },
    });
  } catch (error) {
    console.error('Error toggling encouragement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle encouragement' },
      { status: 500 }
    );
  }
}
