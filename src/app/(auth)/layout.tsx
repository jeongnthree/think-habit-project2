// app/(auth)/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "생각습관 - 로그인",
  description:
    "생각습관 플랫폼에 로그인하여 개인 맞춤 생각습관 훈련을 시작하세요.",
  keywords: ["로그인", "생각습관", "인증", "계정"],
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * 인증 관련 페이지들의 공통 레이아웃
 * 로그인, 회원가입, 비밀번호 재설정 등에 사용
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 배경 패턴 (선택사항) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10">{children}</div>

      {/* 푸터 */}
      <footer className="relative z-10 bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 생각습관. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a
                href="/privacy"
                className="hover:text-gray-700 transition-colors"
              >
                개인정보처리방침
              </a>
              <a
                href="/terms"
                className="hover:text-gray-700 transition-colors"
              >
                이용약관
              </a>
              <a
                href="/support"
                className="hover:text-gray-700 transition-colors"
              >
                고객지원
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
