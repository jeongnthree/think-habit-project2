/**
 * Electron API에 대한 타입 정의
 */
interface ElectronStore {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  clear: () => Promise<void>;
}

interface ElectronApp {
  getVersion: () => Promise<string>;
  quit: () => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

interface ElectronDialog {
  openFile: (options?: { accept?: string }) => Promise<string | null>;
  saveFile: (
    content: string,
    fileName?: string,
    mimeType?: string,
  ) => Promise<string | null>;
}

interface ElectronFS {
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, content: string) => Promise<void>;
}

interface ElectronAPI {
  store: ElectronStore;
  app: ElectronApp;
  dialog: ElectronDialog;
  fs: ElectronFS;
  showNotification: (title: string, message: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
