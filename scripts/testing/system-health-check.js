/**
 * Think-Habit 시스템 전체 기능 테스트
 * 정리 후 모든 핵심 기능이 정상 작동하는지 확인
 */

const https = require('https');
const http = require('http');

class SystemHealthChecker {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  // HTTP 요청 헬퍼
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.request(url, options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  // 테스트 결과 기록
  recordTest(name, passed, message = '') {
    this.results.tests.push({ name, passed, message });
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${name}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }

  // 1. 기본 서버 상태 확인
  async testServerHealth() {
    console.log('\n🏥 서버 상태 확인');
    console.log('-'.repeat(30));

    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/health`);
      this.recordTest(
        '서버 응답',
        response.status === 200,
        `Status: ${response.status}`
      );
    } catch (error) {
      this.recordTest('서버 응답', false, error.message);
    }
  }

  // 2. 메인 페이지 로딩 확인
  async testMainPages() {
    console.log('\n📄 주요 페이지 로딩 확인');
    console.log('-'.repeat(30));

    const pages = [
      { path: '/', name: '메인 페이지' },
      { path: '/login', name: '로그인 페이지' },
      { path: '/about', name: '소개 페이지' },
      { path: '/community', name: '커뮤니티 페이지' },
    ];

    for (const page of pages) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${page.path}`);
        const isSuccess = response.status === 200;
        this.recordTest(page.name, isSuccess, `Status: ${response.status}`);
      } catch (error) {
        this.recordTest(page.name, false, error.message);
      }
    }
  }

  // 3. API 엔드포인트 확인
  async testApiEndpoints() {
    console.log('\n🔌 API 엔드포인트 확인');
    console.log('-'.repeat(30));

    const apis = [
      { path: '/api/categories', name: '카테고리 API' },
      { path: '/api/community/journals', name: '커뮤니티 일지 API' },
      { path: '/api/dashboard', name: '대시보드 API' },
    ];

    for (const api of apis) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${api.path}`);
        const isSuccess = response.status === 200 || response.status === 401; // 401은 인증 필요로 정상
        this.recordTest(api.name, isSuccess, `Status: ${response.status}`);
      } catch (error) {
        this.recordTest(api.name, false, error.message);
      }
    }
  }

  // 4. 동기화 API 테스트
  async testSyncApi() {
    console.log('\n🔄 동기화 API 테스트');
    console.log('-'.repeat(30));

    try {
      const testData = {
        journals: [
          {
            id: 'health-check-' + Date.now(),
            title: '시스템 헬스체크 테스트',
            content: '정리 후 동기화 기능 테스트',
            category_id: 'test-category',
            category_name: '테스트',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_public: false,
            user_id: 'test-user',
            user_name: '테스트 사용자',
            app_version: '1.0.0',
            sync_source: 'desktop_app',
          },
        ],
        user_token: 'test-token',
      };

      const response = await this.makeRequest(
        `${this.baseUrl}/api/journals/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        }
      );

      const isSuccess = response.status === 200 || response.status === 401;
      this.recordTest('동기화 API', isSuccess, `Status: ${response.status}`);
    } catch (error) {
      this.recordTest('동기화 API', false, error.message);
    }
  }

  // 5. 이미지 동기화 확인
  async testImageSync() {
    console.log('\n🖼️ 이미지 동기화 확인');
    console.log('-'.repeat(30));

    try {
      // 커뮤니티에서 이미지가 포함된 일지 확인
      const response = await this.makeRequest(
        `${this.baseUrl}/api/community/journals?limit=5`
      );

      if (response.status === 200) {
        const data = JSON.parse(response.data);
        const hasImageJournals =
          data.data &&
          data.data.some(
            journal => journal.attachments && journal.attachments.length > 0
          );

        this.recordTest(
          '이미지 동기화 데이터',
          hasImageJournals,
          hasImageJournals ? '이미지 포함 일지 발견' : '이미지 포함 일지 없음'
        );
      } else {
        this.recordTest(
          '이미지 동기화 데이터',
          false,
          `API 호출 실패: ${response.status}`
        );
      }
    } catch (error) {
      this.recordTest('이미지 동기화 데이터', false, error.message);
    }
  }

  // 6. 데이터베이스 연결 확인
  async testDatabaseConnection() {
    console.log('\n🗄️ 데이터베이스 연결 확인');
    console.log('-'.repeat(30));

    try {
      // 카테고리 API를 통해 DB 연결 확인
      const response = await this.makeRequest(`${this.baseUrl}/api/categories`);
      const isConnected = response.status === 200;
      this.recordTest(
        '데이터베이스 연결',
        isConnected,
        `Status: ${response.status}`
      );
    } catch (error) {
      this.recordTest('데이터베이스 연결', false, error.message);
    }
  }

  // 전체 테스트 실행
  async runAllTests() {
    console.log('🔍 Think-Habit 시스템 헬스체크');
    console.log('='.repeat(50));
    console.log('📅 테스트 시간:', new Date().toLocaleString());

    await this.testServerHealth();
    await this.testMainPages();
    await this.testApiEndpoints();
    await this.testSyncApi();
    await this.testImageSync();
    await this.testDatabaseConnection();

    this.printSummary();
  }

  // 결과 요약 출력
  printSummary() {
    console.log('\n📊 테스트 결과 요약');
    console.log('='.repeat(50));
    console.log(`✅ 통과: ${this.results.passed}개`);
    console.log(`❌ 실패: ${this.results.failed}개`);
    console.log(`📋 총 테스트: ${this.results.tests.length}개`);

    const successRate = (
      (this.results.passed / this.results.tests.length) *
      100
    ).toFixed(1);
    console.log(`📈 성공률: ${successRate}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ 실패한 테스트들:');
      this.results.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.message}`);
        });
    }

    console.log('\n🎯 다음 단계:');
    if (this.results.failed === 0) {
      console.log('✅ 모든 기능이 정상 작동합니다!');
      console.log('🩺 Diagnosis 시스템 활성화 준비 완료');
    } else {
      console.log('⚠️ 일부 기능에 문제가 있습니다.');
      console.log('🔧 문제 해결 후 재테스트 필요');
    }
  }
}

// 테스트 실행
async function main() {
  const checker = new SystemHealthChecker();
  await checker.runAllTests();
}

main().catch(console.error);
