/**
 * 콘텐츠 조정 및 필터링 유틸리티
 */

// 부적절한 단어 목록 (한국어)
const INAPPROPRIATE_WORDS = [
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
];

// 스팸 패턴 (정규식)
const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/gi, // URL 링크
  /\b\d{2,3}-\d{3,4}-\d{4}\b/g, // 전화번호
  /[가-힣]{2,}\s*\d{2,3}-\d{3,4}-\d{4}/g, // 이름 + 전화번호
  /카톡\s*ID|카카오톡\s*ID|텔레그램/gi, // 연락처 유도
  /무료\s*체험|100%\s*보장|확실한\s*수익/gi, // 광고성 문구
];

// 콘텐츠 길이 제한
export const CONTENT_LIMITS = {
  COMMENT_MIN_LENGTH: 1,
  COMMENT_MAX_LENGTH: 500,
  TITLE_MAX_LENGTH: 100,
} as const;

/**
 * 부적절한 단어 검사
 */
export function containsInappropriateWords(content: string): boolean {
  const normalizedContent = content.toLowerCase().replace(/\s+/g, '');

  return INAPPROPRIATE_WORDS.some(word =>
    normalizedContent.includes(word.toLowerCase())
  );
}

/**
 * 스팸 패턴 검사
 */
export function containsSpamPatterns(content: string): boolean {
  return SPAM_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * 반복 문자 검사 (도배 방지)
 */
export function hasExcessiveRepetition(content: string): boolean {
  // 같은 문자가 5번 이상 연속으로 반복되는 경우
  const repetitionPattern = /(.)\1{4,}/g;
  if (repetitionPattern.test(content)) {
    return true;
  }

  // 같은 단어가 3번 이상 반복되는 경우
  const words = content.split(/\s+/);
  const wordCount: { [key: string]: number } = {};

  for (const word of words) {
    if (word.length > 1) {
      wordCount[word] = (wordCount[word] || 0) + 1;
      if (wordCount[word] >= 3) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 콘텐츠 길이 검증
 */
export function validateContentLength(
  content: string,
  type: 'comment' | 'title' = 'comment'
): { isValid: boolean; error?: string } {
  const trimmedContent = content.trim();

  if (type === 'comment') {
    if (trimmedContent.length < CONTENT_LIMITS.COMMENT_MIN_LENGTH) {
      return { isValid: false, error: '댓글 내용을 입력해주세요.' };
    }
    if (trimmedContent.length > CONTENT_LIMITS.COMMENT_MAX_LENGTH) {
      return {
        isValid: false,
        error: `댓글은 ${CONTENT_LIMITS.COMMENT_MAX_LENGTH}자 이하로 작성해주세요.`,
      };
    }
  } else if (type === 'title') {
    if (trimmedContent.length > CONTENT_LIMITS.TITLE_MAX_LENGTH) {
      return {
        isValid: false,
        error: `제목은 ${CONTENT_LIMITS.TITLE_MAX_LENGTH}자 이하로 작성해주세요.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * 종합적인 콘텐츠 검증
 */
export function validateContent(content: string): {
  isValid: boolean;
  errors: string[];
  filteredContent?: string;
} {
  const errors: string[] = [];

  // 길이 검증
  const lengthValidation = validateContentLength(content, 'comment');
  if (!lengthValidation.isValid && lengthValidation.error) {
    errors.push(lengthValidation.error);
  }

  // 부적절한 단어 검사
  if (containsInappropriateWords(content)) {
    errors.push('부적절한 표현이 포함되어 있습니다.');
  }

  // 스팸 패턴 검사
  if (containsSpamPatterns(content)) {
    errors.push('광고성 또는 스팸성 내용이 포함되어 있습니다.');
  }

  // 반복 문자 검사
  if (hasExcessiveRepetition(content)) {
    errors.push('과도한 반복 문자나 단어가 포함되어 있습니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    filteredContent: errors.length === 0 ? content.trim() : undefined,
  };
}

/**
 * 콘텐츠 필터링 (부적절한 단어 마스킹)
 */
export function filterContent(content: string): string {
  let filteredContent = content;

  // 부적절한 단어를 '*'로 마스킹
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const maskedWord = '*'.repeat(word.length);
    filteredContent = filteredContent.replace(regex, maskedWord);
  });

  // URL 제거
  filteredContent = filteredContent.replace(
    /https?:\/\/[^\s]+/gi,
    '[링크 제거됨]'
  );

  // 전화번호 마스킹
  filteredContent = filteredContent.replace(
    /\b\d{2,3}-\d{3,4}-\d{4}\b/g,
    '[전화번호 제거됨]'
  );

  return filteredContent.trim();
}

/**
 * 사용자 신뢰도 기반 검증 (향후 확장용)
 */
export function getUserTrustLevel(
  userRole: string,
  accountAge: number
): 'low' | 'medium' | 'high' {
  if (userRole === 'admin' || userRole === 'teacher') {
    return 'high';
  }

  if (userRole === 'coach' || accountAge > 30) {
    // 30일 이상
    return 'medium';
  }

  return 'low';
}

/**
 * 신뢰도 기반 콘텐츠 검증
 */
export function validateContentByTrustLevel(
  content: string,
  trustLevel: 'low' | 'medium' | 'high'
): { isValid: boolean; requiresReview: boolean; errors: string[] } {
  const baseValidation = validateContent(content);

  if (trustLevel === 'high') {
    // 높은 신뢰도 사용자는 기본 검증만
    return {
      isValid: baseValidation.isValid,
      requiresReview: false,
      errors: baseValidation.errors,
    };
  }

  if (trustLevel === 'low') {
    // 낮은 신뢰도 사용자는 더 엄격한 검증
    const additionalErrors: string[] = [];

    // 짧은 시간 내 많은 댓글 작성 방지 (클라이언트에서 처리)
    if (content.length > 200) {
      additionalErrors.push('새 사용자는 200자 이하로 댓글을 작성해주세요.');
    }

    return {
      isValid: baseValidation.isValid && additionalErrors.length === 0,
      requiresReview: !baseValidation.isValid || additionalErrors.length > 0,
      errors: [...baseValidation.errors, ...additionalErrors],
    };
  }

  // 중간 신뢰도
  return {
    isValid: baseValidation.isValid,
    requiresReview: !baseValidation.isValid,
    errors: baseValidation.errors,
  };
}
