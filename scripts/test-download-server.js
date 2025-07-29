const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// 정적 파일 제공
app.use('/downloads', express.static(path.join(__dirname, '../public/downloads')));

// 테스트 페이지
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Think-Habit 다운로드 테스트 서버</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 { text-align: center; color: #333; }
        .download-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .download-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .download-button {
            display: block;
            width: 100%;
            padding: 12px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            margin-top: 15px;
            font-weight: bold;
        }
        .download-button:hover { background: #1d4ed8; }
        .status { 
            text-align: center; 
            padding: 20px; 
            background: #e0f2fe; 
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .file-size { 
            color: #666; 
            font-size: 0.9em; 
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <h1>📥 Think-Habit 다운로드 테스트 서버</h1>
    
    <div class="status">
        <p>✅ 테스트 서버가 포트 ${PORT}에서 실행 중입니다</p>
        <p>아래 다운로드 링크를 클릭하여 파일을 다운로드하세요</p>
    </div>

    <div class="download-grid">
        <div class="download-card">
            <h3>👥 Think-Habit 그룹 위젯</h3>
            <p>팀과 함께 사용하는 데스크톱 그룹 활동 위젯</p>
            <div class="file-size" id="group-widget-size">파일 크기 확인 중...</div>
            <a href="/downloads/think-habit-group-widget.zip" class="download-button" download>
                📥 다운로드
            </a>
        </div>

        <div class="download-card">
            <h3>🖥️ Windows 데스크톱 앱</h3>
            <p>Windows용 Think-Habit Journal 앱</p>
            <div class="file-size" id="windows-size">파일 크기 확인 중...</div>
            <a href="/downloads/think-habit-windows.exe" class="download-button" download>
                📥 다운로드
            </a>
        </div>

        <div class="download-card">
            <h3>💻 Mac 데스크톱 앱</h3>
            <p>macOS용 Think-Habit Journal 앱</p>
            <div class="file-size" id="mac-size">파일 크기 확인 중...</div>
            <a href="/downloads/think-habit-mac.dmg" class="download-button" download>
                📥 다운로드
            </a>
        </div>

        <div class="download-card">
            <h3>📱 Android 앱</h3>
            <p>Android용 Think-Habit 모바일 앱</p>
            <div class="file-size" id="android-size">파일 크기 확인 중...</div>
            <a href="/downloads/think-habit-android.apk" class="download-button" download>
                📥 다운로드
            </a>
        </div>
    </div>

    <script>
        // 파일 크기 확인
        const files = [
            { path: '/downloads/think-habit-group-widget.zip', id: 'group-widget-size' },
            { path: '/downloads/think-habit-windows.exe', id: 'windows-size' },
            { path: '/downloads/think-habit-mac.dmg', id: 'mac-size' },
            { path: '/downloads/think-habit-android.apk', id: 'android-size' }
        ];

        files.forEach(file => {
            fetch(file.path, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        const size = response.headers.get('content-length');
                        const sizeInMB = (parseInt(size) / 1024 / 1024).toFixed(2);
                        document.getElementById(file.id).textContent = \`파일 크기: \${sizeInMB} MB\`;
                    } else {
                        document.getElementById(file.id).textContent = '파일을 찾을 수 없습니다';
                    }
                })
                .catch(error => {
                    document.getElementById(file.id).textContent = '오류: ' + error.message;
                });
        });
    </script>
</body>
</html>
  `);
});

// 파일 목록 API
app.get('/api/files', (req, res) => {
  const downloadDir = path.join(__dirname, '../public/downloads');
  fs.readdir(downloadDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const fileInfo = files.map(file => {
      const filePath = path.join(downloadDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        sizeInMB: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
      };
    });
    
    res.json(fileInfo);
  });
});

app.listen(PORT, () => {
  console.log(`✅ 다운로드 테스트 서버가 시작되었습니다!`);
  console.log(`🌐 브라우저에서 접속: http://localhost:${PORT}`);
  console.log(`📁 다운로드 파일 위치: public/downloads/`);
  console.log(`\n종료하려면 Ctrl+C를 누르세요.`);
});