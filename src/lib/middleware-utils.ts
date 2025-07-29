// middleware.ts (프로젝트 루트에 생성)
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 사용자 역할 타입
type UserRole = 1 | 2 | 3; // 1: 학습자, 2: 감독, 3: 관리자

// 프로필 타입 정의
interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  status: string;
  profile?: any;
}

// 라우트 보호 설정
interface RouteConfig {
  path: string;
  requiredRole?: UserRole;
  redirectTo?: string;
  description: string;
}

// 보호된 라우트 정의
const PROTECTED_ROUTES: RouteConfig[] = [
  // 인증 필요 라우트
  {
    path: "/dashboard",
    description: "사용자 대시보드 - 모든 인증 사용자",
  },
  {
    path: "/profile",
    description: "프로필 관리 - 모든 인증 사용자",
  },
  {
    path: "/surveys",
    description: "설문조사 - 모든 인증 사용자",
  },
  {
    path: "/training",
    description: "훈련 기록 - 모든 인증 사용자",
  },
  {
    path: "/community",
    description: "커뮤니티 - 모든 인증 사용자",
  },

  // 감독 이상 권한 필요
  {
    path: "/admin",
    requiredRole: 2,
    description: "관리 영역 - 감독/관리자",
  },
  {
    path: "/expert",
    requiredRole: 2,
    description: "전문가 영역 - 감독/관리자",
  },
  {
    path: "/diagnoses",
    requiredRole: 2,
    description: "진단 관리 - 감독/관리자",
  },
  {
    path: "/prescriptions",
    requiredRole: 2,
    description: "처방 관리 - 감독/관리자",
  },

  // 관리자 전용
  {
    path: "/admin/users",
    requiredRole: 3,
    redirectTo: "/admin",
    description: "사용자 관리 - 관리자 전용",
  },
  {
    path: "/admin/system",
    requiredRole: 3,
    redirectTo: "/admin",
    description: "시스템 관리 - 관리자 전용",
  },
  {
    path: "/admin/statistics",
    requiredRole: 3,
    redirectTo: "/admin",
    description: "통계 관리 - 관리자 전용",
  },
];

// 공개 라우트 (인증 불필요)
const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/auth/login",
  "/auth/signup",
  "/auth/reset-password",
  "/auth/callback",
  "/api/auth",
];

// API 라우트 보호 설정
const PROTECTED_API_ROUTES: RouteConfig[] = [
  {
    path: "/api/profile",
    description: "프로필 API - 인증 필요",
  },
  {
    path: "/api/surveys",
    description: "설문조사 API - 인증 필요",
  },
  {
    path: "/api/training",
    description: "훈련 기록 API - 인증 필요",
  },
  {
    path: "/api/admin",
    requiredRole: 2,
    description: "관리 API - 감독/관리자",
  },
  {
    path: "/api/diagnoses",
    requiredRole: 2,
    description: "진단 API - 감독/관리자",
  },
  {
    path: "/api/prescriptions",
    requiredRole: 2,
    description: "처방 API - 감독/관리자",
  },
];

/**
 * 경로가 보호된 라우트인지 확인
 */
function findProtectedRoute(pathname: string): RouteConfig | null {
  const allRoutes = [...PROTECTED_ROUTES, ...PROTECTED_API_ROUTES];

  // 정확한 매치 우선
  const exactMatch = allRoutes.find((route) => route.path === pathname);
  if (exactMatch) return exactMatch;

  // 경로 시작 매치 (하위 경로 포함)
  const pathMatch = allRoutes.find(
    (route) =>
      pathname.startsWith(route.path + "/") || pathname.startsWith(route.path),
  );

  return pathMatch || null;
}

/**
 * 공개 라우트인지 확인
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/**
 * 사용자 세션 및 프로필 조회
 */
async function getUserSession(request: NextRequest): Promise<{
  user: any | null;
  profile: UserProfile | null;
  response: NextResponse;
}> {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  try {
    // 세션 확인
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { user: null, profile: null, response };
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role, email, profile, status")
      .eq("auth_id", session.user.id)
      .single();

    if (profileError || !profile) {
      console.error("프로필 조회 실패:", profileError);
      return { user: session.user, profile: null, response };
    }

    return {
      user: session.user,
      profile: {
        id: profile.id,
        role: profile.role as UserRole,
        email: profile.email,
        status: profile.status,
        profile: profile.profile,
      },
      response,
    };
  } catch (error) {
    console.error("미들웨어 인증 확인 오류:", error);
    return { user: null, profile: null, response };
  }
}

/**
 * 로그인 페이지로 리다이렉트
 */
function redirectToLogin(request: NextRequest, reason?: string) {
  const loginUrl = new URL("/auth/login", request.url);

  // 로그인 후 돌아갈 URL 저장
  if (request.nextUrl.pathname !== "/auth/login") {
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
  }

  // 리다이렉트 이유 (선택사항)
  if (reason) {
    loginUrl.searchParams.set("reason", reason);
  }

  console.log(
    `🔒 인증 필요: ${request.nextUrl.pathname} → ${loginUrl.pathname}`,
  );
  return NextResponse.redirect(loginUrl);
}

/**
 * 권한 부족 페이지로 리다이렉트
 */
function redirectToUnauthorized(
  request: NextRequest,
  route: RouteConfig,
  userRole?: UserRole,
) {
  const fallbackUrl = route.redirectTo || "/dashboard";
  const redirectUrl = new URL(fallbackUrl, request.url);

  console.log(
    `⛔ 권한 부족: ${request.nextUrl.pathname} (필요: ${route.requiredRole}, 현재: ${userRole}) → ${fallbackUrl}`,
  );
  return NextResponse.redirect(redirectUrl);
}

/**
 * 메인 미들웨어 함수
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`🌐 미들웨어 실행: ${request.method} ${pathname}`);

  // 1. 공개 라우트는 통과
  if (isPublicRoute(pathname)) {
    console.log(`✅ 공개 라우트: ${pathname}`);
    return NextResponse.next();
  }

  // 2. 보호된 라우트 확인
  const protectedRoute = findProtectedRoute(pathname);
  if (!protectedRoute) {
    // 보호되지 않은 라우트는 통과
    console.log(`➡️  일반 라우트: ${pathname}`);
    return NextResponse.next();
  }

  // 3. 사용자 인증 상태 확인
  const { user, profile, response } = await getUserSession(request);

  // 4. 인증되지 않은 사용자 처리
  if (!user || !profile) {
    return redirectToLogin(request, "authentication_required");
  }

  // 5. 계정 상태 확인
  if (profile.status !== "active") {
    console.log(`🚫 비활성 계정: ${profile.email} (${profile.status})`);
    return redirectToLogin(request, "account_inactive");
  }

  // 6. 역할 기반 권한 확인
  if (
    protectedRoute.requiredRole &&
    profile.role < protectedRoute.requiredRole
  ) {
    return redirectToUnauthorized(request, protectedRoute, profile.role);
  }

  // 7. 권한 확인 완료 - 요청 통과
  console.log(
    `✅ 접근 허용: ${pathname} (사용자: ${profile.email}, 역할: ${profile.role})`,
  );

  // 사용자 정보를 헤더에 추가 (선택사항)
  response.headers.set("x-user-id", profile.id);
  response.headers.set("x-user-role", profile.role.toString());
  response.headers.set("x-user-email", profile.email);

  return response;
}

/**
 * 미들웨어가 실행될 경로 설정
 */
export const config = {
  matcher: [
    // 모든 페이지 라우트 (api, _next/static, _next/image, favicon.ico 제외)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // API 라우트 포함
    "/api/(.*)",
  ],
};
