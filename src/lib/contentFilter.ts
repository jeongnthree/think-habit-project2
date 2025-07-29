// 콘텐츠 필터링 및 검증 유틸리티
import {
  CONTENT_LIMITS,
  getUserTrustLevel,
  validateContentByTrustLevel,
} from '@/utils/content-moderation';

// 금지된 단어 목록 (더 포괄적인 목록)
const BANNED_WORDS = [
  // 욕설 및 비속어
  '바보',
  '멍청이',
  '병신',
  '미친',
  '개새끼',
  '씨발',
  '좆',
  '존나',
  '개같은',
  '쓰레기',
  '똥',
  '개놈',
  '년',
  '놈',
  '새끼',
  // 차별적 표현
  '장애인',
  '정신병자',
  '미개인',
  '미친놈',
  '또라이',
  '정신나간',
  // 성적 표현
  '섹스',
  '야동',
  '포르노',
  '자위',
  '성교',
  // 폭력적 표현
  '죽여',
  '죽이고',
  '때려',
  '패',
  '폭행',
  '살인',
  '자살',
  // 스팸성 표현
  '광고',
  '홍보',
  '돈벌기',
  '투자',
  '대출',
  '카지노',
  '도박',
  // 개인정보 관련
  '전화번호',
  '주민번호',
  '계좌번호',
];

// 의심스러운 패턴 (정규식)
const SUSPICIOUS_PATTERNS = [
  /\b\d{2,3}-\d{3,4}-\d{4}\b/g, // 전화번호 패턴
  /\d{6}-\d{7}/, // 주민번호 패턴
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 이메일 패턴
  /https?:\/\/[^\s]+/gi, // URL 패턴
  /(.)\1{4,}/, // 같은 문자 5번 이상 반복
  /[가-힣]{2,}\s*\d{2,3}-\d{3,4}-\d{4}/g, // 이름 + 전화번호
  /카톡\s*ID|카카오톡\s*ID|텔레그램/gi, // 연락처 유도
  /무료\s*체험|100%\s*보장|확실한\s*수익/gi, // 광고성 문구
];

export interface ContentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  filteredContent?: string;
}

/**
 * 기본 콘텐츠 길이 및 형식 검증
 */
export function validateContentLength(
  content: string,
  minLength: number = 1,
  maxLength: number = 500
): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 빈 콘텐츠 검사
  if (!content || content.trim().length === 0) {
    errors.push('내용을 입력해주세요.');
    return { isValid: false, errors, warnings };
  }

  const trimmedContent = content.trim();

  // 최소 길이 검사
  if (trimmedContent.length < minLength) {
    errors.push(`최소 ${minLength}자 이상 입력해주세요.`);
  }

  // 최대 길이 검사
  if (trimmedContent.length > maxLength) {
    errors.push(`최대 ${maxLength}자까지 입력 가능합니다.`);
  }

  // 줄바꿈 과다 사용 검사
  const lineBreaks = (content.match(/\n/g) || []).length;
  if (lineBreaks > 10) {
    warnings.push('과도한 줄바꿈이 포함되어 있습니다.');
  }

  // 공백 과다 사용 검사
  if (/\s{5,}/.test(content)) {
    warnings.push('과도한 공백이 포함되어 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    filteredContent: trimmedContent,
  };
}

/**
 * 금지된 단어 검사
 */
export function checkBannedWords(content: string): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let filteredContent = content;

  const lowerContent = content.toLowerCase();

  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      errors.push(`부적절한 표현이 포함되어 있습니다: "${word}"`);
      // 금지된 단어를 별표로 대체
      const regex = new RegExp(word, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    filteredContent,
  };
}

/**
 * 의심스러운 패턴 검사
 */
