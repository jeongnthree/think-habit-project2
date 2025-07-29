import React from "react";
import { LoginForm } from "./LoginForm";
import "./LoginPage.css";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-logo">
            <div className="logo-icon">🎯</div>
            <h1 className="app-title">Think-Habit Journal</h1>
          </div>
          <p className="app-subtitle">생각습관 개선을 위한 훈련 일지</p>
        </div>

        <div className="login-content">
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>

        <div className="login-footer">
          <p className="version-info">Version 1.0.0</p>
          <div className="footer-links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              도움말
            </a>
            <span className="separator">•</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>

      <div className="login-background">
        <div className="bg-pattern"></div>
      </div>
    </div>
  );
};
