#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 색상 출력을 위한 유틸리티
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 프로세스 관리
let buildProcess = null;
let copyProcess = null;

// 정리 함수
function cleanup() {
  log('🧹 프로세스 정리 중...', 'yellow');

  if (buildProcess) {
    buildProcess.kill();
    buildProcess = null;
  }

  if (copyProcess) {
    copyProcess.kill();
    copyProcess = null;
  }

  process.exit(0);
}

// 시그널 핸들러
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// 앱 빌드 함수
async function buildApp() {
  return new Promise((resolve, reject) => {
    log('🚀 Think-Habit Journal 앱 빌드 시작...', 'blue');

    buildProcess = spawn('npm', ['run', 'dist'], {
      stdio: 'pipe',
      shell: true,
      cwd: path.join(process.cwd(), 'think-habit-journal-app'),
    });

    buildProcess.stdout.on('data', data => {
      process.stdout.write(`[Build] ${data}`);
    });

    buildProcess.stderr.on('data', data => {
      process.stderr.write(`[Build Error] ${data}`);
    });

    buildProcess.on('error', error => {
      log(`❌ 빌드 오류: ${error.message}`, 'red');
      reject(error);
    });

    buildProcess.on('exit', code => {
      if (code === 0) {
        log('✅ 앱 빌드 완료', 'green');
        resolve();
      } else {
        log(`❌ 빌드 실패 (코드: ${code})`, 'red');
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
  });
}

// 배포 파일 복사 함수
async function copyDistFiles() {
  return new Promise((resolve, reject) => {
    log('📦 배포 파일 복사 중...', 'blue');

    const sourceDir = path.join(
      process.cwd(),
      'think-habit-journal-app',
      'release'
    );
    const targetDir = path.join(process.cwd(), 'public', 'downloads');

    // 대상 디렉토리가 없으면 생성
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 플랫폼별 명령어 결정
    let command, args;
    if (process.platform === 'win32') {
      command = 'powershell';
      args = [
        '-Command',
        `Copy-Item -Path "${sourceDir}\\*" -Destination "${targetDir}" -Recurse -Force`,
      ];
    } else {
      command = 'cp';
      args = ['-R', `${sourceDir}/*`, targetDir];
    }

    copyProcess = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
    });

    copyProcess.stdout.on('data', data => {
      process.stdout.write(`[Copy] ${data}`);
    });

    copyProcess.stderr.on('data', data => {
      process.stderr.write(`[Copy Error] ${data}`);
    });

    copyProcess.on('error', error => {
      log(`❌ 파일 복사 오류: ${error.message}`, 'red');
      reject(error);
    });

    copyProcess.on('exit', code => {
      if (code === 0) {
        log('✅ 배포 파일 복사 완료', 'green');
        resolve();
      } else {
        log(`❌ 파일 복사 실패 (코드: ${code})`, 'red');
        reject(new Error(`Copy process exited with code ${code}`));
      }
    });
  });
}

// 메인 실행 함수
async function main() {
  try {
    log('🎯 Think-Habit Journal 배포 파일 생성 및 배포', 'bright');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

    // 앱 빌드
    await buildApp();

    // 배포 파일 복사
    await copyDistFiles();

    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('🎉 배포 파일 생성 및 배포 완료!', 'green');
    log('', 'reset');
    log('다운로드 페이지에서 앱을 다운로드할 수 있습니다.', 'blue');
    log('URL: http://localhost:3000/download', 'blue');
    log('', 'reset');
  } catch (error) {
    log(`❌ 배포 실패: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 실행
main().catch(error => {
  log(`❌ 예상치 못한 오류: ${error.message}`, 'red');
  process.exit(1);
});
