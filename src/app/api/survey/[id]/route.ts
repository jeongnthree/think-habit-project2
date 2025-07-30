import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// URL 파라미터 검증 스키마
const ParamsSchema = z.object({
  id: z.string().uuid('올바른 설문조사 ID가 아닙니다.'),
});

// 쿼리 파라미터 검증 스키마
const QueryParamsSchema = z.object({
  includeAnswers: z
    .enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),
  includeMetadata: z
    .enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),
  format: z
    .enum(['summary', 'detailed', 'analysis'])
    .optional()
    .default('summary'),
});

// 생각습관 영역명 매핑
const THINKING_HABITS_LABELS = {
  black_white_thinking: '흑백사고',
  overgeneralization: '과잉일반화',
  mental_filter: '정신적 여과',
  disqualifying_positive: '긍정 할인',
  jumping_to_conclusions: '결론 도약',
  magnification_minimization: '확대/축소',
  emotional_reasoning: '감정적 추론',
  should_statements: '당위적 사고',
} as const;

// 점수 해석 함수
function interpretScore(score: number): {
  level: string;
  description: string;
  color: string;
} {
  if (score >= 8) {
    return {
      level: '높음',
      description:
        '이 영역에서 어려움을 많이 경험하고 있습니다. 전문가 상담을 권장합니다.',
      color: 'red',
    };
  } else if (score >= 6) {
    return {
      level: '보통',
      description:
        '이 영역에서 가끔 어려움을 경험합니다. 관심을 가지고 개선해나가세요.',
      color: 'yellow',
    };
  } else if (score >= 4) {
    return {
      level: '낮음',
      description: '이 영역에서는 비교적 건강한 생각습관을 가지고 있습니다.',
      color: 'green',
    };
  } else {
    return {
      level: '매우 낮음',
      description: '이 영역에서 매우 건강한 생각습관을 가지고 있습니다.',
      color: 'blue',
    };
  }
}

// 전체 점수 분석 함수
function analyzeOverallScore(
  overallScore: number,
  individualScores: Record<string, number>
) {
  const analysis = {
    overallLevel: interpretScore(overallScore),
    topConcerns: [] as Array<{ area: string; score: number; label: string }>,
    strengths: [] as Array<{ area: string; score: number; label: string }>,
    recommendations: [] as string[],
  };

  // 상위 3개 문제 영역과 하위 2개 강점 영역 식별
  const sortedScores = Object.entries(individualScores)
    .map(([area, score]) => ({
      area,
      score,
      label:
        THINKING_HABITS_LABELS[area as keyof typeof THINKING_HABITS_LABELS],
    }))
    .sort((a, b) => b.score - a.score);

  analysis.topConcerns = sortedScores.slice(0, 3);
  analysis.strengths = sortedScores.slice(-2);

  // 개인화된 권장사항 생성
  if (overallScore >= 7) {
    analysis.recommendations.push(
      '전문가와의 상담을 통해 체계적인 인지치료를 받으시기를 권장합니다.'
    );
    const topConcern = analysis.topConcerns?.[0];
    if (topConcern) {
      analysis.recommendations.push(
        '특히 ' + topConcern.label + ' 영역에 집중적인 관심이 필요합니다.'
      );
    }
  } else if (overallScore >= 5) {
    analysis.recommendations.push(
      '자가 훈련 프로그램을 통해 꾸준히 개선해나가세요.'
    );
    analysis.recommendations.push(
      '커뮤니티 활동을 통해 다른 사람들의 경험을 나누어보세요.'
    );
  } else {
    analysis.recommendations.push(
      '현재 건강한 생각습관을 잘 유지하고 계십니다.'
    );
    analysis.recommendations.push(
      '정기적인 자기 점검을 통해 현재 상태를 유지하세요.'
    );
  }

  return analysis;
}

// 응답 데이터 포맷팅
function formatSurveyResponse(
  survey: any,
  format: string,
  includeAnswers: boolean,
  includeMetadata: boolean
) {
  const baseResponse = {
    id: survey.id,
    title: survey.title,
    status: survey.status,
    completionRate: survey.completion_rate,
    createdAt: survey.created_at,
    updatedAt: survey.updated_at,
  };

  if (format === 'summary') {
    return {
      ...baseResponse,
      overallScore: survey.scores?.overallScore,
      totalQuestions: Object.keys(survey.responses || {}).length,
    };
  }

  if (format === 'detailed') {
    const detailedResponse: any = {
      ...baseResponse,
      scores: survey.scores,
      individualScores: Object.entries(
        survey.scores?.individualScores || {}
      ).map(([area, score]) => ({
        area,
        label:
          THINKING_HABITS_LABELS[area as keyof typeof THINKING_HABITS_LABELS],
        score,
        interpretation: interpretScore(score as number),
      })),
    };

    if (includeAnswers) {
      detailedResponse.responses = survey.responses;
    }

    if (includeMetadata) {
      detailedResponse.metadata = survey.metadata;
    }

    return detailedResponse;
  }

  if (format === 'analysis') {
    const analysis = analyzeOverallScore(
      survey.scores?.overallScore || 0,
      survey.scores?.individualScores || {}
    );

    const analysisResponse: any = {
      ...baseResponse,
      scores: survey.scores,
      analysis,
      individualScores: Object.entries(
        survey.scores?.individualScores || {}
      ).map(([area, score]) => ({
        area,
        label:
          THINKING_HABITS_LABELS[area as keyof typeof THINKING_HABITS_LABELS],
        score,
        interpretation: interpretScore(score as number),
      })),
    };

    if (includeAnswers) {
      analysisResponse.responses = survey.responses;
    }

    if (includeMetadata) {
      analysisResponse.metadata = survey.metadata;
    }

    return analysisResponse;
  }

  return baseResponse;
}