export function checkSuspiciousPatterns(
  content: string
): ContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      if (pattern.source.includes('\\d{3}-\\d{4}-\\d{4}')) {
        errors.push(
          '전화번호가 포함되어 있습니다. 개인정보는 공유하지 마세요.'
        );
      } else if (pattern.source.includes('\\d{6}-\\d{7}')) {
        errors.push(
          '주민번호가 포함되어 있습니다. 개인정보는 공유하지 마세요.'
        );
      } else if (pattern.source.includes('@')) {
        warnings.push(
          '이메일 주소가 포함되어 있습니다. 개인정보 공유에 주의하세요.'
        );
      } else if (pattern.source.includes('https?')) {
        warnings.push(
          '외부 링크가 포함되어 있습니다. 안전한 링크인지 확인하세요.'
        );
      } else if (pattern.source.includes('(.)\\1{4,}')) {
        warnings.push('반복되는 문자가 과도하게 사용되었습니다.');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * HTML 태그 및 스크립트 제거
 */
export function sanitizeHtml(content: string): string {
  // 기본적인 HTML 태그 제거
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 태그 완전 제거
    .replace(/<[^>]*>/g, '') // 모든 HTML 태그 제거
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

  return sanitized;
}

/**
 * 종합적인 콘텐츠 검증
 */
export function validateContent(
  content: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowHtml?: boolean;
    strictMode?: boolean;
  } = {}
): ContentValidationResult {
  const {
    minLength = 1,
    maxLength = 500,
    allowHtml = false,
    strictMode = false,
  } = options;

  let processedContent = content;
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // HTML 제거 (허용되지 않는 경우)
  if (!allowHtml) {
    processedContent = sanitizeHtml(processedContent);
  }

  // 1. 길이 및 형식 검증
  const lengthResult = validateContentLength(
    processedContent,
    minLength,
    maxLength
  );
  allErrors.push(...lengthResult.errors);
  allWarnings.push(...lengthResult.warnings);

  if (!lengthResult.isValid) {
    return {
      isValid: false,
      errors: allErrors,
      warnings: allWarnings,
      filteredContent: processedContent,
    };
  }

  // 2. 금지된 단어 검사
  const bannedWordsResult = checkBannedWords(processedContent);
  if (strictMode) {
    // 엄격 모드에서는 금지된 단어가 있으면 거부
    allErrors.push(...bannedWordsResult.errors);
  } else {
    // 일반 모드에서는 경고로 처리하고 필터링된 내용 사용
    allWarnings.push(...bannedWordsResult.errors);
    if (bannedWordsResult.filteredContent) {
      processedContent = bannedWordsResult.filteredContent;
    }
  }

  // 3. 의심스러운 패턴 검사
  const suspiciousResult = checkSuspiciousPatterns(processedContent);
  allErrors.push(...suspiciousResult.errors);
  allWarnings.push(...suspiciousResult.warnings);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    filteredContent: processedContent,
  };
}

/**
 * 댓글 전용 검증 (더 엄격한 기준)
 */
export function validateComment(
  content: string,
  userRole?: string,
  accountAge?: number
): ContentValidationResult {
  // 기본 검증 먼저 수행
  const basicValidation = validateContent(content, {
    minLength: CONTENT_LIMITS.COMMENT_MIN_LENGTH,
    maxLength: CONTENT_LIMITS.COMMENT_MAX_LENGTH,
    allowHtml: false,
    strictMode: false,
  });

  // 사용자 신뢰도 기반 추가 검증
  if (userRole && accountAge !== undefined) {
    const trustLevel = getUserTrustLevel(userRole, accountAge);
    const trustValidation = validateContentByTrustLevel(content, trustLevel);

    return {
      isValid: basicValidation.isValid && trustValidation.isValid,
      errors: [...basicValidation.errors, ...trustValidation.errors],
      warnings: [
        ...(basicValidation.warnings || []),
        ...(trustValidation.errors || []),
      ],
      filteredContent: basicValidation.filteredContent,
    };
  }

  return basicValidation;
}

/**
 * 일지 제목 검증
 */
export function validateJournalTitle(title: string): ContentValidationResult {
  return validateContent(title, {
    minLength: 1,
    maxLength: 100,
    allowHtml: false,
    strictMode: true, // 제목은 더 엄격하게
  });
}

/**
 * 일지 내용 검증
 */
export function validateJournalContent(
  content: string
): ContentValidationResult {
  return validateContent(content, {
    minLength: 10,
    maxLength: 5000,
    allowHtml: false,
    strictMode: false,
  });
}
