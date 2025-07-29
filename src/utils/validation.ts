/**
 * 검증 관련 유틸리티 함수들
 */

// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 유효성 검사 (최소 8자, 영문 + 숫자 포함)
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasLetter && hasNumber;
};

// 전화번호 유효성 검사 (한국 형식)
export const isValidPhoneNumber = (phone: string): boolean => {
  // 010-1234-5678, 01012345678, 010 1234 5678 등 허용
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

// 이름 유효성 검사 (한글, 영문 2-20자)
export const isValidName = (name: string): boolean => {
  if (name.length < 2 || name.length > 20) return false;

  const nameRegex = /^[가-힣a-zA-Z\s]+$/;
  return nameRegex.test(name);
};

// 점수 유효성 검사 (1-10 범위)
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 10;
};

// 빈 문자열 또는 공백만 있는지 검사
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

// 텍스트 길이 유효성 검사
export const isValidTextLength = (
  text: string,
  minLength: number = 1,
  maxLength: number = 1000,
): boolean => {
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
};

// URL 유효성 검사
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 생년월일 유효성 검사
export const isValidBirthDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();

  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) return false;

  // 미래 날짜가 아닌지 확인
  if (date > now) return false;

  // 150년 이전이 아닌지 확인
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 150);
  if (date < minDate) return false;

  return true;
};

// 복합 검증 결과 타입
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 사용자 등록 정보 종합 검증
export const validateUserRegistration = (data: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  birthDate?: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!isValidEmail(data.email)) {
    errors.push("올바른 이메일 주소를 입력해주세요.");
  }

  if (!isValidName(data.name)) {
    errors.push("이름은 2-20자의 한글 또는 영문으로 입력해주세요.");
  }

  if (!isValidPassword(data.password)) {
    errors.push("비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.");
  }

  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.push("올바른 전화번호 형식을 입력해주세요.");
  }

  if (data.birthDate && !isValidBirthDate(data.birthDate)) {
    errors.push("올바른 생년월일을 입력해주세요.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
