// contexts/index.ts
/**
 * 모든 Context Provider들을 내보내는 중앙 집중화된 파일
 * 다른 파일에서 Context를 import할 때 사용합니다.
 */

// AuthContext 관련 export
export {
  AuthProvider,
  useAuthContext,
  withAuth,
  RoleGuard,
  AuthLoading,
  type AuthContextType,
} from "./AuthContext";

// 향후 추가될 다른 Context들을 위한 placeholder
// export { ThemeProvider, useThemeContext } from './ThemeContext';
// export { NotificationProvider, useNotificationContext } from './NotificationContext';