// GET: 특정 설문조사 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 사용자 인증 확인
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다. 로그인 후 다시 시도해주세요.' },
        { status: 401 }
      );
    }

    // URL 파라미터 검증
    const validatedParams = ParamsSchema.parse(params);
    const surveyId = validatedParams.id;
    const userId = session.user.id;

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url);
    const queryParams = QueryParamsSchema.parse({
      includeAnswers: searchParams.get('includeAnswers'),
      includeMetadata: searchParams.get('includeMetadata'),
      format: searchParams.get('format'),
    });

    // 사용자 정보 조회 (권한 확인용)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // 사용자 정보가 없는 경우 기본 권한으로 처리
    const userRole = userData && !userError ? (userData.role ?? 1) : 1;

    // 설문조사 데이터 조회
    let query = supabase.from('surveys').select('*');

    // 권한에 따른 접근 제어
    if (userRole === 1) {
      // 일반 사용자: 본인 데이터만 조회
      query = query.eq('user_id', userId);
    } else if (userRole >= 2) {
      // 전문가(2), 트레이너(3), 관리자(4): 특별한 제한 없음
      // 하지만 다른 사용자 데이터 조회 시 로그 기록
      if (
        searchParams.get('user_id') &&
        searchParams.get('user_id') !== userId
      ) {
        console.log(
          `전문가(${userId})가 사용자(${searchParams.get('user_id')}) 데이터 조회`
        );
        query = query.eq('user_id', searchParams.get('user_id'));
      } else {
        query = query.eq('user_id', userId);
      }
    }

    const { data: survey, error: fetchError } = await query
      .eq('id', surveyId)
      .single();

    if (fetchError) {
      console.error('설문조사 조회 오류:', fetchError);

      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '요청하신 설문조사를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: '설문조사 데이터를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 권한 재확인 (본인 데이터가 아닌 경우)
    if (survey.user_id !== userId && userRole === 1) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 응답 데이터 포맷팅
    const formattedResponse = formatSurveyResponse(
      survey,
      queryParams.format,
      queryParams.includeAnswers,
      queryParams.includeMetadata
    );

    // 조회 로그 기록 (선택사항)
    if (userRole >= 2 && survey.user_id !== userId) {
      // 전문가가 환자 데이터를 조회하는 경우 로그 기록
      try {
        await supabase.from('access_logs').insert([
          {
            accessor_id: userId,
            accessed_user_id: survey.user_id,
            resource_type: 'survey',
            resource_id: surveyId,
            action: 'view',
            timestamp: new Date().toISOString(),
          },
        ]);
        console.log('접근 로그 기록 완료');
      } catch (logError: unknown) {
        console.warn('접근 로그 기록 실패:', logError);
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedResponse,
    });
  } catch (error: unknown) {
    console.error('설문조사 조회 API 오류:', error);

    // Zod 검증 오류 처리
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '요청 파라미터가 올바르지 않습니다.',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 설문조사 삭제 (관리자 및 본인만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 사용자 인증 확인
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // URL 파라미터 검증
    const validatedParams = ParamsSchema.parse(params);
    const surveyId = validatedParams.id;
    const userId = session.user.id;

    // 사용자 권한 확인
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // 사용자 정보가 없는 경우 기본 권한으로 처리
    const userRole = userData && !userDataError ? (userData.role ?? 1) : 1;

    // 설문조사 소유자 확인
    const { data: survey } = await supabase
      .from('surveys')
      .select('user_id')
      .eq('id', surveyId)
      .single();

    if (!survey) {
      return NextResponse.json(
        { error: '설문조사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인: 본인 또는 관리자만 삭제 가능
    if (survey.user_id !== userId && userRole < 4) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 설문조사 삭제
    const { error: deleteError } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (deleteError) {
      console.error('설문조사 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '설문조사 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '설문조사가 성공적으로 삭제되었습니다.',
    });
  } catch (error: unknown) {
    console.error('설문조사 삭제 API 오류:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '요청 파라미터가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
