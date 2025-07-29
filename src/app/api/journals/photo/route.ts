import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/journals/photo - 사진 일지 생성
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 폼 데이터에서 정보 추출
    const categoryId = formData.get('category_id') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const isPublic = formData.get('is_public') === 'true';
    const studentId = formData.get('student_id') as string;

    // 사진 파일들 추출
    const photos = formData.getAll('photos') as File[];
    const captions = formData.getAll('captions') as string[];

    if (!categoryId || !title || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 }
      );
    }

    if (photos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '최소 1장의 사진을 업로드해주세요.',
        },
        { status: 400 }
      );
    }

    // 1. 일지 생성
    const { data: journal, error: journalError } = await supabase
      .from('journals')
      .insert({
        student_id: studentId,
        category_id: categoryId,
        title,
        content: content || '',
        is_public: isPublic,
        journal_type: 'photo',
      })
      .select()
      .single();

    if (journalError) {
      throw journalError;
    }

    // 2. 사진 업로드 및 저장
    const uploadedPhotos = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const caption = captions[i] || '';

      // 파일명 생성 (중복 방지)
      const fileExt = photo.name.split('.').pop();
      const fileName = `${studentId}/${journal.id}/${Date.now()}-${i}.${fileExt}`;

      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('journal-photos')
        .upload(fileName, photo, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        continue; // 실패한 사진은 건너뛰고 계속 진행
      }

      // 공개 URL 생성
      const {
        data: { publicUrl },
      } = supabase.storage.from('journal-photos').getPublicUrl(fileName);

      // 사진 정보를 데이터베이스에 저장
      const { data: photoData, error: photoError } = await supabase
        .from('journal_photos')
        .insert({
          journal_id: journal.id,
          photo_url: publicUrl,
          caption: caption || null,
          file_size: photo.size,
          file_type: photo.type,
        })
        .select()
        .single();

      if (!photoError && photoData) {
        uploadedPhotos.push(photoData);
      }
    }

    // 3. OCR 처리 (비동기로 처리 - 실제 구현 시)
    // processOCRAsync(uploadedPhotos);

    return NextResponse.json({
      success: true,
      data: {
        journal,
        photos: uploadedPhotos,
      },
      message: '사진 일지가 성공적으로 저장되었습니다.',
    });
  } catch (error) {
    console.error('Error creating photo journal:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '사진 일지 생성에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
