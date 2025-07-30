/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 및 Netlify 배포 최적화  
  output: 'standalone',
  
  // 기본 설정
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['gmvqcycnppuzixugzxvy.supabase.co'],
  },

  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://생각습관.com',
  },
  
  // Netlify 배포를 위한 추가 설정
  // target 옵션은 Next.js 13+ 에서 deprecated 되었으므로 제거
};

module.exports = nextConfig;
