module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom", // 웹 환경 테스트를 위한 jsdom
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/*.(test|spec).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    electron: "<rootDir>/src/__mocks__/electron.ts",
    // 문제가 되는 모듈 모킹
    "@pkgr/core": "<rootDir>/src/__mocks__/pkgr-core.js",
    synckit: "<rootDir>/src/__mocks__/synckit.js",
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testTimeout: 10000,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  // 테스트 환경에서 window 객체 사용 가능하도록 설정
  testEnvironmentOptions: {
    url: "http://localhost/",
  },
};
