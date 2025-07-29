import { uploadMultipleFiles } from '@/lib/upload';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 보안 이미지 업로드 API
 * POST /api/upload/images
 */
export async function POST(request: NextRequest) {
  try {
    // FormData에서 파일과 메타데이터 추출
    const data = await request.formData();
    const files: File[] = data.getAll('files') as File[];
    const userId = data.get('userId') as string;
    const journalId = data.get('journalId') as string | null;

    // 기본 검증
    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '업로드할 파일이 없습니다.',
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 ID가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // TODO: 사용자 인증 검증 (향후 구현)
    // const isAuthenticated = await verifyUserAuth(userId, request);
    // if (!isAuthenticated) {
    //   return NextResponse.json(
    //     { success: false, error: '인증이 필요합니다.' },
    //     { status: 401 }
    //   );
    // }

    console.log(
      `📤 이미지 업로드 시작: 사용자=${userId}, 파일수=${files.length}`
    );

    // 다중 파일 업로드 실행
    const result = await uploadMultipleFiles(
      files,
      userId,
      'journal-images',
      journalId || undefined
    );

    if (!result.success) {
      console.error('❌ 이미지 업로드 실패:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || '업로드에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    console.log(`✅ 이미지 업로드 성공: ${result.urls?.length}개 파일`);

    return NextResponse.json({
      success: true,
      data: {
        urls: result.urls,
        fileNames: result.fileNames,
        uploadedAt: new Date().toISOString(),
      },
      message: `${result.urls?.length}개 파일이 성공적으로 업로드되었습니다.`,
      ...(result.error && { warning: result.error }),
    });
  } catch (error) {
    console.error('❌ 이미지 업로드 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
