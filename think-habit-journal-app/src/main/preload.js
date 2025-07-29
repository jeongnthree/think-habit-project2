// src/main/preload.ts
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  app: {
    getVersion: () => "1.0.0",
  },
});
