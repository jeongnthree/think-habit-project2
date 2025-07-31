import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 관리자 네비게이션 */}
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex'>
              <div className='flex-shrink-0 flex items-center'>
                <Link href='/admin' className='text-xl font-bold text-gray-900'>
                  Think-Habit 관리자
                </Link>
              </div>
              <div className='hidden sm:ml-6 sm:flex sm:space-x-8'>
                <Link
                  href='/admin/categories'
                  className='border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                >
                  카테고리 관리
                </Link>
                <Link
                  href='/admin/assignments'
                  className='border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                >
                  할당 관리
                </Link>
                <Link
                  href='/admin/users'
                  className='border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                >
                  사용자 관리
                </Link>
                <Link
                  href='/admin/moderation'
                  className='border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                >
                  콘텐츠 조정
                </Link>
                <Link
                  href='/admin/blocked-users'
                  className='border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                >
                  차단 관리
                </Link>
              </div>
            </div>
            <div className='flex items-center'>
              <Link
                href='/'
                className='text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium'
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className='py-6'>{children}</main>
    </div>
  );
}
