# Think-Habit3 개발 규칙

## 프로젝트 개요

**프로젝트명:** Think-Habit3  
**목적:** 생각습관 진단-처방-교육 플랫폼  
**기술스택:** Next.js 13+, TypeScript, Supabase, Tailwind CSS  
**회원유형:** 개인, 가족, 과외, 단체(학교, 학원, 직장, 군대)

## 핵심 아키텍처 규칙

### 데이터베이스 관련 규칙

- **스키마 수정 시 필수 동기화**
  - `database/schema.sql` 수정 시 반드시 `database/rls-policies.sql`, `database/indexes.sql` 검토 및 업데이트
  - `src/types/database.ts`의 타입 정의와 데이터베이스 스키마 완전 동기화 필수
  - 새 테이블 추가 시 반드시 RLS 정책과 인덱스 함께 정의

- **생각습관 5개 영역 고정 구조**
  - 영역: `cognitive`, `problem_solving`, `decision_making`, `social_emotional`, `strategic`
  - 카테고리 추가 시 반드시 이 5개 영역 중 하나에 할당
  - `thinking_categories` 테이블의 `category_domain` 필드는 열거형으로 고정

- **Supabase 클라이언트 접근 규칙**
  - 모든 데이터베이스 접근은 `src/lib/supabase.ts`를 통해서만 수행
  - 직접 Supabase 클라이언트 생성 금지
  - RLS 정책 우회 금지

### 회원 타입별 처리 규칙

- **회원 타입별 차별화**
  - 개인: 개인 훈련 일지, 자율 학습
  - 가족: 가족 구성원 연결, 상호 피드백
  - 과외: 1:1 또는 소그룹 지도, 개인별 맞춤
  - 단체: 대량 관리, 통계 및 분석 기능

- **권한 시스템**
  - 모든 권한 제어는 Supabase RLS 정책 기반
  - `user_profiles.role` 필드로 기본 권한 구분
  - 단체 회원의 경우 추가 권한 테이블 참조

- **UI/UX 차별화**
  - 회원 타입별 다른 대시보드 레이아웃
  - 단체 회원은 관리자 기능 추가 표시
  - 훈련 일지 양식 회원 타입별 맞춤화

### 컴포넌트 개발 규칙

- **컴포넌트 분류 및 배치**
  - 재사용 UI 컴포넌트: `src/components/ui/`
  - 기능별 컴포넌트: `src/components/[기능명]/`
  - 레이아웃 컴포넌트: `src/components/layout/`
  - 관리자 전용: `src/components/admin/`

- **컴포넌트 작성 규칙**
  - 모든 컴포넌트는 TypeScript로 작성
  - Tailwind CSS 클래스만 사용, 커스텀 CSS 금지
  - Props는 interface로 명시적 타입 정의
  - 기본 export 사용 권장

- **훈련 일지 컴포넌트 특별 규칙**
  - `src/components/training/` 하위에 배치
  - 앱용과 위젯용 컴포넌트 분리
  - 템플릿 기반 렌더링 시스템 사용

### API 및 라우팅 규칙

- **Next.js App Router 준수**
  - 모든 페이지는 `src/app/` 디렉토리 구조 따름
  - API 라우트는 `src/app/api/` 하위에 배치
  - 동적 라우팅은 대괄호 폴더명 사용

- **인증 및 보안**
  - 인증이 필요한 페이지는 `middleware.ts`에서 보호
  - API 라우트에서 사용자 인증 상태 반드시 확인
  - 관리자 전용 API는 추가 권한 검증

- **API 응답 형식 통일**
  - 성공: `{ success: true, data: any }`
  - 실패: `{ success: false, error: string }`
  - 페이지네이션: `{ data: any[], total: number, page: number }`

### 타입 시스템 규칙

- **타입 정의 계층구조**
  - 데이터베이스 타입: `src/types/database.ts`
  - 비즈니스 로직 타입: `src/types/[도메인].ts`
  - API 타입: `src/types/api.ts`
  - UI 타입: 각 컴포넌트 파일 내부

