// Supabase Storage 설정 및 테스트
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

const setupStorage = async () => {
  console.log('🗄️ Supabase Storage 설정 중...\n');

  try {
    // 1. 기존 버킷 확인
    console.log('1. 기존 버킷 확인:');
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('   ❌ 버킷 조회 오류:', bucketsError.message);
    } else {
      console.log(`   📦 기존 버킷 ${buckets.length}개:`);
      buckets.forEach(bucket => {
        console.log(
          `      - ${bucket.name} (${bucket.public ? '공개' : '비공개'})`
        );
      });
    }

    // 2. journal-images 버킷 생성 (이미 있으면 스킵)
    console.log('\n2. journal-images 버킷 생성:');
    const bucketName = 'journal-images';

    const { data: createData, error: createError } =
      await supabase.storage.createBucket(bucketName, {
        public: true, // 공개 버킷으로 설정
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ],
        fileSizeLimit: 5242880, // 5MB 제한
      });

    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('   ✅ journal-images 버킷이 이미 존재합니다');
      } else {
        console.log('   ❌ 버킷 생성 오류:', createError.message);
      }
    } else {
      console.log('   ✅ journal-images 버킷 생성 완료');
    }

    // 3. 테스트 이미지 업로드 (Base64 데이터 생성)
    console.log('\n3. 테스트 이미지 업로드:');

    // 1x1 픽셀 투명 PNG 이미지 (Base64)
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');

    const testFileName = `test-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.log('   ❌ 테스트 업로드 오류:', uploadError.message);
    } else {
      console.log('   ✅ 테스트 이미지 업로드 성공:', uploadData.path);

      // 4. 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      console.log('   🔗 공개 URL:', urlData.publicUrl);

      // 5. 테스트 파일 삭제
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([uploadData.path]);

      if (deleteError) {
        console.log('   ⚠️ 테스트 파일 삭제 실패:', deleteError.message);
      } else {
        console.log('   🗑️ 테스트 파일 삭제 완료');
      }
    }

    // 6. 데이터베이스에 이미지 URL 컬럼 추가 제안
    console.log('\n4. 데이터베이스 스키마 업데이트 필요:');
    console.log('   💡 Supabase Dashboard에서 다음 SQL을 실행하세요:');
    console.log('   ');
    console.log('   ALTER TABLE training_journals');
    console.log('   ADD COLUMN IF NOT EXISTS image_urls TEXT[],');
    console.log('   ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 0;');
    console.log('   ');
    console.log('   또는 다음 컬럼들을 추가:');
    console.log('   - image_urls: text[] (이미지 URL 배열)');
    console.log('   - image_count: integer (이미지 개수)');
  } catch (error) {
    console.error('❌ Storage 설정 오류:', error.message);
  }
};

setupStorage();
