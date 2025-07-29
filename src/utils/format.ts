/**
 * 포맷팅 관련 유틸리티 함수들
 */

// 텍스트 자르기 (말줄임표 포함)
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

// 전화번호 포맷팅 (010-1234-5678)
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  return phone; // 형식이 맞지 않으면 원본 반환
};

// 숫자를 한국어 형식으로 포맷팅 (1,234)
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(num);
};

// 점수를 별점으로 변환
export const formatRatingToStars = (rating: number): string => {
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 === 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return "★".repeat(fullStars) + (halfStar ? "☆" : "") + "☆".repeat(emptyStars);
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 문자열을 URL 슬러그로 변환
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

// 첫 글자 대문자로 변환
export const capitalize = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// 사용자 역할을 한국어로 변환
export const formatUserRole = (role: number): string => {
  switch (role) {
    case 1:
      return "학습자";
    case 2:
      return "감독";
    case 3:
      return "관리자";
    default:
      return "알 수 없음";
  }
};

// 소속을 이모지와 함께 포맷팅
export const formatAffiliation = (affiliation?: string): string => {
  switch (affiliation) {
    case "개인":
      return "👤 개인";
    case "가족":
      return "👨‍👩‍👧‍👦 가족";
    case "단체":
      return "🏢 단체";
    case "과외":
      return "📚 과외";
    default:
      return "❓ 미정";
  }
};

// 진행률을 퍼센트로 표시
export const formatProgress = (current: number, total: number): string => {
  if (total === 0) return "0%";
  const percentage = Math.round((current / total) * 100);
  return `${percentage}%`;
};

// 평점을 색상과 함께 표시
export const formatRatingWithColor = (
  rating: number,
): { text: string; color: string } => {
  let color = "text-gray-500";
  let text = `${rating}/10`;

  if (rating >= 8) {
    color = "text-green-600";
    text = `🌟 ${rating}/10 (우수)`;
  } else if (rating >= 6) {
    color = "text-blue-600";
    text = `👍 ${rating}/10 (양호)`;
  } else if (rating >= 4) {
    color = "text-yellow-600";
    text = `⚠️ ${rating}/10 (보통)`;
  } else {
    color = "text-red-600";
    text = `⚡ ${rating}/10 (개선 필요)`;
  }

  return { text, color };
};
