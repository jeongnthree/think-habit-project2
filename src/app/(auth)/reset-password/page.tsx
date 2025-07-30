// app/(auth)/reset-password/page.tsx
'use client';

import { useAuthContext } from '@/contexts';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  // 상태 관리
  const [step, setStep] = useState<'request' | 'success' | 'update'>('request');
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 라우터 및 인증
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    resetPassword,
    updatePassword,
    isAuthenticated,
    loading,
    error: authError,
  } = useAuthContext();

  // URL 파라미터 확인 (토큰이 있으면 비밀번호 업데이트 모드)
  const accessToken = searchParams?.get('access_token');
  const type = searchParams?.get('type');

  /**
   * 초기화 - URL 파라미터에 따라 모드 결정
   */
  useEffect(() => {
    if (accessToken && type === 'recovery') {
      setStep('update');
    }
  }, [accessToken, type]);

  /**
   * 이미 로그인된 사용자 리다이렉트 (비밀번호 업데이트 모드가 아닌 경우)
   */
  useEffect(() => {
    if (!loading && isAuthenticated && step === 'request') {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router, step]);

  /**
   * 폼 입력 핸들러
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 입력 시 에러 메시지 초기화
    if (localError) setLocalError(null);
  };

  /**
   * 이메일 검증
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 비밀번호 검증
   */
  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  /**
   * 비밀번호 재설정 이메일 발송
   */
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      setLocalError('이메일을 입력해주세요.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setLocalError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const { error } = await resetPassword({ email: formData.email });

      if (error) {
        // 보안상 실제 가입 여부를 노출하지 않음
        if (
          error.includes('User not found') ||
          error.includes('user not found')
        ) {
          setLocalError('해당 이메일로 가입된 계정이 없습니다.');
        } else {
          setLocalError(
            '이메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          );
        }
      } else {
        // 성공 - 이메일 발송 완료
        setStep('success');
      }
    } catch (error) {
      setLocalError(
        '비밀번호 재설정 요청 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 새 비밀번호 설정
   */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      setLocalError('모든 필드를 입력해주세요.');
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setLocalError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const { error } = await updatePassword({
        password: formData.newPassword,
      });

      if (error) {
        setLocalError(
          '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.'
        );
      } else {
        // 성공 - 로그인 페이지로 이동
        router.push('/login?message=password_updated');
      }
    } catch (error) {
      setLocalError('비밀번호 변경 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중일 때 (초기 인증 확인)
  if (loading && step === 'request') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // 에러 메시지 결정
  const displayError = localError || authError;

  return (
    <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {/* 로고 및 제목 */}
        <div className='text-center'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            {step === 'request' && '비밀번호 재설정'}
            {step === 'success' && '이메일 발송 완료'}
            {step === 'update' && '새 비밀번호 설정'}
          </h2>
          <p className='text-sm text-gray-600 mb-8'>
            {step === 'request' && '가입하신 이메일을 입력해주세요'}
            {step === 'success' && '재설정 링크를 확인해주세요'}
            {step === 'update' && '새로운 비밀번호를 입력해주세요'}
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className='flex justify-center mb-8'>
          <div className='flex items-center space-x-4'>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'request'
                  ? 'bg-blue-600 text-white'
                  : step === 'success' || step === 'update'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              1
            </div>
            <div
              className={`w-8 h-1 ${step === 'success' || step === 'update' ? 'bg-green-600' : 'bg-gray-200'}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'success'
                  ? 'bg-blue-600 text-white'
                  : step === 'update'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <div
              className={`w-8 h-1 ${step === 'update' ? 'bg-green-600' : 'bg-gray-200'}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'update'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              3
            </div>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className='bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10'>
          {/* 1단계: 이메일 입력 */}
          {step === 'request' && (
            <>
              {/* 에러 메시지 */}
              {displayError && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                  <div className='flex'>
                    <AlertCircle className='h-5 w-5 text-red-400 mr-2 mt-0.5' />
                    <p className='text-sm text-red-600'>{displayError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRequestReset} className='space-y-6'>
                {/* 이메일 입력 */}
                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    이메일 주소
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Mail className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      autoComplete='email'
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                      placeholder='가입하신 이메일을 입력하세요'
                    />
                  </div>
                  <p className='mt-2 text-xs text-gray-500'>
                    입력하신 이메일로 비밀번호 재설정 링크를 보내드립니다.
                  </p>
                </div>

                {/* 재설정 링크 발송 버튼 */}
                <div>
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                  >
                    {isLoading ? (
                      <div className='flex items-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        발송 중...
                      </div>
                    ) : (
                      '재설정 링크 발송'
                    )}
                  </button>
                </div>
              </form>

              {/* 로그인 페이지 복귀 */}
              <div className='mt-6'>
                <Link
                  href='/login'
                  className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  로그인 페이지로 돌아가기
                </Link>
              </div>

              {/* 도움말 */}
              <div className='mt-6 text-center'>
                <p className='text-xs text-gray-500'>
                  계정이 없으신가요?{' '}
                  <Link
                    href='/signup'
                    className='font-medium text-blue-600 hover:text-blue-500'
                  >
                    회원가입하기
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* 2단계: 성공 메시지 */}
          {step === 'success' && (
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
                <Check className='h-6 w-6 text-green-600' />
              </div>

              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                이메일을 확인해주세요
              </h3>

              <p className='text-sm text-gray-600 mb-6'>
                <span className='font-medium'>{formData.email}</span>로<br />
                비밀번호 재설정 링크를 발송했습니다.
                <br />
                메일함을 확인하고 링크를 클릭해주세요.
              </p>

              <div className='space-y-4'>
                <button
                  onClick={() => setStep('request')}
                  className='w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  다른 이메일로 다시 시도
                </button>

                <Link
                  href='/login'
                  className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  로그인 페이지로 이동
                </Link>
              </div>

              <div className='mt-6 text-xs text-gray-500 space-y-1'>
                <p>메일이 오지 않았나요?</p>
                <p>• 스팸함을 확인해보세요</p>
                <p>• 몇 분 후 다시 확인해보세요</p>
                <p>• 이메일 주소가 정확한지 확인해보세요</p>
              </div>
            </div>
          )}

          {/* 3단계: 새 비밀번호 설정 */}
          {step === 'update' && (
            <>
              <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
                <div className='flex items-center space-x-3'>
                  <Check className='w-5 h-5 text-blue-600' />
                  <span className='text-sm font-medium text-blue-900'>
                    이메일 인증이 완료되었습니다
                  </span>
                </div>
              </div>

              {/* 에러 메시지 */}
              {displayError && (
                <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                  <div className='flex'>
                    <AlertCircle className='h-5 w-5 text-red-400 mr-2 mt-0.5' />
                    <p className='text-sm text-red-600'>{displayError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className='space-y-6'>
                {/* 새 비밀번호 */}
                <div>
                  <label
                    htmlFor='newPassword'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    새 비밀번호
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='newPassword'
                      name='newPassword'
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      required
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className='block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                      placeholder='새 비밀번호를 입력하세요'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    >
                      {showPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                      )}
                    </button>
                  </div>
                  <p className='mt-1 text-xs text-gray-500'>
                    8자 이상의 비밀번호를 입력해주세요.
                  </p>
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label
                    htmlFor='confirmPassword'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    비밀번호 확인
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400' />
                    </div>
                    <input
                      id='confirmPassword'
                      name='confirmPassword'
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete='new-password'
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`
                        block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm
                        ${
                          formData.confirmPassword &&
                          formData.newPassword !== formData.confirmPassword
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }
                      `}
                      placeholder='비밀번호를 다시 입력하세요'
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                      ) : (
                        <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword &&
                    formData.newPassword !== formData.confirmPassword && (
                      <p className='mt-1 text-sm text-red-600'>
                        비밀번호가 일치하지 않습니다.
                      </p>
                    )}
                </div>

                {/* 비밀번호 변경 버튼 */}
                <div>
                  <button
                    type='submit'
                    disabled={
                      isLoading ||
                      formData.newPassword !== formData.confirmPassword
                    }
                    className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                  >
                    {isLoading ? (
                      <div className='flex items-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                        변경 중...
                      </div>
                    ) : (
                      '비밀번호 변경'
                    )}
                  </button>
                </div>
              </form>

              {/* 로그인 페이지 복귀 */}
              <div className='mt-6'>
                <Link
                  href='/login'
                  className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
