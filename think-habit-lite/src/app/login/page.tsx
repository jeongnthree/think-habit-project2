import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import GoogleAuthService from "../services/googleAuth";
import { AuthResult, LoginCredentials } from "../types/auth";

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleAuthService = new GoogleAuthService();

  // 일반 이메일/패스워드 로그인
  const handleEmailLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // 여기서 실제 로그인 API 호출
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const result: AuthResult = await response.json();

      if (result.success) {
        // 로그인 성공 처리
        localStorage.setItem("auth_token", result.token!);
        localStorage.setItem("auth_user", JSON.stringify(result.user));

        // 대시보드로 리다이렉트
        window.location.href = "/dashboard";
      } else {
        setError(result.error || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google 로그인
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      let result: AuthResult;

      // Electron 환경인지 확인
      if (typeof window !== "undefined" && (window as any).electronAPI) {
        result = await googleAuthService.loginWithElectron();
      } else {
        result = await googleAuthService.loginWithPopup();
      }

      if (result.success) {
        // Google 로그인 성공 시 서버에 사용자 정보 전송
        const serverResponse = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            googleUser: result.user,
            googleToken: result.token,
          }),
        });

        const serverResult: AuthResult = await serverResponse.json();

        if (serverResult.success) {
          // 서버에서 발급한 토큰 저장
          localStorage.setItem("auth_token", serverResult.token!);
          localStorage.setItem("auth_user", JSON.stringify(serverResult.user));

          // 대시보드로 리다이렉트
          window.location.href = "/dashboard";
        } else {
          setError(
            serverResult.error || "Google 로그인 처리 중 오류가 발생했습니다.",
          );
        }
      } else {
        setError(result.error || "Google 로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error("Google 로그인 오류:", err);
      setError("Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div>
      <LoginForm
        onSubmit={handleEmailLogin}
        onGoogleLogin={handleGoogleLogin}
        isLoading={isLoading}
        isGoogleLoading={isGoogleLoading}
        error={error}
      />
    </div>
  );
};

export default LoginPage;
