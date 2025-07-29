// src/shared/types/global.d.ts
import { ElectronAPI } from "../../main/preload";

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }

  // Node.js globals for main process
  namespace NodeJS {
    interface Global {
      __dirname: string;
      __filename: string;
    }
  }
}

export {};
