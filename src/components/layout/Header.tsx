'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from '../ui/Logo';

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

/**
 * 공통 헤더 컴포넌트
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // 네비게이션 아이템
  const navItems: NavItem[] = [
    { label: '대시보드', href: '/dashboard' },
    { label: '훈련 일지', href: '/training' },
    { label: '커뮤니티', href: '/community' },
    { label: '진단', href: '/diagnosis' },
    { label: '마이페이지', href: '/profile' },
  ];

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-2'
          : 'bg-white/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className='container mx-auto px-4 flex items-center justify-between'>
        {/* 로고 */}
        <Logo size='md' />

        {/* 데스크톱 네비게이션 */}
        <nav className='hidden md:flex items-center space-x-8'>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : undefined}
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === item.href
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* 로그인/회원가입 버튼 */}
          <div className='flex items-center space-x-4'>
            <Link
              href='/login'
              className='text-sm font-medium text-gray-700 hover:text-blue-600'
            >
              로그인
            </Link>
            <Link
              href='/signup'
              className='text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
            >
              회원가입
            </Link>
          </div>
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button
          className='md:hidden p-2'
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label='메뉴 열기'
        >
          {isMenuOpen ? (
            <X className='h-6 w-6 text-gray-700' />
          ) : (
            <Menu className='h-6 w-6 text-gray-700' />
          )}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isMenuOpen && (
        <div className='md:hidden bg-white border-t border-gray-200'>
          <div className='container mx-auto px-4 py-4 space-y-4'>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-2 text-base font-medium ${
                  pathname === item.href
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className='pt-4 border-t border-gray-200 flex flex-col space-y-3'>
              <Link
                href='/login'
                onClick={() => setIsMenuOpen(false)}
                className='block py-2 text-base font-medium text-gray-700'
              >
                로그인
              </Link>
              <Link
                href='/signup'
                onClick={() => setIsMenuOpen(false)}
                className='block py-2 text-base font-medium text-center bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 transition-colors'
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
