// 설문조사 응답 인터페이스
export interface Survey {
  id: string;
  user_id: string;
  goals: string;
  harmful_thinking_habits: string;
  self_info_building: SelfInfoBuilding;
  completed_at: string;
  created_at: string;
}

// 내정보만들기 세부 항목
export interface SelfInfoBuilding {
  value_assessment: number; // 가치 평가 (1-10점)
  logical_approach: number; // 논리적 접근 (1-10점)
  systematic_organization: number; // 체계적 정리 (1-10점)
  application_practice: number; // 적용과 응용 (1-10점)
}

// 설문조사 생성 요청
export interface CreateSurveyRequest {
  goals: string;
  harmful_thinking_habits: string;
  self_info_building: SelfInfoBuilding;
}

// 처방 인터페이스
export interface Prescription {
  id: string;
  user_id: string;
  survey_id: string;
  belief_change_theory: string; // 믿음바꾸기 이론
  connection_belief: string; // 연결 믿음
  model_thinking_form: string; // 모범 생각폼
  action_guidelines: string; // 행동지침
  prescribed_by: string; // 처방한 전문가 ID
  prescribed_at: string;
  updated_at: string;
}

// 처방 생성 요청
export interface CreatePrescriptionRequest {
  user_id: string;
  survey_id: string;
  belief_change_theory: string;
  connection_belief: string;
  model_thinking_form: string;
  action_guidelines: string;
}
