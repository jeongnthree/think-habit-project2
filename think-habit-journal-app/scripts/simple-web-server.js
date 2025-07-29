#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

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

// 서버 시작
log("🚀 간단한 웹 서버 시작 중...", "blue");

function startServer() {
  const PORT = 9004;
  const SRC_DIR = path.join(__dirname, "../src/renderer");

  // MIME 타입 매핑
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".woff": "application/font-woff",
    ".ttf": "application/font-ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".otf": "application/font-otf",
    ".wasm": "application/wasm",
    ".tsx": "text/plain",
    ".ts": "text/plain",
  };

  // 서버 생성
  const server = http.createServer((req, res) => {
    // URL에서 쿼리 파라미터 제거
    let url = req.url.split("?")[0];

    // 루트 경로인 경우 index.html 제공
    if (url === "/") {
      url = "/index.html";
    }

    // 파일 경로 생성
    const filePath = path.join(SRC_DIR, url);

    // 파일 확장자 확인
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || "application/octet-stream";

    // 파일 존재 여부 확인 및 제공
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === "ENOENT") {
          // 파일이 없는 경우 index.html 제공
          fs.readFile(path.join(SRC_DIR, "index.html"), (err, content) => {
            if (err) {
              res.writeHead(500);
              res.end("Error loading index.html");
            } else {
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(content, "utf-8");
            }
          });
        } else {
          // 서버 오류
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`);
        }
      } else {
        // 파일 제공
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content, "utf-8");
      }
    });
  });

  // 서버 시작
  server.listen(PORT, () => {
    log(`🚀 웹 서버가 포트 ${PORT}에서 실행 중입니다.`, "green");
    log(`📝 http://localhost:${PORT}`, "blue");
    log("종료하려면 Ctrl+C를 누르세요", "yellow");
  });

  // 오류 처리
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      log(`❌ 포트 ${PORT}가 이미 사용 중입니다.`, "red");
    } else {
      log(`❌ 서버 오류: ${err}`, "red");
    }
    process.exit(1);
  });
}

// 서버 시작
startServer();

// 종료 처리
process.on("SIGINT", () => {
  log("🧹 서버를 종료합니다...", "yellow");
  process.exit(0);
});
