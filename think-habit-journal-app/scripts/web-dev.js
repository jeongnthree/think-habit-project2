#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

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

// 정리 함수
function cleanup() {
  log("🧹 프로세스 정리 중...", "yellow");

  if (rendererProcess) {
    rendererProcess.kill();
    rendererProcess = null;
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
    log("🚀 웹 개발 서버 시작 중...", "blue");

    // 더 간단한 명령어로 실행
    rendererProcess = spawn(
      "npx",
      [
        "webpack",
        "serve",
        "--config",
        "webpack.renderer.config.js",
        "--mode",
        "development",
        "--port",
        "9002", // 다른 포트 번호 사용
      ],
      {
        stdio: "pipe",
        shell: true,
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: "development",
          WEB_MODE: "true",
        },
      },
    );

    let rendererReady = false;

    rendererProcess.stdout.on("data", (data) => {
      const output = data.toString();

      // 모든 출력 표시
      process.stdout.write(`[Web Server] ${output}`);

      // webpack dev server 시작 확인
      if (
        output.includes("webpack compiled successfully") ||
        output.includes("Compiled successfully") ||
        output.includes("compiled successfully") ||
        output.includes("Local:")
      ) {
        if (!rendererReady) {
          rendererReady = true;
          log("✅ 웹 개발 서버 준비 완료", "green");
          resolve();
        }
      }
    });

    rendererProcess.stderr.on("data", (data) => {
      const error = data.toString();
      if (!error.includes("DeprecationWarning")) {
        process.stderr.write(`[Web Server Error] ${error}`);
      }
    });

    rendererProcess.on("error", (error) => {
      log(`❌ 웹 개발 서버 오류: ${error.message}`, "red");
      reject(error);
    });

    rendererProcess.on("exit", (code) => {
      if (code !== 0) {
        log(`❌ 웹 개발 서버가 코드 ${code}로 종료됨`, "red");
        reject(new Error(`Web server process exited with code ${code}`));
      }
    });

    // 타임아웃 설정 (60초)
    setTimeout(() => {
      if (!rendererReady) {
        log(
          "⏰ 웹 개발 서버 시작 대기 중... 컴파일이 완료될 때까지 기다립니다",
          "yellow",
        );

        // 추가 대기 시간 제공 (30초 더)
        setTimeout(() => {
          if (!rendererReady) {
            log("⏰ 웹 개발 서버 시작 타임아웃", "red");
            reject(new Error("Web server process start timeout"));
          }
        }, 30000);
      }
    }, 60000);
  });
}

// 메인 실행 함수
async function main() {
  try {
    log("🎯 Think-Habit Journal 웹 개발 서버 시작", "bright");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan");

    // 필요한 디렉토리 생성
    const distDir = path.join(process.cwd(), "dist");
    const rendererDir = path.join(distDir, "renderer");

    [distDir, rendererDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`📁 디렉토리 생성: ${path.relative(process.cwd(), dir)}`, "cyan");
      }
    });

    // 웹 개발 서버 시작
    await startRenderer();

    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan");
    log("🎉 웹 개발 서버가 성공적으로 시작되었습니다!", "green");
    log("", "reset");
    log("📝 웹 서버: http://localhost:9002", "blue");
    log("", "reset");
    log("종료하려면 Ctrl+C를 누르세요", "yellow");
  } catch (error) {
    log(`❌ 웹 개발 서버 시작 실패: ${error.message}`, "red");
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
