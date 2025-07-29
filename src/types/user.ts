// Think-Habit Lite 사용자 타입 (간소화)

// 사용자 역할 정의
export type UserRole = "admin" | "teacher" | "coach" | "student";

// 사용자 기본 인터페이스
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

// 사용자 생성 요청 타입
export interface CreateUserRequest {
  email: string;
  name: string;
  role?: UserRole;
}

// 사용자 업데이트 요청 타입
export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
}

// 사용자 프로필 (공개 정보만)
export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
}
