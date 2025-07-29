// training_journals 테이블 생성 스크립트
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

async function createTrainingJournalsTable() {
  console.log('🔧 training_journals 테이블 생성 중...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS training_journals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      external_id VARCHAR(255) UNIQUE, -- 외부 앱에서의 ID
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      is_public BOOLEAN DEFAULT false,
      sync_source VARCHAR(50) DEFAULT 'web', -- 'desktop_app', 'mobile_app', 'web'
      app_version VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_training_journals_user_id ON training_journals(user_id);
    CREATE INDEX IF NOT EXISTS idx_training_journals_category_id ON training_journals(category_id);
    CREATE INDEX IF NOT EXISTS idx_training_journals_external_id ON training_journals(external_id);
    CREATE INDEX IF NOT EXISTS idx_training_journals_created_at ON training_journals(created_at);
    CREATE INDEX IF NOT EXISTS idx_training_journals_is_public ON training_journals(is_public);
    
    -- RLS (Row Level Security) 정책 활성화
    ALTER TABLE training_journals ENABLE ROW LEVEL SECURITY;
    
    -- 사용자는 자신의 일지만 볼 수 있음
    CREATE POLICY IF NOT EXISTS "Users can view own journals" ON training_journals
      FOR SELECT USING (auth.uid() = user_id);
    
    -- 사용자는 자신의 일지만 삽입할 수 있음
    CREATE POLICY IF NOT EXISTS "Users can insert own journals" ON training_journals
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    -- 사용자는 자신의 일지만 업데이트할 수 있음
    CREATE POLICY IF NOT EXISTS "Users can update own journals" ON training_journals
      FOR UPDATE USING (auth.uid() = user_id);
    
    -- 사용자는 자신의 일지만 삭제할 수 있음
    CREATE POLICY IF NOT EXISTS "Users can delete own journals" ON training_journals
      FOR DELETE USING (auth.uid() = user_id);
    
    -- 공개 일지는 모든 사용자가 볼 수 있음
    CREATE POLICY IF NOT EXISTS "Public journals are viewable by everyone" ON training_journals
      FOR SELECT USING (is_public = true);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);

      // 개별 명령어로 시도
      console.log('🔄 개별 명령어로 재시도...');
      await createTableStepByStep();
    } else {
      console.log('✅ training_journals 테이블 생성 완료!');
    }
  } catch (error) {
    console.error('💥 오류 발생:', error);

    // 개별 명령어로 시도
    console.log('🔄 개별 명령어로 재시도...');
    await createTableStepByStep();
  }
}

async function createTableStepByStep() {
  console.log('📋 단계별 테이블 생성...');

  // 1. 기본 테이블 생성
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS training_journals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          external_id VARCHAR(255) UNIQUE,
          user_id UUID NOT NULL,
          category_id UUID NOT NULL,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          is_public BOOLEAN DEFAULT false,
          sync_source VARCHAR(50) DEFAULT 'web',
          app_version VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `,
    });

    if (error) {
      console.error('❌ 기본 테이블 생성 실패:', error);
    } else {
      console.log('✅ 기본 테이블 생성 완료');
    }
  } catch (error) {
    console.error('💥 기본 테이블 생성 중 오류:', error);
  }

  // 2. 직접 SQL로 테이블 확인
  try {
    const { data, error } = await supabase
      .from('training_journals')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ 테이블이 아직 생성되지 않았습니다:', error.message);
    } else {
      console.log('✅ training_journals 테이블 확인됨');
    }
  } catch (error) {
    console.log('💥 테이블 확인 중 오류:', error.message);
  }
}

async function testTableAccess() {
  console.log('\n🧪 테이블 접근 테스트...');

  try {
    // 테스트 데이터 삽입 시도
    const { data, error } = await supabase
      .from('training_journals')
      .insert({
        external_id: 'test-insert-' + Date.now(),
        user_id: '8236e966-ba4c-46d8-9cda-19bc67ec305d',
        category_id: '51594a73-91d6-4a87-a23d-c1cb38a52d82', // 기존 카테고리 ID
        title: '테스트 일지',
        content: '테스트 내용입니다.',
        is_public: true,
        sync_source: 'desktop_app',
        app_version: '1.0.0',
      })
      .select()
      .single();

    if (error) {
      console.log('❌ 테스트 삽입 실패:', error.message);
    } else {
      console.log('✅ 테스트 삽입 성공:', data.id);

      // 테스트 데이터 삭제
      await supabase.from('training_journals').delete().eq('id', data.id);

      console.log('🗑️ 테스트 데이터 정리 완료');
    }
  } catch (error) {
    console.error('💥 테이블 접근 테스트 중 오류:', error);
  }
}

async function main() {
  console.log('🧪 Think-Habit training_journals 테이블 생성 도구');
  console.log('='.repeat(60));

  await createTrainingJournalsTable();
  await testTableAccess();

  console.log('\n🎉 완료!');
  console.log('\n🚀 이제 동기화 API를 다시 테스트해보세요:');
  console.log('node test-sync-api-fixed.js');
}

main().catch(console.error);
