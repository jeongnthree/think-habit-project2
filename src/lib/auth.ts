import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

/**
 * 서버 사이드에서 현재 인증된 사용자 정보를 가져옵니다.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        id: user.id,
        email: user.email || '',
        role: 'student', // 기본값
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      role: profile.role || 'student',
      full_name: profile.full_name || undefined,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * 사용자가 특정 권한을 가지고 있는지 확인합니다.
 */
export function hasPermission(
  userRole: string,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * 관리자 권한을 확인합니다.
 */
export function isAdmin(userRole: string): boolean {
  return userRole === 'admin';
}

/**
 * 선생님 또는 관리자 권한을 확인합니다.
 */
export function isTeacherOrAdmin(userRole: string): boolean {
  return ['teacher', 'admin'].includes(userRole);
}

/**
 * 코치, 선생님 또는 관리자 권한을 확인합니다.
 */
export function isCoachOrAbove(userRole: string): boolean {
  return ['coach', 'teacher', 'admin'].includes(userRole);
}

/**
 * API 요청에서 인증된 사용자 정보를 추출합니다.
 */
export async function getAuthUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // 사용자 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        id: user.id,
        email: user.email || '',
        role: 'student', // 기본값
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      role: profile.role || 'student',
      full_name: profile.full_name || undefined,
    };
  } catch (error) {
    console.error('Error getting auth user from request:', error);
    return null;
  }
}

/**
 * 인증 에러 응답을 생성합니다.
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required'
) {
  return Response.json({ success: false, error: message }, { status: 401 });
}

/**
 * 권한 에러 응답을 생성합니다.
 */
export function createPermissionErrorResponse(
  message: string = 'Insufficient permissions'
) {
  return Response.json({ success: false, error: message }, { status: 403 });
}
