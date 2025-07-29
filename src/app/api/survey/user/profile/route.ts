import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 프로필 업데이트 검증 스키마
const ProfileUpdateSchema = z.object({
  display_name: z
    .string()
    .min(1, '이름은 필수입니다.')
    .max(50, '이름은 50자 이하여야 합니다.')
    .optional(),
  bio: z.string().max(500, '자기소개는 500자 이하여야 합니다.').optional(),
  phone: z
    .string()
    .regex(/^[0-9-]+$/, '올바른 전화번호 형식이 아닙니다.')
    .optional(),
  birth_date: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  location: z
    .object({
      city: z.string().optional(),
      district: z.string().optional(),
      country: z.string().default('KR'),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      language: z.enum(['ko', 'en']).default('ko'),
      notification: z
        .object({
          email: z.boolean().default(true),
          push: z.boolean().default(true),
          sms: z.boolean().default(false),
          marketing: z.boolean().default(false),
        })
        .optional(),
      privacy: z
        .object({
          showProfile: z.boolean().default(true),
          showStats: z.boolean().default(false),
          allowContact: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),
  emergency_contact: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  medical_info: z
    .object({
      medications: z.array(z.string()).optional(),
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),
});

// 쿼리 파라미터 검증 스키마
const QueryParamsSchema = z.object({
  include: z.string().optional(),
  format: z.enum(['basic', 'detailed', 'full']).optional().default('basic'),
});

// 민감한 정보 필터링 함수
function sanitizeProfileData(
  profileData: any,
  userRole: number,
  isOwner: boolean
): any {
  const baseProfile = {
    id: profileData.id,
    display_name: profileData.display_name,
    bio: profileData.bio,
    created_at: profileData.created_at,
    updated_at: profileData.updated_at,
    role: profileData.role,
  };

  // 기본 정보만 포함
  if (!isOwner && userRole < 2) {
    return baseProfile;
  }

  // 소유자이거나 전문가 이상인 경우 더 많은 정보 포함
  const extendedProfile = {
    ...baseProfile,
    email: profileData.email,
    phone: profileData.phone,
    birth_date: profileData.birth_date,
    gender: profileData.gender,
    location: profileData.profile?.location,
    preferences: profileData.profile?.preferences,
    stats: {
      surveysCompleted: profileData.profile?.surveysCompleted || 0,
      lastLoginAt: profileData.last_sign_in_at,
      joinedAt: profileData.created_at,
    },
  };

  // 소유자만 민감한 정보 접근 가능
  if (isOwner) {
    return {
      ...extendedProfile,
      emergency_contact: profileData.profile?.emergency_contact,
      medical_info: profileData.profile?.medical_info,
      email_verified: profileData.email_confirmed_at ? true : false,
      phone_verified: profileData.phone_confirmed_at ? true : false,
    };
  }

  // 전문가는 의료 정보만 접근 가능
  if (userRole >= 2) {
    return {
      ...extendedProfile,
      medical_info: profileData.profile?.medical_info,
    };
  }

  return extendedProfile;
}

// 프로필 통계 계산 함수
async function calculateProfileStats(supabase: any, userId: string) {
  try {
    // 설문조사 완료 수
    const { count: surveyCount } = await supabase
      .from('surveys')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // 훈련 기록 수
    const { count: trainingCount } = await supabase
      .from('training_records')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // 커뮤니티 게시글 수
    const { count: postCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact' })
      .eq('author_id', userId);

    // 최근 활동일
    const { data: recentActivity } = await supabase
      .from('training_records')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      surveysCompleted: surveyCount || 0,
      trainingsCompleted: trainingCount || 0,
      postsCreated: postCount || 0,
      lastActivityAt: recentActivity?.[0]?.created_at || null,
      memberSince: null, // 사용자 생성일은 별도로 처리
    };
  } catch (error) {
    console.warn('프로필 통계 계산 오류:', error);
    return {
      surveysCompleted: 0,
      trainingsCompleted: 0,
      postsCreated: 0,
      lastActivityAt: null,
      memberSince: null,
    };
  }
}

// GET: 사용자 프로필 조회
export async function GET(request: NextRequest) {
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

    const currentUserId = session.user.id;

    // 쿼리 파라미터 검증
    const { searchParams } = new URL(request.url);
    const queryParams = QueryParamsSchema.parse({
      include: searchParams.get('include'),
      format: searchParams.get('format'),
    });

    // 조회할 사용자 ID (기본값은 현재 사용자)
    const targetUserId = searchParams.get('userId') || currentUserId;
    const isOwner = targetUserId === currentUserId;

    // 현재 사용자 권한 확인
    const { data: currentUserData } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUserId)
      .single();

    const currentUserRole = currentUserData?.role || 1;

    // 권한 확인: 다른 사용자 프로필 접근 시
    if (!isOwner && currentUserRole < 2) {
      return NextResponse.json(
        { error: '다른 사용자의 프로필에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 사용자 프로필 데이터 조회
    const { data: profileData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (fetchError || !profileData) {
      console.error('프로필 조회 오류:', fetchError);
      return NextResponse.json(
        { error: '사용자 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 통계 정보 계산 (요청된 경우)
    let stats = null;
    if (
      queryParams.include?.includes('stats') ||
      queryParams.format === 'full'
    ) {
      stats = await calculateProfileStats(supabase, targetUserId);
      stats.memberSince = profileData.created_at;
    }

    // 프로필 데이터 정리 및 민감한 정보 필터링
    const sanitizedProfile = sanitizeProfileData(
      profileData,
      currentUserRole,
      isOwner
    );

    // 통계 정보 추가
    if (stats) {
      sanitizedProfile.stats = stats;
    }

    // 접근 로그 기록 (다른 사용자 프로필 조회 시)
    if (!isOwner && currentUserRole >= 2) {
      try {
        await supabase.from('access_logs').insert([
          {
            accessor_id: currentUserId,
            accessed_user_id: targetUserId,
            resource_type: 'profile',
            resource_id: targetUserId,
            action: 'view',
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (logError: unknown) {
        console.warn('접근 로그 기록 실패:', logError);
      }
    }

    return NextResponse.json({
      success: true,
      data: sanitizedProfile,
    });
  } catch (error: unknown) {
    console.error('프로필 조회 API 오류:', error);

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

// PUT: 사용자 프로필 업데이트
export async function PUT(request: NextRequest) {
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
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validatedData = ProfileUpdateSchema.parse(body);

    // 기존 프로필 데이터 조회
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('profile')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('기존 프로필 조회 오류:', fetchError);
      return NextResponse.json(
        { error: '프로필 정보를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 기존 프로필과 새 데이터 병합
    const currentProfile = existingProfile?.profile || {};
    const updatedProfile = {
      ...currentProfile,
      ...validatedData,
      // 중첩 객체는 개별적으로 병합
      location: {
        ...currentProfile.location,
        ...validatedData.location,
      },
      preferences: {
        ...currentProfile.preferences,
        ...validatedData.preferences,
        notification: {
          ...currentProfile.preferences?.notification,
          ...validatedData.preferences?.notification,
        },
        privacy: {
          ...currentProfile.preferences?.privacy,
          ...validatedData.preferences?.privacy,
        },
      },
      emergency_contact: {
        ...currentProfile.emergency_contact,
        ...validatedData.emergency_contact,
      },
      medical_info: {
        ...currentProfile.medical_info,
        ...validatedData.medical_info,
      },
      updatedAt: new Date().toISOString(),
    };

    // 프로필 업데이트 실행
    const updateData: any = {
      profile: updatedProfile,
      updated_at: new Date().toISOString(),
    };

    // 직접 컬럼 업데이트 (display_name 등)
    if (validatedData.display_name !== undefined) {
      updateData.display_name = validatedData.display_name;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('프로필 업데이트 오류:', updateError);
      return NextResponse.json(
        { error: '프로필 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 민감한 정보 제거 후 응답
    const responseData = sanitizeProfileData(updatedUser, 1, true);

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      data: responseData,
    });
  } catch (error: unknown) {
    console.error('프로필 업데이트 API 오류:', error);

    // Zod 검증 오류 처리
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다.',
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

// DELETE: 계정 비활성화 (완전 삭제는 별도 프로세스)
export async function DELETE(request: NextRequest) {
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

    const userId = session.user.id;

    // 계정 비활성화 (status를 'inactive'로 변경)
    const { error: deactivateError } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (deactivateError) {
      console.error('계정 비활성화 오류:', deactivateError);
      return NextResponse.json(
        { error: '계정 비활성화 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 세션 종료
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: '계정이 비활성화되었습니다. 30일 내에 재활성화할 수 있습니다.',
    });
  } catch (error: unknown) {
    console.error('계정 비활성화 API 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
