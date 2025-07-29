//import AccessibilityProvider from '../components/AccessibilityProvider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts';
import '../styles/accessibility.css';
import './globals.css';

// Inter 폰트 설정
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// 메타데이터
export const metadata: Metadata = {
  title: '생각습관 - 생각도 습관입니다',
  description:
    '생각도 습관, 습관이기에 훈련하면 개선할 수 있습니다. 체계적인 훈련 일지와 커뮤니티 지원으로 함께 성장합니다.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://생각습관.com'
  ),
  openGraph: {
    title: '생각습관 - 생각도 습관입니다',
    description: '생각도 습관, 습관이기에 훈련하면 개선할 수 있습니다.',
    url: 'https://생각습관.com',
    siteName: '생각습관',
    locale: 'ko_KR',
    type: 'website',
  },
  keywords: [
    '생각습관',
    '생각교육',
    '사고훈련',
    '인지행동',
    '습관개선',
    '정신건강',
  ],
  authors: [{ name: '생각습관 연구소' }],
  creator: '생각습관 연구소',
  publisher: '생각습관.com',
  alternates: {
    canonical: 'https://생각습관.com',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 루트 레이아웃 컴포넌트
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ko' className={inter.className}>
      <body className='antialiased bg-white text-gray-900'>
        {/* <SkipLink href='#main-content'>메인 콘텐츠로 건너뛰기</SkipLink> */}
        {/* <AccessibilityProvider> */}
        <AuthProvider>
          {/* 인증 레이아웃에는 헤더를 포함하지 않음 */}
          <div id='main-content'>{children}</div>
        </AuthProvider>
        {/* </AccessibilityProvider> */}
      </body>
    </html>
  );
}
