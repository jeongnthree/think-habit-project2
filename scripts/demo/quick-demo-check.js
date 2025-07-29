// 빠른 시연 준비 상태 확인 스크립트
const BASE_URL = 'http://localhost:3000';
const JOURNAL_APP_URL = 'http://localhost:9002';

async function quickHealthCheck() {
  console.log('🚀 Think-Habit 프로젝트 시연 준비 상태 확인');
  console.log('='.repeat(60));

  const checks = [];

  // 1. 메인 웹사이트 상태
  console.log('\n1️⃣ 메인 웹사이트 상태 확인...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      console.log('✅ 메인 웹사이트 정상 작동');
      console.log(`   📊 데이터베이스: ${data.database}`);
      console.log(`   💾 메모리: ${data.memory.heapUsed}`);
      checks.push({ name: '메인 웹사이트', status: 'success' });
    } else {
      console.log('❌ 메인 웹사이트 상태 이상');
      checks.push({ name: '메인 웹사이트', status: 'failed' });
    }
  } catch (error) {
    console.log('❌ 메인 웹사이트 연결 실패');
    console.log('   💡 해결방법: npm run dev 실행');
    checks.push({
      name: '메인 웹사이트',
      status: 'failed',
      solution: 'npm run dev',
    });
  }

  // 2. 로그인 API 테스트
  console.log('\n2️⃣ 로그인 시스템 확인...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@think-habit.com',
        password: 'test123',
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 로그인 시스템 정상');
      console.log(`   👤 테스트 계정: ${data.user.name}`);
      checks.push({ name: '로그인 시스템', status: 'success' });
    } else {
      console.log('❌ 로그인 시스템 오류');
      checks.push({ name: '로그인 시스템', status: 'failed' });
    }
  } catch (error) {
    console.log('❌ 로그인 API 연결 실패');
    checks.push({ name: '로그인 시스템', status: 'failed' });
  }

  // 3. Journal App 상태 (선택적)
  console.log('\n3️⃣ Journal App 상태 확인...');
  try {
    const response = await fetch(JOURNAL_APP_URL, {
      method: 'GET',
      timeout: 3000,
    });

    if (response.ok) {
      console.log('✅ Journal App 웹 버전 실행 중');
      console.log(`   🌐 URL: ${JOURNAL_APP_URL}`);
      checks.push({ name: 'Journal App', status: 'success' });
    } else {
      console.log('⚠️  Journal App 응답 이상');
      checks.push({ name: 'Journal App', status: 'warning' });
    }
  } catch (error) {
    console.log('⚠️  Journal App 연결 실패 (정상 - 아직 실행 안 함)');
    console.log(
      '   💡 실행방법: cd think-habit-journal-app && npm run simple-web'
    );
    checks.push({
      name: 'Journal App',
      status: 'not-running',
      solution: 'cd think-habit-journal-app && npm run simple-web',
    });
  }

  // 4. 동기화 API 테스트
  console.log('\n4️⃣ 동기화 시스템 확인...');
  try {
    const testData = {
      journals: [
        {
          id: `quick-test-${Date.now()}`,
          title: '시연 준비 테스트',
          content: '시연 준비 상태 확인용 테스트 일지입니다.',
          category_id: 'test-cat',
          category_name: '테스트 카테고리',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: true,
          user_id: '8236e966-ba4c-46d8-9cda-19bc67ec305d',
          user_name: '시연 사용자',
          app_version: '1.0.0',
          sync_source: 'desktop_app',
        },
      ],
      user_token: '8236e966-ba4c-46d8-9cda-19bc67ec305d',
    };

    const response = await fetch(`${BASE_URL}/api/journals/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ 동기화 시스템 정상');
      console.log(
        `   📊 테스트 결과: ${data.summary.success}/${data.summary.total} 성공`
      );
      checks.push({ name: '동기화 시스템', status: 'success' });
    } else {
      console.log('❌ 동기화 시스템 오류');
      checks.push({ name: '동기화 시스템', status: 'failed' });
    }
  } catch (error) {
    console.log('❌ 동기화 API 연결 실패');
    checks.push({ name: '동기화 시스템', status: 'failed' });
  }

  return checks;
}

async function showDemoInstructions(checks) {
  console.log('\n📋 시연 준비 상태 요약');
  console.log('='.repeat(60));

  const successful = checks.filter(c => c.status === 'success');
  const failed = checks.filter(c => c.status === 'failed');
  const warnings = checks.filter(
    c => c.status === 'warning' || c.status === 'not-running'
  );

  console.log(`✅ 정상: ${successful.length}개`);
  console.log(`❌ 실패: ${failed.length}개`);
  console.log(`⚠️  주의: ${warnings.length}개`);

  if (failed.length > 0) {
    console.log('\n🔧 해결해야 할 문제들:');
    failed.forEach(check => {
      console.log(`   ❌ ${check.name}`);
      if (check.solution) {
        console.log(`      💡 해결방법: ${check.solution}`);
      }
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  선택적 실행 항목들:');
    warnings.forEach(check => {
      console.log(`   ⚠️  ${check.name}`);
      if (check.solution) {
        console.log(`      💡 실행방법: ${check.solution}`);
      }
    });
  }

  console.log('\n🎯 시연 단계별 가이드');
  console.log('='.repeat(60));

  if (successful.length >= 3) {
    console.log('🎉 시연 준비 완료! 다음 순서로 진행하세요:');
    console.log('');
    console.log('1️⃣ 메인 웹사이트 로그인');
    console.log('   URL: http://localhost:3000/login');
    console.log('   계정: test@think-habit.com / test123');
    console.log('');
    console.log('2️⃣ Journal App 실행 (선택사항)');
    console.log('   터미널: cd think-habit-journal-app && npm run simple-web');
    console.log('   URL: http://localhost:9002');
    console.log('');
    console.log('3️⃣ 동기화 테스트');
    console.log('   터미널: node test-journal-app-sync.js');
    console.log('');
    console.log('4️⃣ 커뮤니티 확인');
    console.log('   URL: http://localhost:3000/community');
    console.log('   확인사항: 🖥️ 데스크톱 일지들');
  } else {
    console.log('⚠️  시연 전 문제 해결이 필요합니다.');
    console.log('위의 실패한 항목들을 먼저 해결해주세요.');
  }

  console.log('\n📞 추가 도움말');
  console.log('='.repeat(60));
  console.log('📖 상세 가이드: DEMO_GUIDE.md 파일 참조');
  console.log('🧪 전체 테스트: node test-final-login.js');
  console.log('🔄 동기화 테스트: node test-sync-api-fixed.js');
  console.log('📱 Journal App 테스트: node test-journal-app-sync.js');
}

async function main() {
  const checks = await quickHealthCheck();
  await showDemoInstructions(checks);
}

main().catch(console.error);
