import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 기본 헬스체크
    const healthCheck: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    };

    // 데이터베이스 연결 확인
    try {
      const { error } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      healthCheck.database = 'connected';
    } catch (dbError) {
      healthCheck.database = 'disconnected';
      healthCheck.status = 'degraded';
    }

    // 메모리 사용량 확인
    const memoryUsage = process.memoryUsage();
    healthCheck.memory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
    };

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}