'use client';

import { Card } from '@/components/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalCategories: number;
  totalStudents: number;
  totalJournals: number;
  journalsThisWeek: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCategories: 0,
    totalStudents: 0,
    totalJournals: 0,
    journalsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제로는 API에서 통계 데이터를 가져와야 함
    // 여기서는 임시 데이터 사용
    setTimeout(() => {
      setStats({
        totalCategories: 5,
        totalStudents: 12,
        totalJournals: 48,
        journalsThisWeek: 8,
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-2">
          Think-Habit Lite 시스템을 관리합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 카테고리</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 학습자</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">총 일지</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJournals}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">이번 주 일지</p>
              <p className="text-2xl font-bold text-gray-900">{stats.journalsThisWeek}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리 관리</h3>
          <p className="text-gray-600 mb-4">
            훈련 카테고리를 생성하고 관리합니다.
          </p>
          <Link
            href="/admin/categories"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            카테고리 관리
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">할당 관리</h3>
          <p className="text-gray-600 mb-4">
            학습자에게 카테고리를 할당하고 관리합니다.
          </p>
          <Link
            href="/admin/assignments"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            할당 관리
          </Link>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 관리</h3>
          <p className="text-gray-600 mb-4">
            시스템 사용자를 관리합니다.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            사용자 관리
          </Link>
        </Card>
      </div>

      {/* 최근 활동 */}
      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <span className="text-gray-600">새로운 카테고리 "창의적 사고"가 추가되었습니다.</span>
              <span className="ml-auto text-gray-400">2시간 전</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <span className="text-gray-600">학습자 김철수님이 새로운 일지를 작성했습니다.</span>
              <span className="ml-auto text-gray-400">4시간 전</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              <span className="text-gray-600">새로운 사용자가 등록되었습니다.</span>
              <span className="ml-auto text-gray-400">1일 전</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}