/**
 * 보안 이미지 업로드 유틸리티
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

// 허용된 이미지 MIME 타입
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// 허용된 파일 확장자
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// 파일 크기 제한 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 최대 파일 개수
const MAX_FILE_COUNT = 5;

/**
 * 파일 검증
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 허용됩니다.`,
    };
  }

  // MIME 타입 검증
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `지원하지 않는 파일 형식입니다. ${ALLOWED_IMAGE_TYPES.join(', ')}만 허용됩니다.`,
    };
  }

  // 파일 확장자 검증
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `지원하지 않는 파일 확장자입니다. ${ALLOWED_EXTENSIONS.join(', ')}만 허용됩니다.`,
    };
  }

  return { isValid: true };
}

/**
 * 다중 파일 검증
 */
export function validateFiles(files: File[]): {
  isValid: boolean;
  error?: string;
} {
  if (files.length === 0) {
    return {
      isValid: false,
      error: '업로드할 파일이 없습니다.',
    };
  }

  if (files.length > MAX_FILE_COUNT) {
    return {
      isValid: false,
      error: `최대 ${MAX_FILE_COUNT}개의 파일만 업로드할 수 있습니다.`,
    };
  }

  // 각 파일 개별 검증
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
}

/**
 * 보안 파일명 생성
 */
export function generateSecureFileName(
  originalName: string,
  userId: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName
    .toLowerCase()
    .substring(originalName.lastIndexOf('.'));

  return `${timestamp}-${randomId}${extension}`;
}

/**
 * 스토리지 경로 생성
 */
export function generateStoragePath(
  userId: string,
  fileName: string,
  journalId?: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  if (journalId) {
    return `${userId}/${year}/${month}/${journalId}/${fileName}`;
  }

  return `${userId}/${year}/${month}/${fileName}`;
}

/**
 * Supabase Storage에 파일 업로드
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: string,
  path: string
): Promise<{ url?: string; error?: string }> {
  try {
    // Service Role Key를 사용한 Supabase 클라이언트 생성 (서버사이드에서만)
    const supabase = createClient(
      SUPABASE_CONFIG.URL,
      SUPABASE_CONFIG.SERVICE_ROLE_KEY
    );

    // 파일 업로드
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return { error: `업로드 실패: ${error.message}` };
    }

    // 공개 URL 생성
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicData.publicUrl };
  } catch (error) {
    console.error('Upload to Supabase Storage failed:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : '업로드 중 알 수 없는 오류가 발생했습니다.',
    };
  }
}

/**
 * 다중 파일 업로드
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  bucket: string = 'journal-images',
  journalId?: string
): Promise<{
  success: boolean;
  urls?: string[];
  fileNames?: string[];
  error?: string;
}> {
  try {
    // 파일 검증
    const validation = validateFiles(files);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const uploadResults: { url: string; fileName: string }[] = [];
    const errors: string[] = [];

    // 각 파일 순차 업로드
    for (const file of files) {
      const fileName = generateSecureFileName(file.name, userId);
      const storagePath = generateStoragePath(userId, fileName, journalId);

      const result = await uploadToSupabaseStorage(file, bucket, storagePath);

      if (result.error) {
        errors.push(`${file.name}: ${result.error}`);
      } else if (result.url) {
        uploadResults.push({
          url: result.url,
          fileName: fileName,
        });
      }
    }

    // 일부 파일이라도 성공했으면 성공으로 처리
    if (uploadResults.length > 0) {
      return {
        success: true,
        urls: uploadResults.map(r => r.url),
        fileNames: uploadResults.map(r => r.fileName),
        error:
          errors.length > 0
            ? `일부 파일 업로드 실패: ${errors.join(', ')}`
            : undefined,
      };
    }

    // 모든 파일이 실패한 경우
    return {
      success: false,
      error: `모든 파일 업로드 실패: ${errors.join(', ')}`,
    };
  } catch (error) {
    console.error('Multiple file upload error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : '업로드 중 알 수 없는 오류가 발생했습니다.',
    };
  }
}
