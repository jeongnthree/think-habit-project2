const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 빌드 디렉토리 생성
const buildDir = path.join(__dirname, '../public/downloads');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// ZIP 파일 생성
const output = fs.createWriteStream(path.join(buildDir, 'think-habit-group-widget.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  console.log('✅ Group widget 패키지 생성 완료!');
  console.log(`📦 파일 크기: ${(archive.pointer() / 1024 / 1024).toFixed(2)}MB`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// widget 소스 추가
const widgetDir = path.join(__dirname, '../think-habit-group-widget');
archive.directory(widgetDir, 'think-habit-group-widget', {
  ignore: ['node_modules/**', 'dist/**', '.git/**']
});

// README 추가
archive.append(`# Think-Habit Group Widget

## 설치 방법

1. 압축 해제
2. 폴더로 이동: \`cd think-habit-group-widget\`
3. 의존성 설치: \`npm install\`
4. 개발 서버 실행: \`npm run dev\`
5. 빌드: \`npm run build\`

## 사용 방법

웹사이트에 임베드하려면:

\`\`\`html
<div id="think-habit-widget"></div>
<script src="path/to/dist/index.js"></script>
\`\`\`

자세한 사용법은 프로젝트 내 README.md를 참조하세요.
`, { name: 'INSTALL.md' });

archive.finalize();