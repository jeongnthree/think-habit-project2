import React, { useEffect } from "react";
import { LoginForm } from "../components/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // 이미 인증된 상태라면 메인 화면으로 이동
    if (isAuthenticated && !loading) {
      onLoginSuccess();
    }
  }, [isAuthenticated, loading, onLoginSuccess]);

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-loading">
          <div className="loading-spinner large"></div>
          <p>인증 상태를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-content">
          <LoginForm
            onLoginSuccess={onLoginSuccess}
            onSwitchToRegister={() => {
              // TODO: 회원가입 페이지로 전환
              console.log("Switch to register");
            }}
          />
        </div>
      </div>
    </div>
  );
};
