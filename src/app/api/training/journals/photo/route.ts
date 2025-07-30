import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 이미지 압축 및 최적화를 위한 유틸리티
async function compressImage(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 기본적인 파일 크기 제한 (실제 압축은 클라이언트에서 처리)
  if (buffer.length > 10 * 1024 * 1024) {
    // 10MB
    throw new Error('파일 크기가 너무 큽니다');
  }

  return buffer;
}

// 메타데이터 추출
function extractMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}

// 파일 검증
const validateFile = (file: File) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/webp',
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`지원되지 않는 파일 형식: ${file.type}`);
  }

  if (file.size > maxSize) {
    throw new Error('파일 크기는 10MB 이하여야 합니다');
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // FormData 파싱
    const formData = await request.formData();
    const categoryId = formData.get('categoryId') as string;
    const description = (formData.get('description') as string) || '';
    const photoDescriptionsStr = formData.get('photoDescriptions') as string;

    let photoDescriptions: string[] = [];
    try {
      photoDescriptions = JSON.parse(photoDescriptionsStr || '[]');
    } catch (e) {
      photoDescriptions = [];
    }

    // 기본 검증
    if (!categoryId) {
      return NextResponse.json(
        { error: '카테고리 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 카테고리 존재 및 접근 권한 확인
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 사용자의 카테고리 할당 확인
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('student_id', user.id)
      .eq('category_id', categoryId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: '이 카테고리에 대한 접근 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 업로드된 파일들 수집
    const photoFiles: File[] = [];
    const entries = Array.from(formData.entries());

    for (const [key, value] of entries) {
      if (key.startsWith('photo_') && value instanceof File) {
        photoFiles.push(value);
      }
    }

    if (photoFiles.length === 0) {
      return NextResponse.json(
        { error: '최소 1장의 사진이 필요합니다' },
        { status: 400 }
      );
    }

    // 파일 검증
    for (const file of photoFiles) {
      try {
        validateFile(file);
      } catch (error) {
        return NextResponse.json(
          {
            error: `파일 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
          },
          { status: 400 }
        );
      }
    }

    // 데이터베이스 트랜잭션 시작
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        student_id: user.id,
        category_id: categoryId,
        title: `사진 일지 - ${new Date().toLocaleDateString('ko-KR')}`,
        content: description,
        journal_type: 'photo',
        is_public: false,
      })
      .select()
      .single();

    if (journalError || !journal) {
      console.error('Journal creation error:', journalError);
      return NextResponse.json(
        { error: '일지 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // 사진 파일들을 Supabase Storage에 업로드
    const uploadedPhotos = [];

    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      
      // file이 undefined인 경우 건너뛰기
      if (!file) {
        continue;
      }
      
      const metadata = extractMetadata(file);

      try {
        // 파일 압축
        const compressedBuffer = await compressImage(file);

        // 고유한 파일명 생성
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${journal.id}_${i}_${Date.now()}.${fileExtension}`;
        const filePath = `journal-photos/${user.id}/${fileName}`;

        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('journal-photos')
          .upload(filePath, compressedBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error(`파일 업로드 실패: ${uploadError.message}`);
        }

        // 공개 URL 생성
        const {
          data: { publicUrl },
        } = supabase.storage.from('journal-photos').getPublicUrl(filePath);

        // 사진 메타데이터를 데이터베이스에 저장
        const { data: photoRecord, error: photoError } = await supabase
          .from('journal_photos')
          .insert({
            journal_id: journal.id,
            photo_url: publicUrl,
            caption: photoDescriptions[i] || '',
            order_index: i,
            file_size: metadata.size,
            file_type: metadata.type,
          })
          .select()
          .single();

        if (photoError) {
          console.error('Photo record creation error:', photoError);
          throw new Error('사진 정보 저장에 실패했습니다');
        }

        uploadedPhotos.push(photoRecord);
      } catch (error) {
        console.error('Photo processing error:', error);

        // 실패한 경우 이미 생성된 일지 삭제
        await supabase.from('journals').delete().eq('id', journal.id);

        // 이미 업로드된 파일들 삭제
        for (const photo of uploadedPhotos) {
          const urlParts = photo.photo_url.split('/');
          const filePath = urlParts.slice(-3).join('/'); // journal-photos/userId/fileName
          await supabase.storage.from('journal-photos').remove([filePath]);
        }

        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : '사진 처리 중 오류가 발생했습니다',
          },
          { status: 500 }
        );
      }
    }

    // 주간 진행률 업데이트
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 이번 주 완료된 일지 수 계산
    const { count: weeklyCount } = await supabase
      .from('journals')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('category_id', categoryId)
      .gte('created_at', startOfWeek.toISOString())
      .lte('created_at', endOfWeek.toISOString());

    // 진행률 업데이트 (upsert)
    await supabase.from('progress_tracking').upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        week_start_date: startOfWeek.toISOString().split('T')[0],
        completed_count: weeklyCount || 0,
        target_count: assignment.weekly_target || 3,
        completion_rate:
          ((weeklyCount || 0) / (assignment.weekly_target || 3)) * 100,
        last_entry_date: new Date().toISOString().split('T')[0],
      },
      {
        onConflict: 'user_id,category_id,week_start_date',
      }
    );

    // 성공 응답
    return NextResponse.json({
      success: true,
      journal: {
        ...journal,
        photos: uploadedPhotos,
      },
      message: '사진 일지가 성공적으로 제출되었습니다',
    });
  } catch (error) {
    console.error('Photo journal submission error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET 요청으로 특정 사진 일지 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const journalId = searchParams.get('id');

    if (!journalId) {
      return NextResponse.json(
        { error: '일지 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 일지와 사진들을 함께 조회
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .select(
        `
        *,
        categories (
          id,
          name,
          description
        ),
        journal_photos (
          id,
          photo_url,
          caption,
          order_index,
          file_size,
          file_type,
          created_at
        )
      `
      )
      .eq('id', journalId)
      .eq('journal_type', 'photo')
      .single();

    if (journalError || !journal) {
      return NextResponse.json(
        { error: '일지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 접근 권한 확인 (본인 또는 공개 일지)
    if (journal.student_id !== user.id && !journal.is_public) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 사진들을 order_index 순으로 정렬
    if (journal.journal_photos) {
      journal.journal_photos.sort(
        (a: any, b: any) => a.order_index - b.order_index
      );
    }

    return NextResponse.json({
      success: true,
      journal,
    });
  } catch (error) {
    console.error('Photo journal fetch error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
