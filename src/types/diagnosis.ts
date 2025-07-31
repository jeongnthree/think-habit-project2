/**
 * 진단 시스템 관련 타입 정의
 */

export interface DiagnosticTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: number; // 분 단위
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TwoStageRatingConfig {
  stage1_labels: string[];
  stage2_labels: string[];
  final_scale: number;
  stage1_instruction?: string;
  stage2_instruction?: string;
}

export interface TwoStageResponse {
  stage1_value: number;
  stage2_value: number;
  final_score: number;
  stage1_label: string;
  stage2_label: string;
}

export interface DiagnosticQuestion {
  id: string;
  text: string;
  category: string;
  type: 'two-stage' | 'two_stage_rating' | 'scale' | 'multiple-choice' | 'boolean' | 'text';
  options?: string[];
  required: boolean;
  // two-stage rating 관련 속성
  two_stage_config?: TwoStageRatingConfig;
  // scale 관련 속성
  scale?: number;
  labels?: string[];
  // 공통 속성
  help_text?: string;
  section_title?: string;
}

export interface DiagnosticSession {
  id: string;
  templateId: string;
  userId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  responses: QuestionResponse[];
  results?: DiagnosticResults;
}

export interface QuestionResponse {
  questionId: string;
  questionText: string;
  score: number;
  category: string;
  stage1Choice?: 'high' | 'medium' | 'low';
  stage2Choice?: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface DiagnosticResults {
  overallScore: number;
  categoryScores: Record<
    string,
    {
      average: number;
      total: number;
      count: number;
    }
  >;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  completedAt: string;
}

export interface CurrentQuestion {
  id: string;
  text: string;
  category: string;
  type: 'two-stage' | 'two_stage_rating' | 'scale' | 'multiple-choice' | 'boolean' | 'text';
  options?: string[];
  required: boolean;
  two_stage_config?: TwoStageRatingConfig;
  scale?: number;
  labels?: string[];
  help_text?: string;
}
