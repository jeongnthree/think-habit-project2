// 테스트 사용자 생성 스크립트 (user_profiles 테이블용)
const { createClient } = require('@supabase/supabase-js');

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://gmvqcycnppuzixugzxvy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일에 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

async function createTestUserProfile() {
  console.log('🔧 테스트 사용자 프로필 생성 중...');

  try {
    // 1. 기존 테스트 사용자 확인
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    if (existingUser) {
      console.log('✅ 테스트 사용자 프로필이 이미 존재합니다:');
      console.log(JSON.stringify(existingUser, null, 2));
      return existingUser;
    }

    // 2. 새 테스트 사용자 프로필 생성
    const { data: newUser, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: TEST_USER_ID,
        email: 'test@example.com',
        full_name: '테스트 사용자',
        role: 'student',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 사용자 프로필 생성 실패:', error);
      return null;
    }

    console.log('✅ 테스트 사용자 프로필 생성 완료:');
    console.log(JSON.stringify(newUser, null, 2));

    return newUser;
  } catch (error) {
    console.error('💥 오류 발생:', error);
    return null;
  }
}

// API에서 사용하는 users 테이블에도 데이터 생성 (호환성을 위해)
async function createTestUser() {
  console.log('\n🔧 API 호환용 테스트 사용자 생성 중...');

  try {
    // 1. 기존 테스트 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', TEST_USER_ID)
      .single();

    if (existingUser) {
      console.log('✅ API용 테스트 사용자가 이미 존재합니다:');
      console.log(JSON.stringify(existingUser, null, 2));
      return existingUser;
    }

    // 2. 새 테스트 사용자 생성
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        auth_id: TEST_USER_ID,
        email: 'test@example.com',
        profile: {
          name: '테스트 사용자',
          avatar_url: null,
          bio: '동기화 테스트용 사용자입니다.',
        },
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ API용 사용자 생성 실패:', error);
      return null;
    }

    console.log('✅ API용 테스트 사용자 생성 완료:');
    console.log(JSON.stringify(newUser, null, 2));

    return newUser;
  } catch (error) {
    console.error('💥 API용 사용자 생성 중 오류:', error);
    return null;
  }
}

async function createTestCategories() {
  console.log('\n📂 테스트 카테고리 생성 중...');

  const categories = [
    {
      name: '완벽주의 극복',
      description: '완벽주의 성향을 극복하는 훈련 카테고리',
      template:
        '1. 오늘의 완벽주의 상황 파악\n2. 현실적인 기준 설정\n3. 실행 및 평가',
      is_active: true,
    },
    {
      name: '흑백논리 개선',
      description: '흑백논리를 개선하는 훈련 카테고리',
      template: '1. 극단적 사고 인식\n2. 중간 지점 찾기\n3. 균형잡힌 관점 연습',
      is_active: true,
    },
  ];

  for (const category of categories) {
    try {
      // 기존 카테고리 확인
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('name', category.name)
        .single();

      if (existing) {
        console.log(`✅ 카테고리 "${category.name}"이 이미 존재합니다.`);
        continue;
      }

      // 새 카테고리 생성
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        console.error(`❌ 카테고리 "${category.name}" 생성 실패:`, error);
      } else {
        console.log(`✅ 카테고리 "${category.name}" 생성 완료`);
      }
    } catch (error) {
      console.error(`💥 카테고리 "${category.name}" 처리 중 오류:`, error);
    }
  }
}

async function main() {
  console.log('🧪 Think-Habit 테스트 데이터 생성 도구 (user_profiles)');
  console.log('='.repeat(60));
  console.log(`👤 테스트 사용자 ID: ${TEST_USER_ID}`);

  const userProfile = await createTestUserProfile();
  const apiUser = await createTestUser();

  if (userProfile || apiUser) {
    await createTestCategories();

    console.log('\n🎉 테스트 데이터 생성 완료!');
    console.log('\n📋 생성된 데이터:');
    console.log(`- 사용자 ID: ${TEST_USER_ID}`);
    console.log(`- 사용자 이름: 테스트 사용자`);
    console.log(`- 이메일: test@example.com`);

    console.log('\n🚀 이제 동기화 API를 다시 테스트해보세요:');
    console.log('node test-sync-api-fixed.js');
  } else {
    console.log('❌ 테스트 데이터 생성 실패');
  }
}

main().catch(console.error);
