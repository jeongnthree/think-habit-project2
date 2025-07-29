#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// 색상 출력을 위한 유틸리티
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 프로세스 관리
let rendererProcess = null;
let mainProcess = null;

// 정리 함수
function cleanup() {
  log("🧹 프로세스 정리 중...", "yellow");

  if (rendererProcess) {
    rendererProcess.kill();
    rendererProcess = null;
  }

  if (mainProcess) {
    mainProcess.kill();
    mainProcess = null;
  }

  process.exit(0);
}

// 시그널 핸들러
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

// 렌더러 프로세스 시작
function startRenderer() {
  return new Promise((resolve, reject) => {
    log("🚀 렌더러 프로세스 시작 중...", "blue");

    rendererProcess = spawn("npm", ["run", "dev:renderer"], {
      stdio: "pipe",
      shell: true,
      cwd: process.cwd(),
    });

    let rendererReady = false;

    rendererProcess.stdout.on("data", (data) => {
      const output = data.toString();

      // webpack dev server 시작 확인
      if (output.includes("webpack compiled") || output.includes("Local:")) {
        if (!rendererReady) {
          rendererReady = true;
          log("✅ 렌더러 프로세스 준비 완료", "green");
          resolve();
        }
      }

      // 출력 표시 (필터링)
      if (!output.includes("webpack compiled")) {
        process.stdout.write(`[Renderer] ${output}`);
      }
    });

    rendererProcess.stderr.on("data", (data) => {
      const error = data.toString();
      if (!error.includes("DeprecationWarning")) {
        process.stderr.write(`[Renderer Error] ${error}`);
      }
    });

    rendererProcess.on("error", (error) => {
      log(`❌ 렌더러 프로세스 오류: ${error.message}`, "red");
      reject(error);
    });

    rendererProcess.on("exit", (code) => {
      if (code !== 0) {
        log(`❌ 렌더러 프로세스가 코드 ${code}로 종료됨`, "red");
        reject(new Error(`Renderer process exited with code ${code}`));
      }
    });

    // 타임아웃 설정 (30초)
    setTimeout(() => {
      if (!rendererReady) {
        log("⏰ 렌더러 프로세스 시작 타임아웃", "red");
        reject(new Error("Renderer process start timeout"));
      }
    }, 30000);
  });
}

// 메인 프로세스 시작
function startMain() {
  return new Promise((resolve, reject) => {
    log("🚀 메인 프로세스 시작 중...", "blue");

    // 먼저 TypeScript 컴파일
    const tscProcess = spawn("npx", ["tsc", "-p", "tsconfig.main.json"], {
      stdio: "pipe",
      shell: true,
      cwd: process.cwd(),
    });

    tscProcess.on("close", (code) => {
      if (code !== 0) {
        log(`❌ TypeScript 컴파일 실패 (코드: ${code})`, "red");
        reject(new Error(`TypeScript compilation failed with code ${code}`));
        return;
      }

      log("✅ TypeScript 컴파일 완료", "green");

      // Electron 앱 시작
      mainProcess = spawn("npx", ["electron", "dist/main/main.js"], {
        stdio: "pipe",
        shell: true,
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "development",
        },
      });

      mainProcess.stdout.on("data", (data) => {
        process.stdout.write(`[Main] ${data}`);
      });

      mainProcess.stderr.on("data", (data) => {
        const error = data.toString();
        if (!error.includes("DeprecationWarning")) {
          process.stderr.write(`[Main Error] ${error}`);
        }
      });

      mainProcess.on("error", (error) => {
        log(`❌ 메인 프로세스 오류: ${error.message}`, "red");
        reject(error);
      });

      mainProcess.on("exit", (code) => {
        log(`🔚 메인 프로세스 종료 (코드: ${code})`, "yellow");
        cleanup();
      });

      log("✅ 메인 프로세스 시작됨", "green");
      resolve();
    });

    tscProcess.stderr.on("data", (data) => {
      process.stderr.write(`[TSC Error] ${data}`);
    });
  });
}

// 메인 실행 함수
async function main() {
  try {
    log("🎯 Think-Habit Journal 개발 서버 시작", "bright");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan");

    // 필요한 디렉토리 생성
    const distDir = path.join(process.cwd(), "dist");
    const mainDir = path.join(distDir, "main");
    const rendererDir = path.join(distDir, "renderer");

    [distDir, mainDir, rendererDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`📁 디렉토리 생성: ${path.relative(process.cwd(), dir)}`, "cyan");
      }
    });

    // 렌더러 프로세스 먼저 시작
    await startRenderer();

    // 잠시 대기 후 메인 프로세스 시작
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await startMain();

    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan");
    log("🎉 개발 서버가 성공적으로 시작되었습니다!", "green");
    log("", "reset");
    log("📝 렌더러: http://localhost:3001", "blue");
    log("⚡ 메인: Electron 앱 실행 중", "blue");
    log("", "reset");
    log("종료하려면 Ctrl+C를 누르세요", "yellow");
  } catch (error) {
    log(`❌ 개발 서버 시작 실패: ${error.message}`, "red");
    cleanup();
    process.exit(1);
  }
}

// 실행
main().catch((error) => {
  log(`❌ 예상치 못한 오류: ${error.message}`, "red");
  cleanup();
  process.exit(1);
});
