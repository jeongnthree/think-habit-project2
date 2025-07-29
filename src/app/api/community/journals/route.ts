import { NextRequest, NextResponse } from 'next/server';

// 개발 모드에서 저장된 일지들을 저장할 임시 저장소
let developmentJournals: any[] = [];

// 임시 데이터 - 실제로는 데이터베이스에서 가져와야 함
// 동기화된 일지들도 포함
const mockJournals = [
  // 기존 웹 일지들
  {
    id: 'web-1',
    title: '웹에서 작성한 비판적 사고 훈련 일지',
    content:
      '웹 인터페이스를 통해 작성한 일지입니다. 오늘은 비판적 사고에 대해 배웠습니다.',
    created_at: '2025-07-20T10:00:00Z',
    updated_at: '2025-07-20T10:00:00Z',
    category_id: 'category1',
    student_id: 'user1',
    is_public: true,
    sync_source: 'web',
    category: { id: 'category1', name: '비판적 사고' },
    author: { id: 'user1', full_name: '김철수' },
    comment_count: 3,
    encouragement_count: 5,
    user_has_encouraged: false,
  },
  // 데스크톱 앱에서 동기화된 일지들
  {
    id: 'desktop-sync-1',
    title: '[데스크톱] 완벽주의 극복 훈련 일지',
    content:
      'Think-Habit Journal 데스크톱 앱에서 작성한 일지입니다. 완벽주의 성향을 극복하기 위한 훈련을 진행했습니다. 실수를 받아들이고 "충분히 좋다"는 기준을 설정하는 연습을 했습니다.',
    created_at: '2025-07-21T14:30:00Z',
    updated_at: '2025-07-21T14:30:00Z',
    category_id: 'category4',
    student_id: 'user2',
    is_public: true,
    sync_source: 'desktop_app',
    app_version: '1.0.0',
    category: { id: 'category4', name: '완벽주의 극복' },
    author: { id: 'user2', full_name: '이영희' },
    comment_count: 2,
    encouragement_count: 8,
    user_has_encouraged: false,
  },
  {
    id: 'desktop-sync-2',
    title: '[데스크톱] 흑백논리 개선 훈련',
    content:
      '데스크톱 앱에서 작성했습니다. 모든 것을 극단적으로 판단하는 흑백논리를 개선하는 훈련을 했습니다. 회색 영역을 인정하고 중간 지점을 찾는 연습을 진행했습니다.',
    created_at: '2025-07-21T09:15:00Z',
    updated_at: '2025-07-21T09:15:00Z',
    category_id: 'category5',
    student_id: 'user3',
    is_public: true,
    sync_source: 'desktop_app',
    app_version: '1.0.0',
    category: { id: 'category5', name: '흑백논리 개선' },
    author: { id: 'user3', full_name: '박민수' },
    comment_count: 1,
    encouragement_count: 6,
    user_has_encouraged: true,
  },
  // 모바일 앱에서 동기화된 일지들
  {
    id: 'mobile-sync-1',
    title: '[모바일] 감정적 추론 극복 일지',
    content:
      '모바일 앱에서 작성한 일지입니다. 감정을 사실로 받아들이는 감정적 추론을 극복하는 훈련을 했습니다. 감정과 사실을 분리해서 생각하는 연습을 진행했습니다.',
    created_at: '2025-07-20T16:45:00Z',
    updated_at: '2025-07-20T16:45:00Z',
    category_id: 'category6',
    student_id: 'user4',
    is_public: true,
    sync_source: 'mobile_app',
    app_version: '1.0.0',
    category: { id: 'category6', name: '감정적 추론 극복' },
    author: { id: 'user4', full_name: '정수진' },
    comment_count: 4,
    encouragement_count: 7,
    user_has_encouraged: false,
  },
  {
    id: '1',
    title: '비판적 사고 훈련 일지 #1',
    content:
      '오늘은 비판적 사고에 대해 배웠습니다. 정보를 분석하고 평가하는 방법을 연습했습니다. 특히 신뢰할 수 있는 정보 출처를 식별하는 것이 중요하다는 것을 배웠습니다.',
    created_at: '2025-07-20T10:00:00Z',
    updated_at: '2025-07-20T10:00:00Z',
    category_id: 'category1',
    student_id: 'user1',
    is_public: true,
    category: {
      id: 'category1',
      name: '비판적 사고',
    },
    author: {
      id: 'user1',
      full_name: '김철수',
    },
    comment_count: 3,
    encouragement_count: 5,
    user_has_encouraged: false,
  },
  {
    id: '2',
    title: '창의적 사고 훈련 일지 #1',
    content:
      '오늘은 창의적 사고 기법에 대해 배웠습니다. 브레인스토밍과 마인드맵 작성 방법을 연습했습니다. 다양한 관점에서 문제를 바라보는 것이 중요하다는 것을 배웠습니다.',
    created_at: '2025-07-19T14:30:00Z',
    updated_at: '2025-07-19T14:30:00Z',
    category_id: 'category2',
    student_id: 'user2',
    is_public: true,
    category: {
      id: 'category2',
      name: '창의적 사고',
    },
    author: {
      id: 'user2',
      full_name: '이영희',
    },
    comment_count: 2,
    encouragement_count: 7,
    user_has_encouraged: true,
  },
  {
    id: '3',
    title: '감정 조절 훈련 일지 #1',
    content:
      '오늘은 감정 조절 기법에 대해 배웠습니다. 명상과 호흡 기법을 연습했습니다. 감정을 인식하고 표현하는 것이 중요하다는 것을 배웠습니다.',
    created_at: '2025-07-18T09:15:00Z',
    updated_at: '2025-07-18T09:15:00Z',
    category_id: 'category3',
    student_id: 'user3',
    is_public: true,
    category: {
      id: 'category3',
      name: '감정 조절',
    },
    author: {
      id: 'user3',
      full_name: '박민수',
    },
    comment_count: 1,
    encouragement_count: 3,
    user_has_encouraged: false,
  },
  {
    id: '4',
    title: '비판적 사고 훈련 일지 #2',
    content:
      '오늘은 논리적 오류를 식별하는 방법에 대해 배웠습니다. 다양한 논리적 오류의 유형과 이를 식별하는 방법을 연습했습니다.',
    created_at: '2025-07-17T16:45:00Z',
    updated_at: '2025-07-17T16:45:00Z',
    category_id: 'category1',
    student_id: 'user1',
    is_public: true,
    category: {
      id: 'category1',
      name: '비판적 사고',
    },
    author: {
      id: 'user1',
      full_name: '김철수',
    },
    comment_count: 0,
    encouragement_count: 2,
    user_has_encouraged: false,
  },
  {
    id: '5',
    title: '창의적 사고 훈련 일지 #2',
    content:
      '오늘은 창의적 문제 해결 기법에 대해 배웠습니다. SCAMPER 기법을 활용하여 새로운 아이디어를 생성하는 방법을 연습했습니다.',
    created_at: '2025-07-16T11:20:00Z',
    updated_at: '2025-07-16T11:20:00Z',
    category_id: 'category2',
    student_id: 'user2',
    is_public: true,
    category: {
      id: 'category2',
      name: '창의적 사고',
    },
    author: {
      id: 'user2',
      full_name: '이영희',
    },
    comment_count: 4,
    encouragement_count: 6,
    user_has_encouraged: false,
  },
];

