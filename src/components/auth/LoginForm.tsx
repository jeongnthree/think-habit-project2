'use client';

import Link from 'next/link';
import React, { useState } from 'react';
// import styles from './LoginForm.module.css'; // 임시 주석 처리

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  onGoogleLogin: () => void;
  isLoading?: boolean;
  isGoogleLoading?: boolean;
  error?: string;
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
  const [email, setEmail] = useState<string>('test@think-habit.com');
  const [password, setPassword] = useState<string>('test123');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!password) {
      newErrors.password = '패스워드를 입력해주세요.';
    } else if (password.length < 6) {
      newErrors.password = '패스워드는 최소 6자 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({ email, password });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl p-8 w-full max-w-md'>
        <div className='text-center mb-6'>
          <div className='flex justify-center mb-3'>
            <img
              src='/images/think-habit-logo.png'
              alt='생각도 습관입니다 - Think Habit 로고'
              className='h-8 object-contain'
            />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-1'>로그인</h1>
          <p className='text-gray-600 text-sm'>
            훈련 일지 앱에 오신 것을 환영합니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6' noValidate>
          {error && (
            <div
              className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm'
              role='alert'
            >
              {error}
            </div>
          )}

          <div className='mb-4'>
            <button
              type='button'
              onClick={(e) => {
                e.preventDefault();
                console.log('🔵 Google 로그인 버튼 클릭됨');
                onGoogleLogin();
              }}
              className={`w-full bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-center gap-3 ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600'></div>
                  Google 로그인 중...
                </>
              ) : (
                <>
                  <svg
                    className='w-5 h-5'
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                  >
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Google로 로그인
                </>
              )}
            </button>
          </div>

          <div className='flex items-center my-6'>
            <div className='flex-1 border-t border-gray-300'></div>
            <span className='px-4 text-sm text-gray-500 font-medium'>또는</span>
            <div className='flex-1 border-t border-gray-300'></div>
          </div>

          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                이메일
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder='이메일을 입력하세요'
                autoComplete='email'
                disabled={isLoading || isGoogleLoading}
              />
              {errors.email && (
                <span className='text-red-500 text-xs mt-1 block' role='alert'>
                  {errors.email}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                패스워드
              </label>
              <input
                id='password'
                type='password'
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder='패스워드를 입력하세요'
                autoComplete='current-password'
                disabled={isLoading || isGoogleLoading}
              />
              {errors.password && (
                <span className='text-red-500 text-xs mt-1 block' role='alert'>
                  {errors.password}
                </span>
              )}
            </div>
          </div>

          <button
            type='submit'
            className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        <div className='mt-8 text-center text-sm'>
          <Link
            href='/reset-password'
            className='text-blue-600 hover:text-blue-800 font-medium'
          >
            패스워드를 잊으셨나요?
          </Link>
          <span className='mx-2 text-gray-400'>|</span>
          <Link
            href='/signup'
            className='text-blue-600 hover:text-blue-800 font-medium'
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
