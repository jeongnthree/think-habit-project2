// app/journal/list/page.tsx
// 일지 목록을 보여주는 메인 페이지

import { JournalList } from "@/components/journal/JournalList";
import { authOptions } from "@/lib/auth";
import {
  BookOpen,
  Calendar,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "내 일지 목록 | Think-Habit",
  description: "Think-Habit에서 작성한 모든 훈련 일지를 확인하고 관리하세요",
};

// 통계 카드 컴포넌트
const StatsCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}>
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      <div className="text-right">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm opacity-90">{title}</div>
      </div>
    </div>
    {subtitle && <div className="text-sm opacity-75">{subtitle}</div>}
  </div>
);

// 빠른 액션 카드
const QuickActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}> = ({ icon, title, description, href, color }) => (
  <Link
    href={href}
    className={`block p-6 bg-gradient-to-br ${color} rounded-xl text-white hover:scale-105 transition-transform duration-200`}
  >
    <div className="flex items-center gap-4">
      <div className="p-3 bg-white/20 rounded-lg">{icon}</div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </div>
  </Link>
);

// 로딩 스켈레톤
const LoadingSkeleton = () => (
  <div className="space-y-6">
    {/* 헤더 스켈레톤 */}
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
    </div>

    {/* 검색/필터 스켈레톤 */}
    <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />

    {/* 카드 그리드 스켈레톤 */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

// 메인 페이지 컴포넌트
export default async function JournalListPage() {
  // 사용자 인증 확인
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/journal/list");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 및 제목 */}
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Think-Habit</h1>
                <p className="text-sm text-gray-600">훈련 일지 관리</p>
              </div>
            </div>

            {/* 사용자 정보 */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                안녕하세요, {session.user.name}님!
              </span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {session.user.name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 대시보드 상단 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                📖 나의 훈련 일지
              </h2>
              <p className="text-gray-600">
                모든 훈련 기록을 한눈에 확인하고 성장을 추적해보세요
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/journal/stats"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                통계 보기
              </Link>
              <Link
                href="/journal/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />새 일지 작성
              </Link>
            </div>
          </div>

          {/* 통계 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={<BookOpen className="w-6 h-6" />}
              title="총 일지"
              value="42"
              subtitle="이번 달 +5개"
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              icon={<Target className="w-6 h-6" />}
              title="평균 완료율"
              value="87%"
              subtitle="지난 주 대비 +12%"
              color="from-green-500 to-green-600"
            />
            <StatsCard
              icon={<Calendar className="w-6 h-6" />}
              title="연속 기록"
              value="14일"
              subtitle="최고 기록 달성!"
              color="from-purple-500 to-purple-600"
            />
            <StatsCard
              icon={<Sparkles className="w-6 h-6" />}
              title="성취 점수"
              value="1,247"
              subtitle="상위 10% 유지 중"
              color="from-orange-500 to-orange-600"
            />
          </div>

          {/* 빠른 액션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <QuickActionCard
              icon={<Plus className="w-6 h-6" />}
              title="새 일지 작성"
              description="오늘의 훈련을 기록해보세요"
              href="/journal/new"
              color="from-blue-500 to-blue-600"
            />
            <QuickActionCard
              icon={<Search className="w-6 h-6" />}
              title="일지 검색"
              description="과거 기록을 빠르게 찾아보세요"
              href="/journal/search"
              color="from-purple-500 to-purple-600"
            />
            <QuickActionCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="성장 분석"
              description="데이터로 보는 나의 발전"
              href="/journal/analytics"
              color="from-green-500 to-green-600"
            />
          </div>
        </div>

        {/* 일지 목록 섹션 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Suspense fallback={<LoadingSkeleton />}>
            <JournalList showSearch={true} className="p-6" />
          </Suspense>
        </div>

        {/* 도움말 섹션 */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              💡 더 효과적인 일지 작성을 위한 팁
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    구체적인 목표 설정
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  "운동하기"보다는 "스쿼트 3세트 완료하기"처럼 구체적인 목표를
                  세워보세요.
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">꾸준한 기록</h4>
                </div>
                <p className="text-sm text-gray-600">
                  매일 조금씩이라도 기록하는 습관이 큰 변화를 만들어냅니다.
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">회고와 반성</h4>
                </div>
                <p className="text-sm text-gray-600">
                  일주일에 한 번씩 지난 기록들을 돌아보며 개선점을 찾아보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Think-Habit 소개 */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  Think-Habit
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                더 나은 자신을 만들어가는 여정을 함께하는 스마트한 훈련 일지
                플랫폼입니다. 매일의 작은 변화가 큰 성장으로 이어지도록
                도와드립니다.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>© 2024 Think-Habit</span>
                <span>•</span>
                <span>Version 3.0</span>
              </div>
            </div>

            {/* 빠른 링크 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">빠른 링크</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/journal/new"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    새 일지 작성
                  </Link>
                </li>
                <li>
                  <Link
                    href="/journal/list"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    일지 목록
                  </Link>
                </li>
                <li>
                  <Link
                    href="/journal/stats"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    통계 및 분석
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    설정
                  </Link>
                </li>
              </ul>
            </div>

            {/* 도움말 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">도움말</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/help/getting-started"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    시작하기
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help/features"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    기능 가이드
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help/tips"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    활용 팁
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help/faq"
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    자주 묻는 질문
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* 하단 메시지 */}
          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-gray-600">
              🌟 매일의 작은 노력이 큰 변화를 만들어냅니다. 오늘도 한 걸음 더
              나아가세요! 💪
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 에러 경계 컴포넌트
export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          페이지 로딩 중 오류가 발생했습니다
        </h2>
        <p className="text-gray-600 mb-6">
          일시적인 문제일 수 있습니다. 다시 시도해보세요.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
