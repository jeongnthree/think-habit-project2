/**
 * 플랫폼 독립적인 서비스를 위한 인터페이스
 * 웹과 Electron 환경 모두에서 일관된 API를 제공합니다.
 */

// 스토리지 인터페이스
export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 알림 인터페이스
export interface NotificationService {
  show(title: string, message: string): Promise<void>;
}

// 앱 정보 인터페이스
export interface AppInfoService {
  getVersion(): Promise<string>;
  getPlatformName(): Promise<string>;
  isElectron(): boolean;
}

// 앱 제어 인터페이스
export interface AppControlService {
  quit(): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  unmaximize(): Promise<void>;
  isMaximized(): Promise<boolean>;
}

// 파일 시스템 인터페이스
export interface FileSystemService {
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<boolean>;
  saveFile(
    content: string,
    fileName?: string,
    mimeType?: string,
  ): Promise<string | null>;
  selectFile(options?: { accept?: string }): Promise<File | null>;
}

// 통합 플랫폼 서비스 인터페이스
export interface PlatformService {
  storage: StorageService;
  notification: NotificationService;
  appInfo: AppInfoService;
  appControl: AppControlService;
  fileSystem: FileSystemService;
}

// 플랫폼 서비스 인스턴스를 저장할 변수
let platformServiceInstance: PlatformService | null = null;

// 플랫폼 서비스 인스턴스 설정
export function setPlatformService(service: PlatformService): void {
  platformServiceInstance = service;
}

// 플랫폼 서비스 인스턴스 가져오기
export function getPlatformService(): PlatformService {
  if (!platformServiceInstance) {
    throw new Error("PlatformService가 초기화되지 않았습니다.");
  }
  return platformServiceInstance;
}
