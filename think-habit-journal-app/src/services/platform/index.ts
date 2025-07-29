import { ElectronPlatformService } from "./ElectronPlatformService";
import { PlatformService, setPlatformService } from "./PlatformService";
import { WebPlatformService } from "./WebPlatformService";

// 플랫폼 서비스 인스턴스
let platformServiceInstance: PlatformService | null = null;

/**
 * 현재 환경에 맞는 플랫폼 서비스를 초기화합니다.
 */
export function initializePlatformService(): PlatformService {
  // 이미 초기화되어 있으면 기존 인스턴스 반환
  if (platformServiceInstance) {
    return platformServiceInstance;
  }

  // 웹 환경에서 강제로 WebPlatformService 사용
  const forceWebMode =
    typeof window !== "undefined" && window.location.href.includes("localhost");

  // Electron 환경인지 확인
  const isElectron =
    !forceWebMode &&
    typeof window !== "undefined" &&
    window.electronAPI !== undefined;

  if (isElectron) {
    console.log(
      "Electron 환경이 감지되었습니다. Electron 플랫폼 서비스를 초기화합니다.",
    );
    platformServiceInstance = new ElectronPlatformService();
  } else {
    console.log("웹 환경이 감지되었습니다. 웹 플랫폼 서비스를 초기화합니다.");
    platformServiceInstance = new WebPlatformService();
  }

  // 플랫폼 서비스 인스턴스 설정
  setPlatformService(platformServiceInstance);

  return platformServiceInstance;
}

// 타입 정의 내보내기
export * from "./PlatformService";

// 플랫폼 서비스 인스턴스 가져오기 함수
export function getPlatformService(): PlatformService {
  if (!platformServiceInstance) {
    return initializePlatformService();
  }
  return platformServiceInstance;
}

// 플랫폼 서비스 인스턴스 내보내기 (지연 초기화)
export const platformService =
  typeof window !== "undefined"
    ? new Proxy({} as PlatformService, {
        get: (target, prop) => {
          const service = getPlatformService();
          return service[prop as keyof PlatformService];
        },
      })
    : ({} as PlatformService);