- **타입 명명 규칙**
  - 인터페이스: PascalCase (예: `UserProfile`)
  - 열거형: PascalCase (예: `ThinkingArea`)
  - 타입 별칭: PascalCase (예: `DatabaseRow`)

### 파일 구조 및 명명 규칙

- **페이지 파일 구조**
  - 인증 페이지: `src/app/(auth)/`
  - 관리자 페이지: `src/app/(expert)/admin/`
  - 일반 사용자 페이지: `src/app/` 루트

- **컴포넌트 파일 명명**
  - 컴포넌트 파일: PascalCase.tsx
  - 유틸리티: camelCase.ts
  - 상수: UPPER_SNAKE_CASE.ts

## 개발 워크플로우 규칙

### 기능 개발 순서

1. **데이터베이스 스키마 정의**
   - `database/schema.sql` 테이블 구조 정의
   - `database/rls-policies.sql` 보안 정책 추가
   - `database/indexes.sql` 성능 최적화

2. **타입 정의**
   - `src/types/database.ts` 데이터베이스 타입 동기화
   - 비즈니스 로직용 타입 추가 정의

3. **API 라우트 구현**
   - 인증 및 권한 검증 로직 포함
   - 에러 처리 및 응답 형식 준수

4. **컴포넌트 개발**
   - UI 컴포넌트부터 구현
   - 기능별 컴포넌트 조합

5. **페이지 통합**
   - 라우팅 및 레이아웃 적용
   - 사용자 경험 최적화

### 코드 리뷰 체크포인트

- **보안 검증**
  - RLS 정책 적용 확인
  - 사용자 입력 검증 구현
  - 권한 체크 로직 포함

- **성능 최적화**
  - 데이터베이스 쿼리 최적화
  - 컴포넌트 메모이제이션 적용
  - 이미지 및 파일 최적화

- **코드 품질**
  - TypeScript 에러 제로
  - ESLint 규칙 준수
  - 적절한 에러 처리

## 금지 사항

### 절대 금지

- **데이터베이스 직접 접근**
  - Supabase 클라이언트 직접 생성
  - RLS 정책 우회 시도
  - 하드코딩된 SQL 쿼리

- **보안 취약점**
  - 클라이언트에서 민감 정보 노출
  - 인증 없는 API 접근 허용
  - XSS, SQL Injection 가능성 있는 코드

- **아키텍처 위반**
  - 컴포넌트 간 직접 상태 공유
  - 비즈니스 로직을 UI 컴포넌트에 포함
  - 타입 정의 없는 any 사용

### 주의 사항

- **회원 타입 혼동**
  - 단체 회원용 기능을 개인 회원에게 노출
  - 권한 없는 사용자의 관리 기능 접근
  - 회원 타입별 데이터 격리 위반

- **성능 저하 요인**
  - N+1 쿼리 문제
  - 불필요한 리렌더링
  - 대용량 데이터 일괄 로드

## 특별 지침

### 훈련 일지 시스템

- **앱/위젯 구분**
  - 앱: 개인 회원용 전체 기능
  - 위젯: 단체 회원용 임베드 가능한 최소 기능
  - 공통 로직은 별도 훅으로 분리

- **템플릿 시스템**
  - 동적 템플릿 렌더링 지원
  - JSONB 기반 유연한 필드 구조
  - 회원 타입별 템플릿 차별화

### 커뮤니티 기능

- **자동 공유 시스템**
  - 사용자 설정 기반 자동 공유
  - 프라이버시 보호 우선
  - 단체 회원 내부 공유 지원

- **피드백 시스템**
  - 코치/감독 역할 구분
  - 실시간 알림 시스템
  - 평가 기준 표준화

### 관리자 기능

- **대량 데이터 처리**
  - 배치 처리 시스템 활용
  - 진행 상황 표시
  - 에러 복구 메커니즘

- **통계 및 분석**
  - 실시간 대시보드
  - 데이터 시각화
  - 내보내기 기능 지원
