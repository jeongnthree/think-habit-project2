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

export interface DiagnosticQuestion {
  id: string;
  text: string;
  category: string;
  type: 'two-stage' | 'scale' | 'multiple-choice';
  options?: string[];
  required: boolean;
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
