import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import Store from "electron-store";
import * as path from "path";
import { initializeDatabase } from "../lib/database/connection";

// 앱 설정 저장소
const store = new Store();

// 메인 윈도우 참조
let mainWindow: BrowserWindow | null = null;

// 개발 모드 확인
const isDev = process.env.NODE_ENV === "development";

// 메인 윈도우 생성
const createMainWindow = (): void => {
  // 이전 윈도우 크기/위치 복원
  const windowBounds = store.get("windowBounds", {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
  }) as any;

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // enableRemoteModule 속성 제거 (Electron 14 이상에서는 사용되지 않음)
      preload: path.join(__dirname, "preload.js"),
      webSecurity: !isDev,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false, // 준비될 때까지 숨김
    icon: path.join(__dirname, "../../assets/icon.png"),
  });

  // 윈도우 준비되면 표시
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus(); // 창을 맨 앞으로 가져오기

      // 항상 DevTools 열기 (디버깅용)
      mainWindow.webContents.openDevTools();
    }
  });

  // 윈도우 크기/위치 변경 시 저장
  mainWindow.on("resize", saveWindowBounds);
  mainWindow.on("move", saveWindowBounds);

  // 윈도우 닫힐 때
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // 개발 모드에서는 webpack dev server 사용
  if (isDev) {
    mainWindow.loadURL("http://localhost:9001");
  } else {
    // 단순한 HTML 파일 사용
    const htmlPath = path.join(__dirname, "../renderer/simple-index.html");
    console.log("Loading HTML from:", htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
};

// 윈도우 크기/위치 저장
const saveWindowBounds = (): void => {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    store.set("windowBounds", bounds);
  }
};

// 메뉴 설정
const createMenu = (): void => {
  const template: any[] = [
    {
      label: "파일",
      submenu: [
        {
          label: "새 일지",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow?.webContents.send("menu-new-journal");
          },
        },
        {
          label: "일지 목록",
          accelerator: "CmdOrCtrl+L",
          click: () => {
            mainWindow?.webContents.send("menu-journal-list");
          },
        },
        { type: "separator" },
        {
          label: "설정",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            mainWindow?.webContents.send("menu-settings");
          },
        },
        { type: "separator" },
        {
          label: "종료",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "편집",
      submenu: [
        { role: "undo", label: "실행 취소" },
        { role: "redo", label: "다시 실행" },
        { type: "separator" },
        { role: "cut", label: "잘라내기" },
        { role: "copy", label: "복사" },
        { role: "paste", label: "붙여넣기" },
        { role: "selectall", label: "모두 선택" },
      ],
    },
    {
      label: "보기",
      submenu: [
        { role: "reload", label: "새로고침" },
        { role: "forceReload", label: "강제 새로고침" },
        { role: "toggleDevTools", label: "개발자 도구" },
        { type: "separator" },
        { role: "resetZoom", label: "실제 크기" },
        { role: "zoomIn", label: "확대" },
        { role: "zoomOut", label: "축소" },
        { type: "separator" },
        { role: "togglefullscreen", label: "전체 화면" },
      ],
    },
    {
      label: "도움말",
      submenu: [
        {
          label: "Think-Habit 정보",
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: "info",
              title: "Think-Habit Journal",
              message: "Think-Habit Journal v1.0.0",
              detail: "생각습관 개선을 위한 훈련 일지 애플리케이션",
            });
          },
        },
      ],
    },
  ];

  // macOS에서는 앱 메뉴 추가
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about", label: "정보" },
        { type: "separator" },
        { role: "services", label: "서비스" },
        { type: "separator" },
        { role: "hide", label: "숨기기" },
        { role: "hideothers", label: "다른 항목 숨기기" },
        { role: "unhide", label: "모두 보기" },
        { type: "separator" },
        { role: "quit", label: "종료" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// IPC 핸들러 설정
const setupIpcHandlers = (): void => {
  // 앱 정보 요청
  ipcMain.handle("get-app-info", () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      isDev,
    };
  });

  // 설정 저장/로드
  ipcMain.handle("store-get", (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle("store-set", (_, key: string, value: any) => {
    store.set(key, value);
  });

  // 파일 다이얼로그
  ipcMain.handle("show-open-dialog", async (_, options) => {
    if (mainWindow) {
      return await dialog.showOpenDialog(mainWindow, options);
    }
    return { canceled: true };
  });

  ipcMain.handle("show-save-dialog", async (_, options) => {
    if (mainWindow) {
      return await dialog.showSaveDialog(mainWindow, options);
    }
    return { canceled: true };
  });

  // 알림 표시
  ipcMain.handle("show-notification", (_, title: string, body: string) => {
    if (process.platform === "win32") {
      // Windows에서는 토스트 알림 사용
      mainWindow?.webContents.send("show-toast", { title, body });
    } else {
      // macOS/Linux에서는 시스템 알림 사용
      new Notification(title, { body });
    }
  });
};

// 앱 이벤트 핸들러
app.whenReady().then(async () => {
  try {
    // 데이터베이스 초기화
    console.log('🗄️ 데이터베이스 초기화 중...');
    await initializeDatabase();
    console.log('✅ 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    // 에러가 발생해도 앱을 계속 실행 (로컬스토리지 폴백 가능)
  }

  createMainWindow();
  createMenu();
  setupIpcHandlers();

  // macOS에서 독 아이콘 클릭 시 윈도우 복원
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 모든 윈도우가 닫혔을 때
app.on("window-all-closed", () => {
  // macOS가 아니면 앱 종료
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 앱 종료 전 정리 작업
app.on("before-quit", () => {
  saveWindowBounds();
});

// 보안: 새 윈도우 생성 방지
app.on("web-contents-created", (_, contents) => {
  // 'new-window' 이벤트는 더 이상 사용되지 않으므로 setWindowOpenHandler로 대체
  contents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
});

// 개발 모드에서 핫 리로드 지원
if (isDev) {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "../../node_modules/.bin/electron"),
    hardResetMethod: "exit",
  });
}
