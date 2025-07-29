#!/usr/bin/env node

/**
 * Next.js 빌드 문제 해결 스크립트
 * 워크스페이스 환경에서 발생하는 빌드 문제를 체계적으로 해결
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Next.js 빌드 문제 해결 시작...\n');

// 1. 환경 정보 수집
function checkEnvironment() {
  console.log('1️⃣ 환경 정보 확인');

  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

    console.log(`✅ Node.js: ${nodeVersion}`);
    console.log(`✅ npm: ${npmVersion}`);

    // Next.js 버전 확인
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Next.js: ${packageJson.dependencies.next}`);
    console.log(`✅ React: ${packageJson.dependencies.react}`);

    // 워크스페이스 확인
    if (packageJson.workspaces) {
      console.log(`✅ 워크스페이스: ${packageJson.workspaces.length}개`);
    }
  } catch (error) {
    console.error('❌ 환경 정보 확인 실패:', error.message);
  }

  console.log('');
}

// 2. 캐시 및 빌드 파일 정리
function cleanBuildFiles() {
  console.log('2️⃣ 캐시 및 빌드 파일 정리');

  const filesToClean = [
    '.next',
    'out',
    'dist',
    '.turbo',
    'node_modules/.cache',
  ];

  filesToClean.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        execSync(`rm -rf ${file}`, { stdio: 'inherit' });
        console.log(`✅ ${file} 삭제 완료`);
      } catch (error) {
        console.log(`⚠️ ${file} 삭제 실패: ${error.message}`);
      }
    } else {
      console.log(`ℹ️ ${file} 없음`);
    }
  });

  console.log('');
}

// 3. 의존성 문제 해결
function fixDependencies() {
  console.log('3️⃣ 의존성 문제 해결');

  try {
    // package-lock.json 삭제
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
      console.log('✅ package-lock.json 삭제');
    }

    // node_modules 삭제
    if (fs.existsSync('node_modules')) {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
      console.log('✅ node_modules 삭제');
    }

    // 의존성 재설치
    console.log('📦 의존성 재설치 중...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ 의존성 재설치 완료');
  } catch (error) {
    console.error('❌ 의존성 해결 실패:', error.message);
  }

  console.log('');
}

// 4. Next.js 설정 검증
function validateNextConfig() {
  console.log('4️⃣ Next.js 설정 검증');

  try {
    // next.config.ts 존재 확인
    if (fs.existsSync('next.config.ts')) {
      console.log('✅ next.config.ts 존재');

      // 설정 파일 구문 검사
      try {
        require('./next.config.ts');
        console.log('✅ next.config.ts 구문 정상');
      } catch (error) {
        console.error('❌ next.config.ts 구문 오류:', error.message);
      }
    }

    // tsconfig.json 검증
    if (fs.existsSync('tsconfig.json')) {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      console.log('✅ tsconfig.json 존재');

      // 필수 설정 확인
      const requiredPaths = ['@/*'];
      const hasRequiredPaths = requiredPaths.every(
        path => tsconfig.compilerOptions?.paths?.[path]
      );

      if (hasRequiredPaths) {
        console.log('✅ TypeScript 경로 별칭 설정 정상');
      } else {
        console.log('⚠️ TypeScript 경로 별칭 설정 확인 필요');
      }
    }
  } catch (error) {
    console.error('❌ 설정 검증 실패:', error.message);
  }

  console.log('');
}

// 5. 포트 충돌 확인
function checkPortConflict() {
  console.log('5️⃣ 포트 충돌 확인');

  try {
    // 3000 포트 사용 중인 프로세스 확인
    const result = execSync('lsof -ti:3000 || echo "포트 사용 안함"', {
      encoding: 'utf8',
    });

    if (result.trim() === '포트 사용 안함') {
      console.log('✅ 포트 3000 사용 가능');
    } else {
      console.log('⚠️ 포트 3000 사용 중인 프로세스:', result.trim());
      console.log('💡 기존 프로세스를 종료하거나 다른 포트를 사용하세요');
    }
  } catch (error) {
    console.log('ℹ️ 포트 확인 불가 (Windows 환경일 수 있음)');
  }

  console.log('');
}

// 6. 빌드 테스트
function testBuild() {
  console.log('6️⃣ 빌드 테스트');

  try {
    console.log('🔨 Next.js 빌드 테스트 중...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ 빌드 성공');

    // 빌드 결과물 확인
    if (fs.existsSync('.next')) {
      console.log('✅ .next 폴더 생성됨');
    }
  } catch (error) {
    console.error('❌ 빌드 실패:', error.message);
    console.log('💡 빌드 오류를 확인하고 수정이 필요합니다');
  }

  console.log('');
}

// 7. 개발 서버 시작 가이드
function startDevServer() {
  console.log('7️⃣ 개발 서버 시작 가이드');

  console.log('다음 명령어로 개발 서버를 시작하세요:');
  console.log('');
  console.log('  npm run dev');
  console.log('');
  console.log('서버가 시작되면 다음 URL에서 테스트하세요:');
  console.log('  - 메인 페이지: http://localhost:3000');
  console.log('  - 간단한 업로드 테스트: http://localhost:3000/simple-test');
  console.log('  - HTML 테스트 파일: ./test-upload.html');
  console.log('');
}

// 메인 실행 함수
async function main() {
  try {
    checkEnvironment();
    cleanBuildFiles();
    fixDependencies();
    validateNextConfig();
    checkPortConflict();
    testBuild();
    startDevServer();

    console.log('🎉 Next.js 빌드 문제 해결 완료!');
    console.log('');
    console.log('문제가 지속되면 다음을 확인하세요:');
    console.log('1. Node.js 버전 (권장: 18.17.0 이상)');
    console.log('2. 워크스페이스 설정');
    console.log('3. 환경변수 설정 (.env.local)');
    console.log('4. TypeScript 오류');
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };
