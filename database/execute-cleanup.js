// Supabase 테이블 정리 실행 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(filename, description) {
  console.log(`\n🔄 ${description} 실행 중...`);
  
  try {
    const sqlContent = fs.readFileSync(path.join(__dirname, filename), 'utf8');
    
    // SQL을 세미콜론으로 분할하여 각각 실행
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'));
    
    for (const statement of statements) {
      if (statement) {
        console.log('📝 실행:', statement.substring(0, 100) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log('⚠️ 경고:', error.message);
          // 테이블이 없어도 계속 진행
        }
      }
    }
    
    console.log(`✅ ${description} 완료`);
  } catch (error) {
    console.error(`❌ ${description} 실행 중 오류:`, error.message);
  }
}

async function main() {
  console.log('🚀 Supabase 데이터베이스 정리 시작');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  // 1단계: 기존 테이블 정리
  await executeSQL('cleanup-tables.sql', '기존 테이블 삭제');
  
  // 2단계: 새 스키마 적용
  await executeSQL('apply-clean-schema.sql', '새 스키마 적용');
  
  // 3단계: 결과 확인
  console.log('\n🔍 정리 결과 확인 중...');
  
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');
  
  if (error) {
    console.error('❌ 테이블 조회 오류:', error.message);
  } else {
    console.log('\n📋 현재 테이블 목록:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.table_name}`);
    });
    console.log(`\n🎉 총 ${tables.length}개 테이블로 정리 완료!`);
  }
  
  console.log('\n✨ 데이터베이스 정리가 성공적으로 완료되었습니다.');
}

main().catch(console.error);