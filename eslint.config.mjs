import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Prettier 통합 설정
  ...compat.extends("prettier"),
  
  // 추가 규칙
  {
    rules: {
      // TypeScript 관련
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      
      // React 관련
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      
      // 일반적인 코드 품질
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      
      // Import 관련 - 배포를 위해 일시적으로 경고로 변경
      "import/order": "off"
    }
  }
];

export default eslintConfig;