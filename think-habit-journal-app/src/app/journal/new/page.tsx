// app/journal/new/page.tsx
// 새 일지 생성을 위한 페이지

import { JournalTypeSelector } from "@/components/journal/JournalTypeSelector";
import { authOptions } from "@/lib/auth";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "새 일지 작성 | Think-Habit",
  description: "Think-Habit 훈련 일지를 작성하여 성장을 기록하세요",
};

// 검색 파라미터 처리를 위한 클라이언트 컴포넌트
const NewJournalContent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 뒤로가기 */}
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">일지 목록으로</span>
            </Link>

            {/* 제목 */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h1 className="text-lg font-semibold text-gray-900">
                새 일지 작성
              </h1>
            </div>

            {/* 빈 공간 (균형을 위해) */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JournalTypeSelector showTitle={true} autoNavigate={true} />
      </main>

      {/* 푸터 */}
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>Think-Habit으로 더 나은 자신을 만들어가세요 ✨</p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link
                href="/help"
                className="hover:text-gray-700 transition-colors"
              >
                도움말
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/journal"
                className="hover:text-gray-700 transition-colors"
              >
                일지 목록
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/settings"
                className="hover:text-gray-700 transition-colors"
              >
                설정
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 메인 페이지 컴포넌트
export default async function NewJournalPage() {
  // 사용자 인증 확인
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/journal/new");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">일지 작성 준비 중...</p>
          </div>
        </div>
      }
    >
      <NewJournalContent />
    </Suspense>
  );
}

// 타입별 특별 페이지들을 위한 추가 컴포넌트
export const NewStructuredJournalPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            구조화된 일지 작성
          </h1>
          <p className="text-gray-600">
            할 일 목록으로 체계적인 훈련 계획을 세워보세요
          </p>
        </div>

        {/* 여기에 StructuredJournalForm 컴포넌트가 들어갈 예정 */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-center text-gray-500">
            구조화된 일지 폼이 여기에 표시됩니다 (Task 8에서 구현 예정)
          </p>
        </div>
      </div>
    </div>
  );
};

export const NewPhotoJournalPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            사진 일지 작성
          </h1>
          <p className="text-gray-600">
            이미지와 함께 생생한 훈련 경험을 기록하세요
          </p>
        </div>

        {/* 여기에 PhotoJournalForm 컴포넌트가 들어갈 예정 */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-center text-gray-500">
            사진 일지 폼이 여기에 표시됩니다 (Task 9에서 구현 예정)
          </p>
        </div>
      </div>
    </div>
  );
};
