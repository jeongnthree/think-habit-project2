// 안전한 이미지 업로드 서비스 (웹 서버 API 사용)
export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class SafeImageUploadService {
  private static readonly WEBSITE_URL = 'http://localhost:3000';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
  ];

  /**
   * 단일 이미지 업로드 (웹 서버 API 사용)
   */
  static async uploadImage(
    file: File,
    userId: string
  ): Promise<ImageUploadResult> {
    try {
      console.log('🖼️ 안전한 이미지 업로드 시작:', file.name);

      // 1. 파일 검증
      if (!this.validateFile(file)) {
        return {
          success: false,
          error: '지원하지 않는 파일 형식이거나 크기가 너무 큽니다.',
        };
      }

      // 2. FormData 생성
      const formData = new FormData();
      formData.append('files', file);
      formData.append('userId', userId);

      // 3. 웹 서버 API로 업로드 요청
      const response = await fetch(`${this.WEBSITE_URL}/api/upload/images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ 이미지 업로드 성공:', result.data?.urls?.[0]);
        return {
          success: true,
          url: result.data?.urls?.[0],
        };
      } else {
        console.error('❌ 이미지 업로드 실패:', result.error);
        return {
          success: false,
          error: result.error || '업로드 실패',
        };
      }
    } catch (error) {
      console.error('💥 이미지 업로드 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 여러 이미지 업로드
   */
  static async uploadImages(
    files: File[],
    userId: string
  ): Promise<ImageUploadResult[]> {
    try {
      console.log('🖼️ 다중 이미지 업로드 시작:', files.length, '개 파일');

      // 모든 파일 검증
      for (const file of files) {
        if (!this.validateFile(file)) {
          return [{
            success: false,
            error: `파일 "${file.name}"이 유효하지 않습니다.`,
          }];
        }
      }

      // FormData 생성
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('userId', userId);

      // 웹 서버 API로 업로드 요청
      const response = await fetch(`${this.WEBSITE_URL}/api/upload/images`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ 다중 이미지 업로드 성공:', result.data?.successCount, '개');
        
        // 각 URL에 대한 결과 생성
        const uploadResults: ImageUploadResult[] = result.data?.urls?.map((url: string) => ({
          success: true,
          url: url,
        })) || [];

        return uploadResults;
      } else {
        console.error('❌ 다중 이미지 업로드 실패:', result.error);
        return [{
          success: false,
          error: result.error || '업로드 실패',
        }];
      }
    } catch (error) {
      console.error('💥 다중 이미지 업로드 중 오류:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }];
    }
  }

  /**
   * 파일 검증
   */
  private static validateFile(file: File): boolean {
    // 파일 크기 검증
    if (file.size > this.MAX_FILE_SIZE) {
      console.warn(`⚠️ 파일 크기 초과: ${file.name} (${file.size} bytes)`);
      return false;
    }

    // 파일 타입 검증
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      console.warn(`⚠️ 지원하지 않는 파일 타입: ${file.name} (${file.type})`);
      return false;
    }

    return true;
  }

  /**
   * 업로드 가능 여부 확인
   */
  static isUploadAvailable(): boolean {
    try {
      // 브라우저 환경에서만 업로드 가능
      return typeof window !== 'undefined' && typeof fetch !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * 웹 서버 연결 상태 확인
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.WEBSITE_URL}/api/health`, {
        method: 'GET',
        timeout: 5000, // 5초 타임아웃
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}