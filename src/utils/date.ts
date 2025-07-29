/**
 * 날짜 관련 유틸리티 함수들
 */

// 날짜를 한국어 형식으로 포맷팅
export const formatDate = (
  date: string | Date,
  format: "full" | "short" | "time" | "datetime" = "short",
): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return "잘못된 날짜";
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul",
  };

  switch (format) {
    case "full":
      options.year = "numeric";
      options.month = "long";
      options.day = "numeric";
      options.weekday = "long";
      break;
    case "short":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      break;
    case "time":
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
    case "datetime":
      options.year = "numeric";
      options.month = "2-digit";
      options.day = "2-digit";
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
  }

  return new Intl.DateTimeFormat("ko-KR", options).format(d);
};

// 상대적 시간 표시 (1분 전, 2시간 전 등)
export const getRelativeTime = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "방금 전";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}년 전`;
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 날짜 차이 계산 (일 단위)
export const getDaysDifference = (
  startDate: string | Date,
  endDate: string | Date,
): number => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const diffInTime = end.getTime() - start.getTime();
  return Math.ceil(diffInTime / (1000 * 3600 * 24));
};

// 나이 계산
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
