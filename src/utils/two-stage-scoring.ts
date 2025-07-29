/**
 * 2단계 평가 시스템 점수 계산 유틸리티
 */

export type RatingLevel = '상' | '중' | '하';

// 점수 매핑 테이블
export const SCORE_MAPPING: Record<RatingLevel, Record<RatingLevel, number>> = {
  상: { 상: 9, 중: 8, 하: 7 },
  중: { 상: 6, 중: 5, 하: 4 },
  하: { 상: 3, 중: 2, 하: 1 },
};

/**
 * 2단계 선택을 최종 점수로 변환
 */
export function calculateTwoStageScore(
  stage1: RatingLevel,
  stage2: RatingLevel
): number {
  return SCORE_MAPPING[stage1][stage2];
}

/**
 * 점수를 2단계 선택으로 역변환
 */
export function scoreToStages(
  score: number
): { stage1: RatingLevel; stage2: RatingLevel } | null {
  for (const [stage1, stage2Map] of Object.entries(SCORE_MAPPING)) {
    for (const [stage2, mappedScore] of Object.entries(stage2Map)) {
      if (mappedScore === score) {
        return {
          stage1: stage1 as RatingLevel,
          stage2: stage2 as RatingLevel,
        };
      }
    }
  }
  return null;
}

/**
 * 점수 범위별 설명 반환
 */
export function getScoreDescription(score: number): string {
  if (score >= 8) return '매우 높음';
  if (score >= 7) return '높음';
  if (score >= 6) return '다소 높음';
  if (score >= 5) return '보통';
  if (score >= 4) return '다소 낮음';
  if (score >= 3) return '낮음';
  if (score >= 2) return '매우 낮음';
  return '극히 낮음';
}

/**
 * 점수 범위별 색상 반환 (Tailwind CSS 클래스)
 */
export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 7) return 'text-green-500';
  if (score >= 6) return 'text-blue-600';
  if (score >= 5) return 'text-blue-500';
  if (score >= 4) return 'text-yellow-600';
  if (score >= 3) return 'text-orange-500';
  if (score >= 2) return 'text-red-500';
  return 'text-red-600';
}

/**
 * 점수 범위별 배경색 반환 (Tailwind CSS 클래스)
 */
export function getScoreBackgroundColor(score: number): string {
  if (score >= 8) return 'bg-green-50 border-green-200';
  if (score >= 7) return 'bg-green-50 border-green-100';
  if (score >= 6) return 'bg-blue-50 border-blue-200';
  if (score >= 5) return 'bg-blue-50 border-blue-100';
  if (score >= 4) return 'bg-yellow-50 border-yellow-200';
  if (score >= 3) return 'bg-orange-50 border-orange-200';
  if (score >= 2) return 'bg-red-50 border-red-200';
  return 'bg-red-50 border-red-300';
}

/**
 * 여러 점수의 통계 계산
 */
export function calculateScoreStatistics(scores: number[]) {
  if (scores.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      standardDeviation: 0,
    };
  }

  const sortedScores = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const average = sum / scores.length;

  const median =
    scores.length % 2 === 0
      ? (sortedScores[scores.length / 2 - 1] +
          sortedScores[scores.length / 2]) /
        2
      : sortedScores[Math.floor(scores.length / 2)];

  const variance =
    scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) /
    scores.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    average: Math.round(average * 10) / 10,
    min: Math.min(...scores),
    max: Math.max(...scores),
    median: Math.round(median * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
  };
}

/**
 * 카테고리별 점수 분석
 */
export interface CategoryScore {
  category: string;
  scores: number[];
  average: number;
  count: number;
  min: number;
  max: number;
}

export function analyzeCategoryScores(
  responses: Array<{ score: number; category: string }>
): CategoryScore[] {
  const categoryMap = new Map<string, number[]>();

  // 카테고리별로 점수 그룹화
  responses.forEach(response => {
    if (!categoryMap.has(response.category)) {
      categoryMap.set(response.category, []);
    }
    categoryMap.get(response.category)!.push(response.score);
  });

  // 카테고리별 통계 계산
  return Array.from(categoryMap.entries()).map(([category, scores]) => ({
    category,
    scores,
    average:
      Math.round(
        (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10
      ) / 10,
    count: scores.length,
    min: Math.min(...scores),
    max: Math.max(...scores),
  }));
}

/**
 * 점수 분포 분석
 */
export function analyzeScoreDistribution(scores: number[]) {
  const distribution = {
    '매우 높음 (8-9점)': 0,
    '높음 (7점)': 0,
    '다소 높음 (6점)': 0,
    '보통 (5점)': 0,
    '다소 낮음 (4점)': 0,
    '낮음 (2-3점)': 0,
    '매우 낮음 (1점)': 0,
  };

  scores.forEach(score => {
    if (score >= 8) distribution['매우 높음 (8-9점)']++;
    else if (score === 7) distribution['높음 (7점)']++;
    else if (score === 6) distribution['다소 높음 (6점)']++;
    else if (score === 5) distribution['보통 (5점)']++;
    else if (score === 4) distribution['다소 낮음 (4점)']++;
    else if (score >= 2) distribution['낮음 (2-3점)']++;
    else distribution['매우 낮음 (1점)']++;
  });

  return distribution;
}

/**
 * 개선 우선순위 제안
 */
export function suggestImprovementPriorities(
  categoryScores: CategoryScore[],
  threshold: number = 5
): Array<{
  category: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}> {
  return categoryScores
    .map(categoryScore => {
      const { category, average, min } = categoryScore;

      if (average < 3) {
        return {
          category,
          priority: 'high' as const,
          reason: `평균 점수가 매우 낮음 (${average}점)`,
        };
      } else if (average < threshold) {
        return {
          category,
          priority: 'medium' as const,
          reason: `평균 점수가 기준 이하 (${average}점)`,
        };
      } else if (min < 3) {
        return {
          category,
          priority: 'medium' as const,
          reason: `일부 항목의 점수가 매우 낮음 (최저 ${min}점)`,
        };
      } else {
        return {
          category,
          priority: 'low' as const,
          reason: `전반적으로 양호한 수준 (평균 ${average}점)`,
        };
      }
    })
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}
