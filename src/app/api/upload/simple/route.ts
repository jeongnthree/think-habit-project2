import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 간단한 이미지 업로드 API (테스트용)
 * POST /api/upload/simple
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 간단 업로드 API 호출됨');

    // FormData에서 파일 추출
    const data = await request.formData();
    const files: File[] = data.getAll('files') as File[];
    const userId = (data.get('userId') as string) || 'test-user';

    console.log('받은 파일 수:', files.length);
    console.log('사용자 ID:', userId);

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

    // 환경변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('환경변수 누락:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 설정이 누락되었습니다.',
        },
        { status: 500 }
      );
    }

    console.log('✅ 환경변수 확인 완료');

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    // 각 파일 업로드
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`파일 ${i + 1} 업로드 시작:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      try {
        // 간단한 파일명 생성
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `test/${timestamp}-${randomId}.${extension}`;

        console.log('업로드할 파일명:', fileName);

        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('journal-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`파일 ${i + 1} 업로드 오류:`, uploadError);
          errors.push(`${file.name}: ${uploadError.message}`);
          continue;
        }

        console.log(`파일 ${i + 1} 업로드 성공:`, uploadData);

        // 공개 URL 생성
        const { data: publicData } = supabase.storage
          .from('journal-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicData.publicUrl);
        console.log(`파일 ${i + 1} 공개 URL:`, publicData.publicUrl);
      } catch (fileError) {
        console.error(`파일 ${i + 1} 처리 중 오류:`, fileError);
        errors.push(
          `${file.name}: ${fileError instanceof Error ? fileError.message : '알 수 없는 오류'}`
        );
      }
    }

    // 결과 반환
    if (uploadedUrls.length > 0) {
      console.log('✅ 업로드 완료:', uploadedUrls.length, '개 파일');
      return NextResponse.json({
        success: true,
        data: {
          urls: uploadedUrls,
          uploadedAt: new Date().toISOString(),
          totalFiles: files.length,
          successCount: uploadedUrls.length,
          errorCount: errors.length,
        },
        message: `${uploadedUrls.length}개 파일이 성공적으로 업로드되었습니다.`,
        ...(errors.length > 0 && { warnings: errors }),
      });
    } else {
      console.error('❌ 모든 파일 업로드 실패:', errors);
      return NextResponse.json(
        {
          success: false,
          error: `모든 파일 업로드 실패: ${errors.join(', ')}`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ 간단 업로드 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: `서버 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      },
      { status: 500 }
    );
  }
}
