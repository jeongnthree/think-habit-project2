import React, { useState } from "react";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  onGoogleLogin: () => void;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  error?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onGoogleLogin,
  isLoading = false,
  isGoogleLoading = false,
  error,
}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 이메일 유효성 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    // 패스워드 유효성 검증
    if (!password) {
      newErrors.password = "패스워드를 입력해주세요.";
    } else if (password.length < 6) {
      newErrors.password = "패스워드는 최소 6자 이상이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({ email, password });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // 실시간 에러 제거
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // 실시간 에러 제거
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.title}>Think-Habit 로그인</h1>
          <p className={styles.subtitle}>훈련 일지 앱에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
          {/* 전체 폼 에러 메시지 */}
          {error && (
            <div className={styles.errorAlert} role="alert">
              {error}
            </div>
          )}

          {/* 이메일 필드 */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              placeholder="이메일을 입력하세요"
              autoComplete="email"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.email && (
              <span
                id="email-error"
                className={styles.errorMessage}
                role="alert"
              >
                {errors.email}
              </span>
            )}
          </div>

          {/* 패스워드 필드 */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              패스워드
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              placeholder="패스워드를 입력하세요"
              autoComplete="current-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={!!errors.password}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.password && (
              <span
                id="password-error"
                className={styles.errorMessage}
                role="alert"
              >
                {errors.password}
              </span>
            )}
          </div>

          {/* Google 로그인 버튼 */}
          <div className={styles.googleSection}>
            <button
              type="button"
              onClick={onGoogleLogin}
              className={`${styles.googleButton} ${isGoogleLoading ? styles.loading : ""}`}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true"></span>
                  Google 로그인 중...
                </>
              ) : (
                <>
                  <svg
                    className={styles.googleIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 계속하기
                </>
              )}
            </button>
          </div>

          {/* 구분선 */}
          <div className={styles.dividerSection}>
            <div className={styles.dividerLine}></div>
            <span className={styles.dividerText}>또는</span>
            <div className={styles.dividerLine}></div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className={`${styles.submitButton} ${isLoading ? styles.loading : ""}`}
            disabled={isLoading}
            aria-describedby={isLoading ? "loading-status" : undefined}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} aria-hidden="true"></span>
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </button>

          {/* 로딩 상태 스크린 리더용 */}
          {isLoading && (
            <span id="loading-status" className={styles.srOnly}>
              로그인을 처리하고 있습니다. 잠시만 기다려주세요.
            </span>
          )}
        </form>

        {/* 추가 링크들 */}
        <div className={styles.loginFooter}>
          <a href="#forgot-password" className={styles.link}>
            패스워드를 잊으셨나요?
          </a>
          <div className={styles.divider}>|</div>
          <a href="#signup" className={styles.link}>
            회원가입
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
