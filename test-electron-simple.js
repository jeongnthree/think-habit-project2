const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: true
  });

  // 간단한 HTML 콘텐츠 직접 로드
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Think-Habit Journal Test</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                backdrop-filter: blur(10px);
            }
            button {
                background: #4285f4;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                margin-top: 1rem;
            }
            button:hover {
                background: #3367d6;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 Think-Habit Journal</h1>
            <p>생각습관 개선을 위한 훈련 일지</p>
            <button onclick="openGoogleAuth()">🔐 Google로 로그인</button>
            <div id="status" style="margin-top: 1rem;"></div>
        </div>

        <script>
            function openGoogleAuth() {
                const status = document.getElementById('status');
                status.innerHTML = '로그인 시작 중...';
                
                // 웹 방식으로 OAuth 요청 (데스크톱 포트 대신 웹 콜백 사용)
                const authUrl = 'http://localhost:3002/auth/google';
                
                // 브라우저에서 열기
                require('electron').shell.openExternal(authUrl);
                
                status.innerHTML = '브라우저에서 Google 로그인을 완료해주세요...<br>로그인 완료 후 대시보드가 보이면 성공입니다!';
            }
            
            console.log('Think-Habit Journal 앱이 로드되었습니다!');
        </script>
    </body>
    </html>
  `;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  
  // 개발자 도구 열기
  mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('Electron 앱 시작...');