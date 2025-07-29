/**
 * Think-Habit 부족한 기능 및 개선사항 점검
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Think-Habit 부족한 기능 점검');
console.log('='.repeat(50));

// 파일 존재 여부 확인 함수
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

// 폴더 내 파일 개수 확인
function countFiles(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const items = fs.readdirSync(dirPath);
    return items.filter(item => {
      const itemPath = path.join(dirPath, item);
      return fs.statSync(itemPath).isFile();
    }).length;
  } catch (error) {
    return 0;
  }
}

console.log('\n🩺 Diagnosis 시스템 상태:');
console.log('-'.repeat(30));

// Diagnosis 페이지들 확인
const diagnosisPages = [
  ['src/app/diagnosis/page.tsx', '메인 진단 페이지'],
  ['src/app/diagnosis/two-stage/page.tsx', '2단계 진단 페이지'],
  ['src/app/diagnosis/start/[templateId]/page.tsx', '진단 시작 페이지'],
  ['src/app/diagnosis/session/[id]/page.tsx', '진단 세션 페이지'],
  ['src/app/diagnosis/results/[id]/page.tsx', '진단 결과 페이지'],
  ['src/app/diagnosis/preview/[templateId]/page.tsx', '진단 미리보기 페이지'],
];

let diagnosisPageCount = 0;
diagnosisPages.forEach(([path, desc]) => {
  if (checkFile(path, desc)) diagnosisPageCount++;
});

// Diagnosis API 확인
console.log('\n🔌 Diagnosis API 상태:');
console.log('-'.repeat(30));

const diagnosisApis = [
  ['src/app/api/diagnosis/templates/route.ts', '진단 템플릿 API'],
  ['src/app/api/diagnosis/sessions/route.ts', '진단 세션 API'],
  ['src/app/api/diagnosis/sessions/[sessionId]/route.ts', '개별 세션 API'],
];

let diagnosisApiCount = 0;
diagnosisApis.forEach(([path, desc]) => {
  if (checkFile(path, desc)) diagnosisApiCount++;
});

console.log('\n📊 기타 중요 기능 확인:');
console.log('-'.repeat(30));

// 기타 중요 기능들
const otherFeatures = [
  ['src/components/diagnosis', '진단 컴포넌트'],
  ['src/app/admin/page.tsx', '관리자 페이지'],
  ['src/app/notifications/page.tsx', '알림 페이지'],
  ['src/components/layout/Header.tsx', '헤더 컴포넌트'],
  ['src/components/layout/Footer.tsx', '푸터 컴포넌트'],
];

let otherFeatureCount = 0;
otherFeatures.forEach(([path, desc]) => {
  if (checkFile(path, desc)) otherFeatureCount++;
});

// 네비게이션 메뉴 확인
console.log('\n🧭 네비게이션 메뉴 확인:');
console.log('-'.repeat(30));

try {
  const headerPath = 'src/components/layout/Header.tsx';
  if (fs.existsSync(headerPath)) {
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    const hasDiagnosisMenu =
      headerContent.includes('diagnosis') || headerContent.includes('진단');
    console.log(`${hasDiagnosisMenu ? '✅' : '❌'} 헤더에 진단 메뉴 포함`);
  }
} catch (error) {
  console.log('❌ 헤더 파일 읽기 실패');
}

console.log('\n📋 부족한 기능 분석:');
console.log('='.repeat(50));

console.log('\n🩺 Diagnosis 시스템:');
console.log(`- 페이지: ${diagnosisPageCount}/6 완성`);
console.log(`- API: ${diagnosisApiCount}/3 완성`);

if (diagnosisPageCount < 6) {
  console.log('⚠️ 일부 진단 페이지가 누락되었습니다.');
}

if (diagnosisApiCount < 3) {
  console.log('⚠️ 일부 진단 API가 누락되었습니다.');
}

console.log('\n🔧 개선 필요 사항:');
console.log('1. 진단 시스템 페이지 완성');
console.log('2. 진단 API 구현 완료');
console.log('3. 네비게이션 메뉴에 진단 추가');
console.log('4. 진단 컴포넌트 개발');
console.log('5. 사용자 권한 체계 연동');

console.log('\n🎯 우선순위 권장:');
console.log('1. 높음: 진단 시스템 기본 구조 완성');
console.log('2. 중간: 네비게이션 통합');
console.log('3. 낮음: 고급 기능 추가');

console.log('\n💡 다음 단계 제안:');
console.log('- 진단 시스템의 핵심 페이지부터 구현');
console.log('- 기존 시스템과의 통합 테스트');
console.log('- 사용자 경험 최적화');
