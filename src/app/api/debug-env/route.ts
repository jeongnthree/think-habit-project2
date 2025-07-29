// src/app/api/debug-env/route.ts
// 서버 사이드 환경 변수 확인용 API

import { NextResponse } from 'next/server';

export async function GET() {
  // 서버 사이드에서 환경 변수 확인
  const serverEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  };

  // 보안을 위해 실제 값은 마스킹
  const maskedEnv = Object.entries(serverEnv).reduce(
    (acc, [key, value]) => {
      acc[key] = {
        exists: !!value,
        length: value?.length || 0,
        preview: value ? `${value.substring(0, 10)}...` : null,
      };
      return acc;
    },
    {} as Record<string, any>
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    workingDirectory: process.cwd(),
    environmentVariables: maskedEnv,
  });
}
