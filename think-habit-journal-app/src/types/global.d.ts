// src/types/global.d.ts
interface Window {
  electronAPI?: {
    app: {
      getVersion: () => Promise<string>;
      quit: () => void;
      minimize: () => void;
      maximize: () => void;
      unmaximize: () => void;
      isMaximized: () => Promise<boolean>;
    };
    store: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
    };
    showNotification: (title: string, body: string) => Promise<void>;
  };
}
