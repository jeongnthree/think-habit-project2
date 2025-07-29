/**
 * 이미지 최적화 유틸리티 함수
 */

interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: string;
}

/**
 * 이미지 압축 함수
 * @param file 압축할 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 이미지 파일
 */
export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<File> {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') {
    return file;
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = event => {
        if (!event.target?.result) {
          reject(new Error('이미지 파일을 읽을 수 없습니다.'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          // 이미지 크기 계산
          let width = img.width;
          let height = img.height;

          // 최대 크기 제한
          if (width > options.maxWidth) {
            const ratio = options.maxWidth / width;
            width = options.maxWidth;
            height = height * ratio;
          }

          if (height > options.maxHeight) {
            const ratio = options.maxHeight / height;
            height = options.maxHeight;
            width = width * ratio;
          }

          // 캔버스에 이미지 그리기
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // 이미지 압축 및 변환
          const format = options.format || 'image/jpeg';
          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('이미지 압축에 실패했습니다.'));
                return;
              }

              // 새 파일 생성
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.' + format.split('/')[1],
                {
                  type: format,
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            format,
            options.quality
          );
        };

        img.onerror = () => {
          reject(new Error('이미지를 로드할 수 없습니다.'));
        };

        img.src = event.target.result as string;
      };

      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };

      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 최적의 이미지 포맷 결정
 * @returns 지원되는 최적의 이미지 포맷
 */
export function getOptimalImageFormat(): string {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') {
    return 'image/jpeg';
  }

  // WebP 지원 확인
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'image/webp';
  }

  // AVIF 지원 확인 (일부 최신 브라우저)
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'image/avif';
  }

  // 기본값
  return 'image/jpeg';
}
