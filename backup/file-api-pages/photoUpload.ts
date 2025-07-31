/**
 * 사진 업로드 관련 유틸리티 함수들
 */

// 파일 크기를 읽기 쉬운 형태로 변환
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 이미지 파일 유효성 검사
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // 파일 크기 체크 (5MB 제한)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${formatFileSize(maxSize)}까지 업로드 가능합니다.`,
    };
  }

  // 파일 타입 체크
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        '지원하지 않는 파일 형식입니다. JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.',
    };
  }

  return { isValid: true };
}

// 이미지 미리보기 생성
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      resolve(e.target?.result as string);
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽는데 실패했습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

// 이미지 압축 (선택사항)
export function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 비율 유지하면서 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Blob으로 변환
      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // 압축 실패 시 원본 반환
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// FormData 생성 헬퍼
export function createPhotoJournalFormData(data: {
  categoryId: string;
  title: string;
  content: string;
  isPublic: boolean;
  studentId: string;
  photos: File[];
  captions: string[];
}): FormData {
  const formData = new FormData();

  formData.append('category_id', data.categoryId);
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('is_public', data.isPublic.toString());
  formData.append('student_id', data.studentId);

  // 사진 파일들 추가
  data.photos.forEach(photo => {
    formData.append('photos', photo);
  });

  // 캡션들 추가
  data.captions.forEach(caption => {
    formData.append('captions', caption);
  });

  return formData;
}

// 드래그 앤 드롭 이벤트 처리
export function handleDragAndDrop(
  onFilesAdded: (files: File[]) => void,
  onError: (error: string) => void
) {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      onError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 유효성 검사
    const invalidFiles = imageFiles.filter(
      file => !validateImageFile(file).isValid
    );
    if (invalidFiles.length > 0) {
      onError('일부 파일이 유효하지 않습니다.');
      return;
    }

    onFilesAdded(imageFiles);
  };

  return { handleDragOver, handleDrop };
}

// 클립보드에서 이미지 붙여넣기
export function handlePasteImage(
  e: ClipboardEvent,
  onImagePasted: (file: File) => void,
  onError: (error: string) => void
) {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item && item.type.startsWith('image/')) {
      const file = item?.getAsFile();
      if (file) {
        const validation = validateImageFile(file);
        if (validation.isValid) {
          onImagePasted(file);
        } else {
          onError(validation.error || '유효하지 않은 이미지입니다.');
        }
      }
      break;
    }
  }
}
