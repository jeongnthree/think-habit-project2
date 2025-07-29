'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { LoginCredentials } from '../../../shared/types/auth';
import LoginForm from '../../components/auth/LoginForm';
import { signInWithGoogle, signInWithEmail, getCurrentUser } from '../../lib/supabase/auth';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 페이지 로드 시 이미 로그인된 사용자 확인
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        console.log('✅ 이미 로그인된 사용자:', user.email);
        router.push('/dashboard');
      }
    } catch (err) {
      console.log('인증 상태 확인 중 오류:', err);
    }
  };

  // Supabase 이메일/패스워드 로그인
  const handleEmailLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithEmail(credentials.email, credentials.password);

      if (result.success && result.user) {
        console.log('✅ 이메일 로그인 성공:', result.user.email);
        router.push('/dashboard');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase Google OAuth 로그인
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error: googleError } = await signInWithGoogle('/dashboard');
      
      if (googleError) {
        console.error('❌ Google 로그인 실패:', googleError);
        setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
        setIsGoogleLoading(false);
      }
      // 성공 시 Google 페이지로 리디렉션되므로 로딩 상태는 유지됨
      
    } catch (err) {
      console.error('❌ Google 로그인 오류:', err);
      setError('Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
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
        error={error || undefined}
      />
    </div>
  );
};

export default LoginPage;
