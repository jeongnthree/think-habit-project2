const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/setupTests.ts',
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)': '<rootDir>/src/$1',
    '^@/lib/(.*)': '<rootDir>/src/lib/$1',
    '^@/components/(.*)': '<rootDir>/src/components/$1',
    '^@/utils/(.*)': '<rootDir>/src/utils/$1',
    '^@/hooks/(.*)': '<rootDir>/src/hooks/$1',
    '^@/types/(.*)': '<rootDir>/src/types/$1',
    '^@/constants/(.*)': '<rootDir>/src/constants/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  // 모듈 디렉토리 설정
  moduleDirectories: ['node_modules', '<rootDir>'],
  // 테스트 환경 설정
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // 모킹 설정
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
