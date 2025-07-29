import { NotificationDropdown } from '@/components/ui/NotificationDropdown';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

// 임시 사용자 ID (실제로는 인증에서 가져와야 함)
const CURRENT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

interface NavigationProps {
  userRole?: 'student' | 'teacher' | 'admin';
}

export const Navigation: React.FC<NavigationProps> = ({
  userRole = 'student',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/') || false;
  };

  const navItems = [
    { href: '/dashboard', label: '대시보드', icon: '📊' },
    { href: '/training', label: '훈련', icon: '📝' },
    { href: '/community', label: '커뮤니티', icon: '👥' },
    { href: '/downloads', label: '다운로드', icon: '📱' },
  ];

  if (userRole === 'admin' || userRole === 'teacher') {
    navItems.push({ href: '/admin', label: '관리', icon: '⚙️' });
  }

  return (
    <nav className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* 로고 및 메인 네비게이션 */}
          <div className='flex'>
            {/* 로고 */}
            <div className='flex-shrink-0 flex items-center'>
              <Link
                href='/dashboard'
                className='text-xl font-bold text-blue-600'
              >
                Think-Habit Lite
              </Link>
            </div>

            {/* 데스크톱 네비게이션 */}
            <div className='hidden sm:ml-6 sm:flex sm:space-x-8'>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <span className='mr-2'>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className='hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4'>
            {/* 알림 */}
            <NotificationDropdown userId={CURRENT_USER_ID} />

            {/* 사용자 메뉴 */}
            <div className='relative'>
              <button className='flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'>
                <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium'>
                  김
                </div>
              </button>
            </div>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className='sm:hidden flex items-center space-x-2'>
            <NotificationDropdown userId={CURRENT_USER_ID} />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <svg
                className='h-6 w-6'
                stroke='currentColor'
                fill='none'
                viewBox='0 0 24 24'
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className='sm:hidden'>
          <div className='pt-2 pb-3 space-y-1'>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className='mr-3'>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          <div className='pt-4 pb-3 border-t border-gray-200'>
            <div className='flex items-center px-4'>
              <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium'>
                김
              </div>
              <div className='ml-3'>
                <div className='text-base font-medium text-gray-800'>
                  김철수
                </div>
                <div className='text-sm text-gray-500'>학습자</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
