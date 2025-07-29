import {
  AppControlService,
  AppInfoService,
  FileSystemService,
  NotificationService,
  PlatformService,
  StorageService,
} from "./PlatformService";

/**
 * Electron 환경을 위한 스토리지 서비스 구현
 * Electron Store API를 사용하여 데이터를 저장합니다.
 */
class ElectronStorageService implements StorageService {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!window.electronAPI?.store) {
        throw new Error("Electron Store API를 사용할 수 없습니다.");
      }
      return await window.electronAPI.store.get(key);
    } catch (error) {
      console.error(`스토리지에서 데이터 가져오기 실패 (${key}):`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (!window.electronAPI?.store) {
        throw new Error("Electron Store API를 사용할 수 없습니다.");
      }
      await window.electronAPI.store.set(key, value);
    } catch (error) {
      console.error(`스토리지에 데이터 저장 실패 (${key}):`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (!window.electronAPI?.store) {
        throw new Error("Electron Store API를 사용할 수 없습니다.");
      }
      await window.electronAPI.store.set(key, null);
    } catch (error) {
      console.error(`스토리지에서 데이터 삭제 실패 (${key}):`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (!window.electronAPI?.store) {
        throw new Error("Electron Store API를 사용할 수 없습니다.");
      }
      await window.electronAPI.store.clear();
    } catch (error) {
      console.error("스토리지 초기화 실패:", error);
    }
  }
}

/**
 * Electron 환경을 위한 알림 서비스 구현
 * Electron의 알림 API를 사용합니다.
 */
class ElectronNotificationService implements NotificationService {
  async show(title: string, message: string): Promise<void> {
    try {
      if (!window.electronAPI?.showNotification) {
        throw new Error("Electron 알림 API를 사용할 수 없습니다.");
      }
      await window.electronAPI.showNotification(title, message);
    } catch (error) {
      console.error("알림 표시 실패:", error);
      // 폴백: 콘솔에 출력
      console.log(`알림: ${title} - ${message}`);
    }
  }
}

/**
 * Electron 환경을 위한 앱 정보 서비스 구현
 */
class ElectronAppInfoService implements AppInfoService {
  async getVersion(): Promise<string> {
    try {
      if (!window.electronAPI?.app?.getVersion) {
        throw new Error("Electron 앱 API를 사용할 수 없습니다.");
      }
      return await window.electronAPI.app.getVersion();
    } catch (error) {
      console.error("앱 버전 가져오기 실패:", error);
      return "1.0.0";
    }
  }

  async getPlatformName(): Promise<string> {
    return "Electron";
  }

  isElectron(): boolean {
    return true;
  }
}

/**
 * Electron 환경을 위한 앱 제어 서비스 구현
 */
class ElectronAppControlService implements AppControlService {
  async quit(): Promise<void> {
    try {
      if (!window.electronAPI?.app?.quit) {
        throw new Error("Electron 앱 API를 사용할 수 없습니다.");
      }
      await window.electronAPI.app.quit();
    } catch (error) {
      console.error("앱 종료 실패:", error);
    }
  }

  async minimize(): Promise<void> {
    try {
      if (!window.electronAPI?.app?.minimize) {
        throw new Error("Electron 앱 API를 사용할 수 없습니다.");
      }
      await window.electronAPI.app.minimize();
    } catch (error) {
      console.error("앱 최소화 실패:", error);
    }
  }

  async maximize(): Promise<void> {
    try {
      if (!window.electronAPI?.app?.maximize) {
        throw new Error("Electron 앱 API를 사용할 수 없습니다.");
      }
      await window.electronAPI.app.maximize();
    } catch (error) {
      console.error("앱 최대화 실패:", error);
    }
  }

  async unmaximize(): Promise<void> {
    try {
      if (!window.electronAPI?.app?.unmaximize) {
        throw new Error("Electron 앱 API를 사용할 수 없습니다.");
      }
      await window.electronAPI.app.unmaximize();
    } catch (error) {
      console.error("앱 최대화 해제 실패:", error);
    }
  }

  async isMaximized(): Promise<boolean> {
    try {
      if (!window.electronAPI?.app?.isMaximized) {
        throw new Error("Electron 앱 API를 사용할 수 없습니다.");
      }
      return await window.electronAPI.app.isMaximized();
    } catch (error) {
      console.error("앱 최대화 상태 확인 실패:", error);
      return false;
    }
  }
}

/**
 * Electron 환경을 위한 파일 시스템 서비스 구현
 */
class ElectronFileSystemService implements FileSystemService {
  async readFile(path: string): Promise<string | null> {
    try {
      if (!window.electronAPI?.fs?.readFile) {
        throw new Error("Electron 파일 시스템 API를 사용할 수 없습니다.");
      }
      return await window.electronAPI.fs.readFile(path);
    } catch (error) {
      console.error(`파일 읽기 실패 (${path}):`, error);
      return null;
    }
  }

  async writeFile(path: string, content: string): Promise<boolean> {
    try {
      if (!window.electronAPI?.fs?.writeFile) {
        throw new Error("Electron 파일 시스템 API를 사용할 수 없습니다.");
      }
      await window.electronAPI.fs.writeFile(path, content);
      return true;
    } catch (error) {
      console.error(`파일 쓰기 실패 (${path}):`, error);
      return false;
    }
  }

  async saveFile(
    content: string,
    fileName = "download.txt",
    mimeType = "text/plain",
  ): Promise<string | null> {
    try {
      if (!window.electronAPI?.dialog?.saveFile) {
        throw new Error("Electron 대화상자 API를 사용할 수 없습니다.");
      }
      return await window.electronAPI.dialog.saveFile(
        content,
        fileName,
        mimeType,
      );
    } catch (error) {
      console.error("파일 저장 실패:", error);
      return null;
    }
  }

  async selectFile(options?: { accept?: string }): Promise<File | null> {
    try {
      if (!window.electronAPI?.dialog?.openFile) {
        throw new Error("Electron 대화상자 API를 사용할 수 없습니다.");
      }
      const filePath = await window.electronAPI.dialog.openFile(options);
      if (!filePath) return null;

      // Electron에서 선택한 파일 경로를 File 객체로 변환
      const content = await this.readFile(filePath);
      if (!content) return null;

      const fileName = filePath.split(/[/\\]/).pop() || "unknown";
      const blob = new Blob([content], { type: "application/octet-stream" });
      return new File([blob], fileName);
    } catch (error) {
      console.error("파일 선택 실패:", error);
      return null;
    }
  }
}

/**
 * Electron 환경을 위한 통합 플랫폼 서비스
 */
export class ElectronPlatformService implements PlatformService {
  storage: StorageService;
  notification: NotificationService;
  appInfo: AppInfoService;
  appControl: AppControlService;
  fileSystem: FileSystemService;

  constructor() {
    this.storage = new ElectronStorageService();
    this.notification = new ElectronNotificationService();
    this.appInfo = new ElectronAppInfoService();
    this.appControl = new ElectronAppControlService();
    this.fileSystem = new ElectronFileSystemService();

    console.log("Electron 플랫폼 서비스가 초기화되었습니다.");
  }
}
