// lib/journal-type-utils.ts
// Journal 타입 선택과 관련된 유틸리티 함수들

import { JournalType } from "@/shared/types";

/**
 * Journal 타입에 따른 메타데이터
 */
export const JOURNAL_TYPE_METADATA = {
  structured: {
    title: "구조화된 일지",
    shortTitle: "구조화",
    description:
      "할 일 목록 형태로 체계적인 훈련 계획을 세우고 진행상황을 추적",
    emoji: "📋",
    color: "blue",
    features: [
      "할 일 체크리스트",
      "실시간 진행률 계산",
      "우선순위 설정",
      "자동 저장 기능",
      "노트 작성 영역",
    ],
    benefits: [
      "목표 달성률 향상",
      "체계적인 계획 수립",
      "진행상황 명확한 파악",
      "습관 형성에 효과적",
    ],
    idealFor: [
      "체계적인 학습을 선호하는 분",
      "목표 지향적인 분",
      "진행상황을 추적하고 싶은 분",
      "할 일 관리가 필요한 분",
    ],
  },
  photo: {
    title: "사진 일지",
    shortTitle: "사진",
    description:
      "이미지와 함께 생생한 훈련 경험을 기록하고 시각적으로 성장을 확인",
    emoji: "📸",
    color: "purple",
    features: [
      "다중 사진 업로드",
      "사진별 캡션 추가",
      "태그 및 위치 정보",
      "자동 이미지 압축",
      "드래그 & 드롭 지원",
    ],
    benefits: [
      "시각적 기록 보관",
      "동기부여 향상",
      "성취감 극대화",
      "생생한 경험 공유",
    ],
    idealFor: [
      "시각적 기록을 선호하는 분",
      "사진으로 추억을 남기고 싶은 분",
      "운동이나 활동 기록이 필요한 분",
      "SNS 공유를 고려하는 분",
    ],
  },
} as const;

/**
 * Journal 타입의 메타데이터 가져오기
 */
export function getJournalTypeMetadata(type: JournalType) {
  return JOURNAL_TYPE_METADATA[type];
}

/**
 * Journal 타입에 따른 라우팅 경로 생성
 */
export function getJournalTypeRoute(
  type: JournalType,
  action: "new" | "edit" = "new",
  id?: string,
) {
  const basePath = "/journal";

  switch (action) {
    case "new":
      return `${basePath}/new?type=${type}`;
    case "edit":
      return id ? `${basePath}/${id}/edit` : `${basePath}/edit`;
    default:
      return basePath;
  }
}

/**
 * Journal 타입 검증
 */
export function isValidJournalType(type: string): type is JournalType {
  return ["structured", "photo"].includes(type);
}

/**
 * 사용자 선호도에 따른 추천 타입 계산
 */
export function getRecommendedJournalType(userPreferences: {
  visualLearner?: boolean;
  goalOriented?: boolean;
  likesPhotography?: boolean;
  needsStructure?: boolean;
}): JournalType {
  const {
    visualLearner = false,
    goalOriented = false,
    likesPhotography = false,
    needsStructure = false,
  } = userPreferences;

  // 점수 계산
  let structuredScore = 0;
  let photoScore = 0;

  if (goalOriented) structuredScore += 2;
  if (needsStructure) structuredScore += 2;
  if (visualLearner) photoScore += 1;
  if (likesPhotography) photoScore += 2;
  if (visualLearner) photoScore += 1;

  return structuredScore >= photoScore ? "structured" : "photo";
}

/**
 * Journal 타입 변환 유틸리티
 */
export function convertJournalType(
  content: any,
  fromType: JournalType,
  toType: JournalType,
) {
  if (fromType === toType) return content;

  if (fromType === "structured" && toType === "photo") {
    // 구조화된 → 사진 일지
    return {
      photos: [],
      description: content.notes || "",
      tags: content.tasks?.map((task: any) => task.text.substring(0, 20)) || [],
      location: "",
      mood: "neutral" as const,
    };
  }

  if (fromType === "photo" && toType === "structured") {
    // 사진 → 구조화된 일지
    return {
      tasks:
        content.tags?.map((tag: string, index: number) => ({
          id: `converted_${index}`,
          text: tag,
          completed: false,
          priority: "medium" as const,
          createdAt: new Date(),
        })) || [],
      notes: content.description || "",
      completionRate: 0,
      totalTasks: content.tags?.length || 0,
      completedTasks: 0,
    };
  }

  return content;
}

/**
 * Journal 타입별 템플릿 생성
 */
export function createJournalTemplate(type: JournalType) {
  const baseTemplate = {
    id: "",
    userId: "",
    type,
    title: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    syncStatus: "local" as const,
    version: 1,
  };

  if (type === "structured") {
    return {
      ...baseTemplate,
      content: {
        tasks: [],
        notes: "",
        completionRate: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
    };
  } else {
    return {
      ...baseTemplate,
      content: {
        photos: [],
        description: "",
        tags: [],
        location: "",
        mood: "neutral" as const,
      },
    };
  }
}

/**
 * Journal 타입별 기본 제목 생성
 */
export function generateDefaultTitle(
  type: JournalType,
  date: Date = new Date(),
): string {
  const dateStr = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (type === "structured") {
    return `${dateStr} 훈련 계획`;
  } else {
    return `${dateStr} ${timeStr} 훈련 기록`;
  }
}

/**
 * Journal 타입별 유효성 검사
 */
export function validateJournalTypeContent(
  type: JournalType,
  content: any,
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (type === "structured") {
    if (!content.tasks || !Array.isArray(content.tasks)) {
      errors.push("할 일 목록이 필요합니다");
    }
    if (typeof content.notes !== "string") {
      errors.push("노트는 문자열이어야 합니다");
    }
    if (content.tasks && content.tasks.length === 0) {
      errors.push("최소 1개의 할 일을 추가해주세요");
    }
  } else if (type === "photo") {
    if (!content.photos || !Array.isArray(content.photos)) {
      errors.push("사진 목록이 필요합니다");
    }
    if (typeof content.description !== "string") {
      errors.push("설명은 문자열이어야 합니다");
    }
    if (content.photos && content.photos.length === 0) {
      errors.push("최소 1장의 사진을 추가해주세요");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
