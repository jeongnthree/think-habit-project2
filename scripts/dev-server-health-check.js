#!/usr/bin/env node

/**
 * Next.js 개발 서버 상태 확인 및 문제 진단 스크립트
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🏥 Next.js 개발 서버 상태 확인 시작...\n');

// 1. 서버 연결 테스트
async function testServerConnection() {
  console.log('1️⃣ 서버 연결 테스트');

  return new Promise(resolve => {
    const req = http.get('http://localhost:3000', res => {
      console.log(`✅ 서버 응답: ${res.statusCode}`);
      console.log(`✅ Content-Type: ${res.headers['content-type']}`);

      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 서버 정상 작동');
          resolve(true);
        } else {
          console.log('⚠️ 서버 응답 이상');
          resolve(false);
        }
      });
    });

    req.on('error', error => {
      console.log('❌ 서버 연결 실패:', error.message);
      console.log('💡 개발 서버가 실행 중인지 확인하세요: npm run dev');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ 서버 응답 시간 초과');
      req.destroy();
      resolve(false);
    });
  });
}

// 2. API 엔드포인트 테스트
async function testAPIEndpoints() {
  console.log('\n2️⃣ API 엔드포인트 테스트');

  const endpoints = [
    '/api/upload/simple',
    '/api/upload/images',
    '/api/journals',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
      });

      console.log(`${endpoint}: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        console.log(`⚠️ ${endpoint} 엔드포인트가 존재하지 않습니다`);
      } else if (response.status >= 200 && response.status < 500) {
        console.log(`✅ ${endpoint} 엔드포인트 정상`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} 테스트 실패:`, error.message);
    }
  }
}

// 3. 정적 파일 테스트
async function testStaticFiles() {
  console.log('\n3️⃣ 정적 파일 테스트');

  const staticFiles = [
    '/_next/static/chunks/main-app.js',
    '/_next/static/chunks/app-pages-internals.js',
  ];

  for (const file of staticFiles) {
    try {
      const response = await fetch(`http://localhost:3000${file}`);

      if (response.ok) {
        console.log(`✅ ${file}: 정상`);
      } else {
        console.log(`❌ ${file}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${file} 테스트 실패:`, error.message);
    }
  }
}

// 4. 페이지 라우팅 테스트
async function testPageRoutes() {
  console.log('\n4️⃣ 페이지 라우팅 테스트');

  const routes = ['/', '/simple-test', '/test-upload', '/training'];

  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3000${route}`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.log(`✅ ${route}: 정상 (HTML)`);
        } else {
          console.log(`⚠️ ${route}: 응답 타입 이상 (${contentType})`);
        }
      } else {
        console.log(`❌ ${route}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${route} 테스트 실패:`, error.message);
    }
  }
}

// 5. 환경변수 확인
function checkEnvironmentVariables() {
  console.log('\n5️⃣ 환경변수 확인');

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  let allPresent = true;

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar}: 설정됨`);
    } else {
      console.log(`❌ ${envVar}: 누락`);
      allPresent = false;
    }
  });

  if (!allPresent) {
    console.log('💡 .env.local 파일을 확인하세요');
  }

  return allPresent;
}

// 6. 파일 시스템 확인
function checkFileSystem() {
  console.log('\n6️⃣ 파일 시스템 확인');

  const criticalFiles = [
    'next.config.ts',
    'tsconfig.json',
    'package.json',
    '.env.local',
    'src/app/layout.tsx',
    'src/app/page.tsx',
  ];

  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}: 존재`);
    } else {
      console.log(`❌ ${file}: 누락`);
    }
  });

  // .next 폴더 확인
  if (fs.existsSync('.next')) {
    console.log('✅ .next 폴더: 존재');

    // 빌드 파일 확인
    const buildFiles = ['.next/BUILD_ID', '.next/static', '.next/server'];

    buildFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}: 존재`);
      } else {
        console.log(`  ❌ ${file}: 누락`);
      }
    });
  } else {
    console.log('❌ .next 폴더: 누락 (빌드 필요)');
  }
}

// 7. 진단 결과 및 권장사항
function provideDiagnosisAndRecommendations(results) {
  console.log('\n📋 진단 결과 및 권장사항');
  console.log('='.repeat(50));

  const { serverOk, envVarsOk } = results;

  if (!serverOk) {
    console.log('🚨 서버 연결 문제');
    console.log('권장사항:');
    console.log('1. npm run dev 명령어로 개발 서버 시작');
    console.log('2. 포트 3000이 사용 중인지 확인');
    console.log('3. node scripts/fix-nextjs-build.js 실행');
    console.log('');
  }

  if (!envVarsOk) {
    console.log('🚨 환경변수 문제');
    console.log('권장사항:');
    console.log('1. .env.local 파일 확인');
    console.log('2. Supabase 키 설정 확인');
    console.log('');
  }

  console.log('🔧 일반적인 해결 방법:');
  console.log('1. 캐시 정리: rm -rf .next && npm run dev');
  console.log('2. 의존성 재설치: rm -rf node_modules && npm install');
  console.log('3. 빌드 문제 해결: node scripts/fix-nextjs-build.js');
  console.log('4. 포트 변경: npm run dev -- -p 3001');
  console.log('');
}

// 메인 실행 함수
async function main() {
  try {
    const serverOk = await testServerConnection();

    if (serverOk) {
      await testAPIEndpoints();
      await testStaticFiles();
      await testPageRoutes();
    }

    const envVarsOk = checkEnvironmentVariables();
    checkFileSystem();

    provideDiagnosisAndRecommendations({ serverOk, envVarsOk });

    console.log('🏁 상태 확인 완료');
  } catch (error) {
    console.error('❌ 상태 확인 중 오류:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };
