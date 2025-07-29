import {
  AppControlService,
  AppInfoService,
  FileSystemService,
  NotificationService,
  PlatformService,
  StorageService,
} from "./PlatformService";

/**
 * 웹 환경을 위한 스토리지 서비스 구현
 * localStorage를 사용하여 데이터를 저장합니다.
 */
class WebStorageService implements StorageService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`스토리지에서 데이터 가져오기 실패 (${key}):`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`스토리지에 데이터 저장 실패 (${key}):`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`스토리지에서 데이터 삭제 실패 (${key}):`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("스토리지 초기화 실패:", error);
    }
  }
}

/**
 * 웹 환경을 위한 알림 서비스 구현
 * 브라우저의 Notification API를 사용합니다.
 */
class WebNotificationService implements NotificationService {
  async show(title: string, message: string): Promise<void> {
    try {
      // 브라우저 알림 권한 확인
      if (Notification.permission === "granted") {
        new Notification(title, { body: message });
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification(title, { body: message });
        }
      }

      // 콘솔에도 출력 (개발 및 폴백용)
      console.log(`알림: ${title} - ${message}`);
    } catch (error) {
      console.error("알림 표시 실패:", error);
      // 폴백: 콘솔에 출력
      console.log(`알림: ${title} - ${message}`);
    }
  }
}

/**
 * 웹 환경을 위한 앱 정보 서비스 구현
 */
class WebAppInfoService implements AppInfoService {
  async getVersion(): Promise<string> {
    // 웹 환경에서는 하드코딩된 버전 사용 (process 객체가 브라우저에서 정의되지 않음)
    try {
      // @ts-ignore - 브라우저 환경에서 process가 정의되지 않을 수 있음
      return (
        (typeof process !== "undefined" && process.env?.REACT_APP_VERSION) ||
        "1.0.0-web"
      );
    } catch (error) {
      return "1.0.0-web";
    }
  }

  async getPlatformName(): Promise<string> {
    return "웹";
  }

  isElectron(): boolean {
    return false;
  }
}

/**
 * 웹 환경을 위한 앱 제어 서비스 구현
 * 웹에서는 대부분의 기능이 제한적이므로 로깅만 수행합니다.
 */
class WebAppControlService implements AppControlService {
  async quit(): Promise<void> {
    console.log("앱 종료 요청 (웹 환경에서는 지원되지 않음)");
  }

  async minimize(): Promise<void> {
    console.log("앱 최소화 요청 (웹 환경에서는 지원되지 않음)");
  }

  async maximize(): Promise<void> {
    console.log("앱 최대화 요청 (웹 환경에서는 지원되지 않음)");
  }

  async unmaximize(): Promise<void> {
    console.log("앱 최대화 해제 요청 (웹 환경에서는 지원되지 않음)");
  }

  async isMaximized(): Promise<boolean> {
    return false;
  }
}

/**
 * 웹 환경을 위한 파일 시스템 서비스 구현
 * 브라우저의 File API를 사용합니다.
 */
class WebFileSystemService implements FileSystemService {
  async readFile(path: string): Promise<string | null> {
    console.log(`파일 읽기 요청: ${path} (웹 환경에서는 제한적으로 지원)`);
    return null;
  }

  async writeFile(path: string, content: string): Promise<boolean> {
    console.log(`파일 쓰기 요청: ${path} (웹 환경에서는 제한적으로 지원)`);
    return false;
  }

  async saveFile(
    content: string,
    fileName = "download.txt",
    mimeType = "text/plain",
  ): Promise<string | null> {
    try {
      // Blob 생성
      const blob = new Blob([content], { type: mimeType });

      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      // 링크 클릭하여 다운로드 시작
      document.body.appendChild(link);
      link.click();

      // 정리
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return fileName;
    } catch (error) {
      console.error("파일 저장 실패:", error);
      return null;
    }
  }

  async selectFile(options?: { accept?: string }): Promise<File | null> {
    return new Promise((resolve) => {
      // 파일 입력 요소 생성
      const input = document.createElement("input");
      input.type = "file";
      if (options?.accept) {
        input.accept = options.accept;
      }

      // 파일 선택 이벤트 처리
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        resolve(files && files.length > 0 ? files[0] : null);
      };

      // 취소 처리
      input.oncancel = () => resolve(null);

      // 클릭하여 파일 선택 대화상자 표시
      input.click();
    });
  }
}

/**
 * 웹 환경을 위한 통합 플랫폼 서비스
 */
export class WebPlatformService implements PlatformService {
  storage: StorageService;
  notification: NotificationService;
  appInfo: AppInfoService;
  appControl: AppControlService;
  fileSystem: FileSystemService;

  constructor() {
    this.storage = new WebStorageService();
    this.notification = new WebNotificationService();
    this.appInfo = new WebAppInfoService();
    this.appControl = new WebAppControlService();
    this.fileSystem = new WebFileSystemService();

    console.log("웹 플랫폼 서비스가 초기화되었습니다.");
  }
}
