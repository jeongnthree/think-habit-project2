import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./LoginForm.css";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "demo@example.com", // 데모 계정 정보 미리 입력
    password: "password123",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 폼 검증
  const isFormValid =
    credentials.email.trim() !== "" && credentials.password.length >= 6;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 입력 시 에러 메시지 클리어
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("이메일과 비밀번호를 올바르게 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // useAuth 훅의 login 함수 사용
      await login(credentials.email, credentials.password);

      // Remember Me 설정 저장
      if (rememberMe) {
        localStorage.setItem("rememberEmail", credentials.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      onLoginSuccess?.();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "로그인에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 저장된 이메일 복원
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setCredentials((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="login-form-container">
      <div className="login-form-header">
        <h1>Think-Habit Journal</h1>
        <p>생각 습관 개선을 위한 개인 일지</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleInputChange}
            placeholder="이메일을 입력하세요"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력하세요"
              required
              minLength={6}
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <div className="form-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span>이메일 기억하기</span>
          </label>

          <button
            type="button"
            className="link-button"
            onClick={() => {
              /* TODO: 비밀번호 재설정 */
            }}
            disabled={isLoading}
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="login-button"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </button>

        <div className="form-footer">
          <p>
            계정이 없으신가요?{" "}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              회원가입
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
