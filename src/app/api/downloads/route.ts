import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// 다운로드 파일 경로 설정
const DOWNLOADS_DIR =
  process.env.DOWNLOADS_DIR || path.join(process.cwd(), 'public', 'downloads');

// 다운로드 통계 기록 함수
async function recordDownload(filename: string, userAgent: string, ip: string) {
  try {
    // 실제 구현에서는 데이터베이스에 기록
    console.log(`Download: ${filename}, User-Agent: ${userAgent}, IP: ${ip}`);
  } catch (error) {
    console.error('Failed to record download:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // URL에서 파일명 추출
    const url = new URL(request.url);
    const filename = path.basename(url.pathname);

    // 파일 경로 구성
    const filePath = path.join(DOWNLOADS_DIR, filename);

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // 파일 통계 정보 가져오기
    const stats = fs.statSync(filePath);

    // 다운로드 통계 기록
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') || 'Unknown';
    await recordDownload(filename, userAgent, ip);

    // 파일 스트림 생성
    const fileStream = fs.createReadStream(filePath);

    // MIME 타입 결정
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.exe')) contentType = 'application/x-msdownload';
    if (filename.endsWith('.dmg'))
      contentType = 'application/x-apple-diskimage';
    if (filename.endsWith('.zip')) contentType = 'application/zip';
    if (filename.endsWith('.deb'))
      contentType = 'application/vnd.debian.binary-package';
    if (filename.endsWith('.AppImage'))
      contentType = 'application/x-executable';

    // 응답 헤더 설정
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    };

    // 스트림 응답 반환
    return new NextResponse(fileStream as any, { headers });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
