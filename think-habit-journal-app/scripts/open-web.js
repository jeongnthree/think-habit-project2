#!/usr/bin/env node

const { exec } = require("child_process");
const os = require("os");

// 운영체제에 따라 적절한 명령어 선택
function getOpenCommand(url) {
  switch (os.platform()) {
    case "win32":
      return `start ${url}`;
    case "darwin":
      return `open ${url}`;
    default:
      return `xdg-open ${url}`;
  }
}

// 웹 서버 URL
const url = "http://localhost:9001";

console.log(`🌐 브라우저에서 ${url} 열기...`);

// 브라우저에서 URL 열기
exec(getOpenCommand(url), (error) => {
  if (error) {
    console.error(`❌ 브라우저를 열 수 없습니다: ${error.message}`);
    process.exit(1);
  }
  console.log("✅ 브라우저가 열렸습니다.");
});