export async function GET(request: NextRequest) {
  try {
    // Supabase 클라이언트 import 추가 필요
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // 실제 데이터베이스에서 공개 일지 가져오기
    // 1. journals 테이블에서 웹 일지 가져오기
    let webJournalsQuery = supabase
      .from('journals')
      .select(
        `
        id,
        title,
        content,
        created_at,
        updated_at,
        category_id,
        student_id,
        is_public,
        attachments
      `
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // 2. training_journals 테이블에서 앱 동기화 일지 가져오기
    let appJournalsQuery = supabase
      .from('training_journals')
      .select(
        `
        id,
        title,
        content,
        created_at,
        updated_at,
        category_id,
        user_id,
        is_public,
        sync_source,
        app_version,
        image_urls,
        image_count
      `
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // 카테고리 필터링
    if (categoryId && categoryId !== 'all') {
      webJournalsQuery = webJournalsQuery.eq('category_id', categoryId);
      appJournalsQuery = appJournalsQuery.eq('category_id', categoryId);
    }

    console.log('🔍 커뮤니티 일지 조회 시작', {
      categoryId,
      page,
      limit,
    });

    // 두 테이블에서 데이터 가져오기
    const [webResult, appResult] = await Promise.all([
      webJournalsQuery,
      appJournalsQuery,
    ]);

    const webJournals = webResult.data || [];
    const appJournals = appResult.data || [];

    // 디버깅 로그 추가
    console.log('🔍 커뮤니티 API 디버깅:');
    console.log('웹 일지 개수:', webJournals.length);
    console.log('앱 일지 개수:', appJournals.length);
    console.log('웹 일지 에러:', webResult.error);
    console.log('앱 일지 에러:', appResult.error);
    
    // 앱 일지 상세 로그
    if (appJournals.length > 0) {
      console.log('📱 동기화된 앱 일지 목록:');
      appJournals.forEach((journal, idx) => {
        console.log(`  ${idx + 1}. ${journal.title} (${journal.sync_source || 'unknown'})`, {
          id: journal.id,
          created_at: journal.created_at,
          is_public: journal.is_public,
        });
      });
    }

    // 에러 처리
    if (webResult.error || appResult.error) {
      console.error('Database errors:', {
        web: webResult.error,
        app: appResult.error,
      });

      // 에러가 있어도 성공한 쪽 데이터는 사용
      console.log('Using available data despite errors');
    }

    // 웹 일지 데이터 변환
    const transformedWebJournals = webJournals.map(journal => ({
      id: journal.id,
      title: journal.title,
      content: journal.content,
      created_at: journal.created_at,
      updated_at: journal.updated_at,
      category_id: journal.category_id,
      student_id: journal.student_id,
      is_public: journal.is_public,
      sync_source: 'web',
      attachments: journal.attachments || [],
      category: {
        id: journal.category_id,
        name: '일반',
      },
      author: {
        id: journal.student_id,
        full_name: '웹 사용자',
      },
      comment_count: 0,
      encouragement_count: 0,
      user_has_encouraged: false,
    }));

    // 앱 동기화 일지 데이터 변환
    const transformedAppJournals = appJournals.map(journal => ({
      id: journal.id,
      title: journal.title,
      content: journal.content,
      created_at: journal.created_at,
      updated_at: journal.updated_at,
      category_id: journal.category_id,
      student_id: journal.user_id, // training_journals는 user_id 사용
      is_public: journal.is_public,
      sync_source: journal.sync_source || 'desktop_app',
      app_version: journal.app_version,
      attachments: journal.image_urls || [],
      image_count: journal.image_count || 0,
      category: {
        id: journal.category_id,
        name: '일반',
      },
      author: {
        id: journal.user_id,
        full_name: 'Journal App 사용자',
      },
      comment_count: 0,
      encouragement_count: 0,
      user_has_encouraged: false,
    }));

    // 모든 일지 합치기
    const allTransformedJournals = [
      ...transformedWebJournals,
      ...transformedAppJournals,
    ];

    // 실제 데이터, 개발 모드 일지, Mock 데이터 합치기
    const combinedJournals = [
      ...allTransformedJournals,
      ...developmentJournals,
      ...mockJournals,
    ];

    // 카테고리 필터링 (합친 데이터에 대해)
    let filteredJournals = combinedJournals;
    if (categoryId && categoryId !== 'all') {
      filteredJournals = filteredJournals.filter(
        journal => journal.category_id === categoryId
      );
    }

    // 날짜순 정렬
    filteredJournals.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 페이지네이션 (합친 데이터에 대해)
    const finalStartIndex = (page - 1) * limit;
    const finalEndIndex = finalStartIndex + limit;
    const paginatedJournals = filteredJournals.slice(
      finalStartIndex,
      finalEndIndex
    );

    const pagination = {
      total: filteredJournals.length,
      page,
      limit,
      totalPages: Math.ceil(filteredJournals.length / limit),
    };

    return NextResponse.json({
      success: true,
      data: paginatedJournals,
      pagination,
    });
  } catch (error) {
    console.error('Error fetching public journals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch journals' },
      { status: 500 }
    );
  }
}

// POST 메서드 - 개발 모드에서 일지 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 개발 모드에서만 허용
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, error: 'Not allowed in production' },
        { status: 403 }
      );
    }

    // 개발 모드 일지 추가
    const newJournal = {
      id: body.id || `dev-${Date.now()}`,
      title: body.title,
      content: body.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_id: body.category_id,
      student_id: body.student_id,
      is_public: body.is_public || false,
      sync_source: 'web',
      category: {
        id: body.category_id,
        name: body.category_name || '일반',
      },
      author: {
        id: body.student_id,
        full_name: body.author_name || '개발 사용자',
      },
      comment_count: 0,
      encouragement_count: 0,
      user_has_encouraged: false,
    };

    developmentJournals.unshift(newJournal); // 최신 순으로 추가

    return NextResponse.json({
      success: true,
      data: newJournal,
      message: '개발 모드 일지가 추가되었습니다.',
    });
  } catch (error) {
    console.error('Error adding development journal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add journal' },
      { status: 500 }
    );
  }
}
