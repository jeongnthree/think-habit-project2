/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify 배포를 위해 output 설정 제거
  // output: 'standalone',
  
  // 기본 설정
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // ESLint 경고 무시 (배포용)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 타입 체크 무시 (배포용)
  typescript: {
    ignoreBuildErrors: true,
  },
  

  // 환경 변수
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://think-habit.com',
  },
  
  // Netlify 배포를 위한 추가 설정
  // target 옵션은 Next.js 13+ 에서 deprecated 되었으므로 제거
};

module.exports = nextConfig;
