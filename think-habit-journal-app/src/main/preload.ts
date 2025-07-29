import { contextBridge, ipcRenderer } from "electron";

// 렌더러 프로세스에서 사용할 API 정의
export interface ElectronAPI {
  // 앱 정보
  getAppInfo: () => Promise<{
    name: string;
    version: string;
    platform: string;
    isDev: boolean;
  }>;

  // 설정 관리
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };

  // 파일 다이얼로그
  dialog: {
    showOpenDialog: (options: any) => Promise<any>;
    showSaveDialog: (options: any) => Promise<any>;
  };

  // 알림
  showNotification: (title: string, body: string) => Promise<void>;

  // 메뉴 이벤트 리스너
  onMenuAction: (callback: (action: string) => void) => void;
  removeMenuListener: () => void;

  // 토스트 알림 (Windows용)
  onShowToast: (
    callback: (data: { title: string; body: string }) => void,
  ) => void;
  removeToastListener: () => void;
}

// 메뉴 액션 리스너
let menuActionListener: ((event: any, action: string) => void) | null = null;
let toastListener: ((event: any, data: any) => void) | null = null;

// Context Bridge를 통해 안전하게 API 노출
contextBridge.exposeInMainWorld("electronAPI", {
  // 앱 정보 조회
  getAppInfo: () => ipcRenderer.invoke("get-app-info"),

  // 설정 관리
  store: {
    get: (key: string) => ipcRenderer.invoke("store-get", key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke("store-set", key, value),
  },

  // 파일 다이얼로그
  dialog: {
    showOpenDialog: (options: any) =>
      ipcRenderer.invoke("show-open-dialog", options),
    showSaveDialog: (options: any) =>
      ipcRenderer.invoke("show-save-dialog", options),
  },

  // 알림 표시
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke("show-notification", title, body),

  // 메뉴 액션 리스너
  onMenuAction: (callback: (action: string) => void) => {
    // 기존 리스너 제거
    if (menuActionListener) {
      ipcRenderer.removeListener("menu-new-journal", menuActionListener);
      ipcRenderer.removeListener("menu-journal-list", menuActionListener);
      ipcRenderer.removeListener("menu-settings", menuActionListener);
    }

    // 새 리스너 등록
    menuActionListener = (event: any, ...args: any[]) => {
      const channel = event.type || args[0];
      callback(channel);
    };

    ipcRenderer.on("menu-new-journal", () => callback("new-journal"));
    ipcRenderer.on("menu-journal-list", () => callback("journal-list"));
    ipcRenderer.on("menu-settings", () => callback("settings"));
  },

  removeMenuListener: () => {
    if (menuActionListener) {
      ipcRenderer.removeListener("menu-new-journal", menuActionListener);
      ipcRenderer.removeListener("menu-journal-list", menuActionListener);
      ipcRenderer.removeListener("menu-settings", menuActionListener);
      menuActionListener = null;
    }
  },

  // 토스트 알림 리스너 (Windows용)
  onShowToast: (callback: (data: { title: string; body: string }) => void) => {
    if (toastListener) {
      ipcRenderer.removeListener("show-toast", toastListener);
    }

    toastListener = (event: any, data: any) => {
      callback(data);
    };

    ipcRenderer.on("show-toast", toastListener);
  },

  removeToastListener: () => {
    if (toastListener) {
      ipcRenderer.removeListener("show-toast", toastListener);
      toastListener = null;
    }
  },
} as ElectronAPI);

// 타입 선언은 shared/types.ts에서 관리하므로 여기서는 제거
