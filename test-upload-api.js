// 업로드 API 테스트 스크립트
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
  console.log('🧪 업로드 API 테스트 시작...\n');

  try {
    // 테스트 이미지 생성
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // 테스트 이미지가 없으면 생성
    if (!fs.existsSync(testImagePath)) {
      console.log('테스트 이미지 생성 중...');
      // 간단한 1x1 픽셀 JPEG 이미지 생성
      const jpegData = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=', 'base64');
      fs.writeFileSync(testImagePath, jpegData);
      console.log('✅ 테스트 이미지 생성 완료\n');
    }

    // FormData 생성
    const form = new FormData();
    form.append('files', fs.createReadStream(testImagePath));
    form.append('userId', 'test-user-api');

    // API 호출
    console.log('📤 API 호출 중...');
    const response = await fetch('http://localhost:3000/api/upload/simple', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const responseData = await response.json();
    
    console.log('\n📥 응답 상태:', response.status);
    console.log('📥 응답 데이터:', JSON.stringify(responseData, null, 2));

    if (response.ok && responseData.success) {
      console.log('\n✅ 업로드 테스트 성공!');
      console.log('업로드된 URL:', responseData.data?.urls?.[0]);
    } else {
      console.log('\n❌ 업로드 테스트 실패:', responseData.error);
    }

  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error.message);
  }
}

// fetch가 없는 경우 node-fetch 사용
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// 테스트 실행
testUpload();