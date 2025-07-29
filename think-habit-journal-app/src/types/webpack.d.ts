/**
 * Webpack 모듈 핫 리로딩을 위한 타입 정의
 */
declare interface NodeModule {
  hot?: {
    accept(path: string, callback: () => void): void;
  };
}
