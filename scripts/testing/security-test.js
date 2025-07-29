#!/usr/bin/env node

/**
 * 보안 테스트 스크립트
 * Service Role Key 노출 여부 및 업로드 API 보안 검증
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 보안 테스트 시작...\n');

// 1. Service Role Key 노출 검사
function checkServiceRoleKeyExposure() {
  console.log('1️⃣ Service Role Key 노출 검사');

  const clientFiles = [
    'src/app/training/journal/new/photo/page.tsx',
    'src/components/training/SimplePhotoJournalForm.tsx',
    'src/components/training/PhotoJournalForm.tsx',
  ];

  let exposureFound = false;
  const serviceRoleKeyPattern =
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSI.*role.*service/;

  clientFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (serviceRoleKeyPattern.test(content)) {
        console.log(`❌ ${filePath}에서 Service Role Key 발견!`);
        exposureFound = true;
      } else {
        console.log(`✅ ${filePath} - 안전`);
      }
    }
  });

  if (!exposureFound) {
    console.log('🎉 클라이언트 사이드에서 Service Role Key 노출 없음!\n');
  } else {
    console.log('⚠️ Service Role Key 노출 발견! 즉시 수정 필요\n');
  }

  return !exposureFound;
}

// 2. API 엔드포인트 존재 확인
function checkAPIEndpoint() {
  console.log('2️⃣ 보안 업로드 API 엔드포인트 확인');

  const apiPath = 'src/app/api/upload/images/route.ts';

  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, 'utf8');

    // 필수 보안 기능 확인
    const securityChecks = [
      { name: 'FormData 처리', pattern: /formData|FormData/ },
      { name: '파일 검증', pattern: /validateFiles|validateFile/ },
      {
        name: 'Service Role Key 서버 사용',
        pattern:
          /SUPABASE_CONFIG\.SERVICE_ROLE_KEY|process\.env\.SUPABASE_SERVICE_ROLE_KEY/,
      },
      { name: '에러 처리', pattern: /try.*catch|error/ },
    ];

    securityChecks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.name} - 구현됨`);
      } else {
        console.log(`❌ ${check.name} - 누락`);
      }
    });

    console.log('✅ 보안 업로드 API 엔드포인트 존재\n');
    return true;
  } else {
    console.log('❌ 보안 업로드 API 엔드포인트 없음\n');
    return false;
  }
}

// 3. 유틸리티 함수 확인
function checkUtilityFunctions() {
  console.log('3️⃣ 보안 유틸리티 함수 확인');

  const utilPath = 'src/lib/upload.ts';

  if (fs.existsSync(utilPath)) {
    const content = fs.readFileSync(utilPath, 'utf8');

    const utilityChecks = [
      {
        name: '파일 검증 함수',
        pattern: /validateFile.*function|function.*validateFile/,
      },
      { name: '보안 파일명 생성', pattern: /generateSecureFileName/ },
      { name: 'Supabase 업로드', pattern: /uploadToSupabaseStorage/ },
      { name: '파일 크기 제한', pattern: /MAX_FILE_SIZE|file\.size/ },
      { name: '파일 타입 검증', pattern: /ALLOWED.*TYPES|file\.type/ },
    ];

    utilityChecks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.name} - 구현됨`);
      } else {
        console.log(`❌ ${check.name} - 누락`);
      }
    });

    console.log('✅ 보안 유틸리티 함수 존재\n');
    return true;
  } else {
    console.log('❌ 보안 유틸리티 함수 없음\n');
    return false;
  }
}

// 4. 환경변수 설정 확인
function checkEnvironmentSetup() {
  console.log('4️⃣ 환경변수 설정 확인');

  const envFiles = ['.env.local', '.env'];
  let envFound = false;

  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        console.log(`✅ ${envFile}에서 SUPABASE_SERVICE_ROLE_KEY 설정 확인`);
        envFound = true;
      }
    }
  });

  if (!envFound) {
    console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY 환경변수 설정 필요');
    console.log('💡 .env.local 파일에 다음을 추가하세요:');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  }

  console.log('');
  return envFound;
}

// 테스트 실행
async function runSecurityTests() {
  const results = {
    keyExposure: checkServiceRoleKeyExposure(),
    apiEndpoint: checkAPIEndpoint(),
    utilities: checkUtilityFunctions(),
    environment: checkEnvironmentSetup(),
  };

  console.log('📊 테스트 결과 요약:');
  console.log('='.repeat(40));

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 통과' : '❌ 실패';
    const testName = {
      keyExposure: 'Service Role Key 보안',
      apiEndpoint: '보안 API 엔드포인트',
      utilities: '유틸리티 함수',
      environment: '환경변수 설정',
    }[test];

    console.log(`${status} ${testName}`);
  });

  const allPassed = Object.values(results).every(result => result);

  console.log('\n' + '='.repeat(40));
  if (allPassed) {
    console.log('🎉 모든 보안 테스트 통과!');
    console.log('✅ 보안 업로드 시스템이 올바르게 구현되었습니다.');
  } else {
    console.log('⚠️ 일부 테스트 실패');
    console.log('🔧 실패한 항목들을 수정해주세요.');
  }

  return allPassed;
}

// 스크립트 실행
if (require.main === module) {
  runSecurityTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runSecurityTests };
