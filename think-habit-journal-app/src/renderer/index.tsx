import React from "react";
import { createRoot } from "react-dom/client";
import {
  initializePlatformService,
  platformService,
} from "../services/platform";
import App from "./App";
import "./index.css";

// 웹 환경에서 실행 중인지 확인
const isWebMode =
  typeof window !== "undefined" &&
  (window.location.href.includes("localhost") || !window.electronAPI);

// 웹 환경 표시를 위한 전역 변수 설정
if (isWebMode && typeof window !== "undefined") {
  window.IS_WEB_MODE = true;
}

// 웹 환경에서 필요한 모의 객체 설정
if (isWebMode && typeof window !== "undefined") {
  console.log("Electron API not available. Running in browser mode.");

  // 전역 객체에 electronAPI 속성이 없으면 생성
  if (!window.electronAPI) {
    window.electronAPI = {};
  }

  // app 객체 설정
  window.electronAPI.app = window.electronAPI.app || {
    getVersion: () => Promise.resolve("1.0.0-web"),
    quit: () => {
      console.log("앱 종료 요청");
      return Promise.resolve();
    },
    minimize: () => {
      console.log("앱 최소화 요청");
      return Promise.resolve();
    },
    maximize: () => {
      console.log("앱 최대화 요청");
      return Promise.resolve();
    },
    unmaximize: () => {
      console.log("앱 최대화 해제 요청");
      return Promise.resolve();
    },
    isMaximized: () => Promise.resolve(false),
  };

  // store 객체 설정 (중요: 이 부분이 누락되어 오류 발생)
  window.electronAPI.store = window.electronAPI.store || {
    get: (key) => {
      try {
        const value = localStorage.getItem(key);
        return Promise.resolve(value ? JSON.parse(value) : null);
      } catch (error) {
        console.error(`localStorage에서 데이터 가져오기 실패 (${key}):`, error);
        return Promise.resolve(null);
      }
    },
    set: (key, value) => {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
        return Promise.resolve();
      } catch (error) {
        console.error(`localStorage에 데이터 저장 실패 (${key}):`, error);
        return Promise.resolve();
      }
    },
    clear: () => {
      try {
        localStorage.clear();
        return Promise.resolve();
      } catch (error) {
        console.error("localStorage 초기화 실패:", error);
        return Promise.resolve();
      }
    },
  };

  // 알림 기능 설정
  window.electronAPI.showNotification =
    window.electronAPI.showNotification ||
    ((title, message) => {
      console.log(`알림: ${title} - ${message}`);

      // 브라우저 알림 API 사용 시도
      if (Notification.permission === "granted") {
        new Notification(title, { body: message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body: message });
          }
        });
      }

      return Promise.resolve();
    });

  // 대화상자 기능 설정
  window.electronAPI.dialog = window.electronAPI.dialog || {
    openFile: () => Promise.resolve(null),
    saveFile: () => Promise.resolve(null),
  };

  // 파일 시스템 기능 설정
  window.electronAPI.fs = window.electronAPI.fs || {
    readFile: () => Promise.resolve(null),
    writeFile: () => Promise.resolve(),
  };

  console.log("웹 환경용 Electron API 모의 객체가 설정되었습니다.");
}

// 모의 객체 설정 후 플랫폼 서비스 초기화
console.log("플랫폼 서비스를 초기화합니다...");
initializePlatformService();

// 전역 에러 핸들러
window.addEventListener("error", async (event) => {
  console.error("Global error:", event.error);

  try {
    // 플랫폼 서비스를 통해 알림 표시
    await platformService.notification.show(
      "오류 발생",
      "예상치 못한 오류가 발생했습니다.",
    );
  } catch (e) {
    console.error("알림 표시 실패:", e);
  }
});

// 처리되지 않은 Promise 거부 핸들러
window.addEventListener("unhandledrejection", async (event) => {
  console.error("Unhandled promise rejection:", event.reason);

  try {
    // 플랫폼 서비스를 통해 알림 표시
    await platformService.notification.show(
      "오류 발생",
      "비동기 작업 중 오류가 발생했습니다.",
    );
  } catch (e) {
    console.error("알림 표시 실패:", e);
  }
});

// React 앱 마운트
console.log("🚀 React 앱 마운트 시작...");
const container = document.getElementById("root");
if (!container) {
  console.error("❌ Root element not found");
  throw new Error("Root element not found");
}

console.log("✅ Root element found:", container);
const root = createRoot(container);
console.log("✅ React root created");

// 개발 모드에서는 StrictMode 사용
const AppComponent =
  process.env.NODE_ENV === "development" ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  );

console.log("🎨 React 앱 렌더링 시작...");
root.render(AppComponent);
console.log("✅ React 앱 렌더링 완료");

// 개발 모드에서 핫 모듈 리플레이스먼트 지원
if (process.env.NODE_ENV === "development" && module.hot) {
  module.hot.accept("./App", () => {
    const NextApp = require("./App").default;
    root.render(
      <React.StrictMode>
        <NextApp />
      </React.StrictMode>,
    );
  });
}
