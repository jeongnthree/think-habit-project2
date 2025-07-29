import { NextRequest, NextResponse } from 'next/server';

// 임시 데이터 - 실제로는 데이터베이스에서 가져와야 함
const mockJournals = [
  {
    id: '1',
    title: '비판적 사고 훈련 일지 #1',
    content:
      '오늘은 비판적 사고에 대해 배웠습니다. 정보를 분석하고 평가하는 방법을 연습했습니다. 특히 신뢰할 수 있는 정보 출처를 식별하는 것이 중요하다는 것을 배웠습니다.\n\n또한 비판적 사고를 통해 문제를 해결하는 방법도 배웠습니다. 문제를 여러 관점에서 바라보고, 다양한 해결책을 고려하는 것이 중요합니다.\n\n앞으로도 비판적 사고 능력을 키우기 위해 꾸준히 연습하겠습니다.',
    created_at: '2025-07-20T10:00:00Z',
    updated_at: '2025-07-20T10:00:00Z',
    category_id: 'category1',
    student_id: 'user1',
    is_public: true,
    attachments: [],
    category: {
      id: 'category1',
      name: '비판적 사고',
      description: '비판적으로 사고하는 능력을 키우는 훈련',
    },
    author: {
      id: 'user1',
      full_name: '김철수',
    },
    comments: [
      {
        id: 'comment1',
        journal_id: '1',
        author_id: 'user2',
        content:
          '정말 좋은 내용이네요! 저도 비판적 사고에 대해 더 배우고 싶어요.',
        comment_type: 'comment',
        created_at: '2025-07-20T11:30:00Z',
        author: {
          id: 'user2',
          full_name: '이영희',
          role: 'student',
        },
      },
      {
        id: 'comment2',
        journal_id: '1',
        author_id: 'user3',
        content:
          '비판적 사고는 정말 중요한 능력이에요. 좋은 연습이 되었겠네요!',
        comment_type: 'encouragement',
        created_at: '2025-07-20T12:15:00Z',
        author: {
          id: 'user3',
          full_name: '박민수',
          role: 'student',
        },
      },
      {
        id: 'comment3',
        journal_id: '1',
        author_id: 'teacher1',
        content:
          '비판적 사고를 연습할 때는 다양한 관점에서 생각해보는 것이 중요합니다. 다음에는 특정 주제에 대해 여러 관점에서 분석해보는 연습을 해보세요.',
        comment_type: 'advice',
        created_at: '2025-07-20T14:00:00Z',
        author: {
          id: 'teacher1',
          full_name: '최선생',
          role: 'teacher',
        },
      },
    ],
    comment_count: 3,
    encouragement_count: 5,
    user_has_encouraged: false,
  },
  {
    id: '2',
    title: '창의적 사고 훈련 일지 #1',
    content:
      '오늘은 창의적 사고 기법에 대해 배웠습니다. 브레인스토밍과 마인드맵 작성 방법을 연습했습니다. 다양한 관점에서 문제를 바라보는 것이 중요하다는 것을 배웠습니다.\n\n특히 마인드맵을 그리는 것이 재미있었습니다. 하나의 주제에서 시작해 여러 갈래로 생각을 확장해 나가는 과정이 흥미로웠습니다.\n\n앞으로도 창의적 사고 능력을 키우기 위해 다양한 연습을 해보겠습니다.',
    created_at: '2025-07-19T14:30:00Z',
    updated_at: '2025-07-19T14:30:00Z',
    category_id: 'category2',
    student_id: 'user2',
    is_public: true,
    attachments: ['mindmap.jpg'],
    category: {
      id: 'category2',
      name: '창의적 사고',
      description: '창의적으로 사고하는 능력을 키우는 훈련',
    },
    author: {
      id: 'user2',
      full_name: '이영희',
    },
    comments: [
      {
        id: 'comment4',
        journal_id: '2',
        author_id: 'user1',
        content: '마인드맵 작성법이 궁금해요. 어떻게 시작하셨나요?',
        comment_type: 'question',
        created_at: '2025-07-19T15:45:00Z',
        author: {
          id: 'user1',
          full_name: '김철수',
          role: 'student',
        },
      },
      {
        id: 'comment5',
        journal_id: '2',
        author_id: 'teacher1',
        content:
          '창의적 사고 연습을 위해 SCAMPER 기법도 추천드립니다. 다음에 한번 시도해보세요!',
        comment_type: 'advice',
        created_at: '2025-07-19T16:30:00Z',
        author: {
          id: 'teacher1',
          full_name: '최선생',
          role: 'teacher',
        },
      },
    ],
    comment_count: 2,
    encouragement_count: 7,
    user_has_encouraged: true,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const journalId = params.id;
    const journal = mockJournals.find(j => j.id === journalId);

    if (!journal) {
      return NextResponse.json(
        { success: false, error: 'Journal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: journal,
    });
  } catch (error) {
    console.error('Error fetching journal details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch journal details' },
      { status: 500 }
    );
  }
}
