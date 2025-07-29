'use client';

import { APP_INFO, PUBLIC_ROUTES } from '@/constants';
import { cn } from '@/utils';
import Link from 'next/link';
import React from 'react';

// Footer 컴포넌트의 props 타입 정의
export interface FooterProps {
  className?: string;
}

// 링크 섹션 타입
interface LinkSection {
  title: string;
  links: {
    name: string;
    href: string;
    external?: boolean;
  }[];
}

// 푸터 링크 데이터
const footerSections: LinkSection[] = [
  {
    title: '서비스',
    links: [
      { name: '소개', href: PUBLIC_ROUTES.ABOUT },
      { name: '기능', href: '/features' },
      { name: '요금제', href: '/pricing' },
      { name: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: '지원',
    links: [
      { name: '고객센터', href: PUBLIC_ROUTES.CONTACT },
      { name: '사용자 가이드', href: '/guide' },
      { name: '개발자 API', href: '/api-docs' },
      { name: '시스템 상태', href: '/status' },
    ],
  },
  {
    title: '회사',
    links: [
      { name: '팀 소개', href: '/team' },
      { name: '채용', href: '/careers' },
      { name: '뉴스', href: '/news' },
      { name: '파트너', href: '/partners' },
    ],
  },
  {
    title: '법적 고지',
    links: [
      { name: '개인정보처리방침', href: PUBLIC_ROUTES.PRIVACY },
      { name: '이용약관', href: PUBLIC_ROUTES.TERMS },
      { name: '쿠키 정책', href: '/cookies' },
      { name: '라이선스', href: '/license' },
    ],
  },
];

// 소셜 미디어 링크
const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com',
    icon: (
      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
        <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
        <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
        <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
      </svg>
    ),
  },
  {
    name: 'Email',
    href: `mailto:${APP_INFO.CONTACT_EMAIL}`,
    icon: (
      <svg
        className='w-5 h-5'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
        />
      </svg>
    ),
  },
];

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-gray-900 text-white', className)}>
      <div className='container mx-auto px-4 py-12'>
        {/* 메인 푸터 콘텐츠 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8'>
          {/* 브랜드 섹션 */}
          <div className='lg:col-span-2'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>TH</span>
              </div>
              <span className='text-xl font-semibold'>
                {APP_INFO.SHORT_NAME}
              </span>
            </div>
            <p className='text-gray-300 mb-6 leading-relaxed'>
              {APP_INFO.DESCRIPTION}
            </p>

            {/* 소셜 미디어 링크 */}
            <div className='flex space-x-4'>
              {socialLinks.map(social => (
                <Link
                  key={social.name}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg'
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* 링크 섹션들 */}
          {footerSections.map(section => (
            <div key={section.title}>
              <h3 className='text-sm font-semibold uppercase tracking-wider mb-4'>
                {section.title}
              </h3>
              <ul className='space-y-3'>
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className='text-gray-300 hover:text-white transition-colors text-sm'
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 구분선 */}
        <hr className='my-8 border-gray-800' />

        {/* 하단 정보 */}
        <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
          <div className='flex flex-col items-center md:items-start space-y-2'>
            <p className='text-gray-400 text-sm'>
              {APP_INFO.COPYRIGHT}. All rights reserved.
            </p>
            <p className='text-gray-500 text-xs'>{APP_INFO.TRADEMARK}</p>
            <div className='flex items-center space-x-4 text-xs text-gray-500 mt-1'>
              <span>Made with ❤️ in Korea</span>
              <span>•</span>
              <span>Version {APP_INFO.VERSION}</span>
            </div>
          </div>

          {/* 언어 선택 (향후 확장용) */}
          <div className='flex items-center space-x-2 text-sm text-gray-400'>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span>한국어</span>
          </div>
        </div>
      </div>

      {/* 최하단 작은 텍스트 */}
      <div className='bg-gray-950 py-3'>
        <div className='container mx-auto px-4'>
          <p className='text-center text-xs text-gray-500'>
            이 서비스는 개인의 생각습관 개선을 목적으로 하며, 의료 상담을
            대체하지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
