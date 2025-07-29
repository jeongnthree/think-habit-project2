// ⚠️ DEPRECATED: 보안 문제로 사용 중단됨
// SafeImageUploadService 사용하세요
// 이미지 업로드 서비스
import { createClient } from "@supabase/supabase-js";

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl =
  process.env.SUPABASE_URL || "https://gmvqcycnppuzixugzxvy.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("⚠️ SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = "journal-images";
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  /**
   * 단일 이미지 업로드
   */
  static async uploadImage(
    file: File,
    journalId: string,
  ): Promise<ImageUploadResult> {
    try {
      // 1. 파일 검증
      if (!this.validateFile(file)) {
        return {
          success: false,
          error: "지원하지 않는 파일 형식이거나 크기가 너무 큽니다.",
        };
      }

      // 2. 파일명 생성 (중복 방지)
      const fileExtension = file.name.split(".").pop() || "jpg";
      const fileName = `${journalId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

      // 3. Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return {
          success: false,
          error: `업로드 실패: ${error.message}`,
        };
      }

      // 4. 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error("Image upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  }

  /**
   * 여러 이미지 업로드
   */
  static async uploadImages(
    files: File[],
    journalId: string,
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadImage(file, journalId);
      results.push(result);
    }

    return results;
  }

  /**
   * 파일 검증
   */
  private static validateFile(file: File): boolean {
    // 파일 크기 검증
    if (file.size > this.MAX_FILE_SIZE) {
      return false;
    }

    // 파일 타입 검증
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return false;
    }

    return true;
  }

  /**
   * 이미지 삭제 (필요시)
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // URL에서 파일 경로 추출
      const urlParts = imageUrl.split("/");
      const fileName = urlParts.slice(-2).join("/"); // journalId/filename.ext

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error("Image delete error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Image delete error:", error);
      return false;
    }
  }
}
