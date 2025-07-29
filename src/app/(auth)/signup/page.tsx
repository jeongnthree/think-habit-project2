// app/(auth)/signup/page.tsx
'use client';

import DirectGoogleLogin from '@/components/auth/DirectGoogleLogin';
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase/auth';
import {
  Building,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  Home,
  Lock,
  Mail,
  Phone,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 회원 분류 타입
type MembershipType = 'individual' | 'family' | 'tutoring' | 'organization';

// 회원 분류 정보
const MEMBERSHIP_TYPES = {
  individual: {
    id: 'individual' as MembershipType,
    name: '개인 회원',
    description: '개인 사용자를 위한 기본 서비스',
    icon: User,
    color: 'blue',
    features: ['개인 진단', '맞춤 처방', '훈련 기록', '커뮤니티'],
  },
  family: {
    id: 'family' as MembershipType,
    name: '가족 회원',
    description: '가족 구성원이 함께 이용할 수 있는 서비스',
    icon: Home,
    color: 'green',
    features: ['가족 계정 관리', '자녀 모니터링', '가족 리포트', '상담 지원'],
  },
  tutoring: {
    id: 'tutoring' as MembershipType,
    name: '과외 회원',
    description: '개인 지도 및 과외를 위한 전문 서비스',
    icon: GraduationCap,
    color: 'purple',
    features: ['학생 관리', '진도 추적', '성과 분석', '학부모 리포트'],
  },
  organization: {
    id: 'organization' as MembershipType,
    name: '단체 회원',
    description: '학교, 학원, 회사 등 단체를 위한 서비스',
    icon: Building,
    color: 'orange',
    features: ['대량 계정 관리', '통계 대시보드', '관리자 도구', '정책 설정'],
  },
};

// 비밀번호 강도 체크
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    score,
    checks,
    strength:
      score <= 2
        ? 'weak'
        : score <= 3
          ? 'medium'
          : score <= 4
            ? 'strong'
            : 'very-strong',
  };
};

export default function SignUpPage() {
  // 상태 관리
  const [step, setStep] = useState<'type' | 'form' | 'verification'>('type');
  const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
  const [formData, setFormData] = useState({
    membershipType: '' as MembershipType | '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    birthDate: '',
    organizationName: '',
    organizationType: '' as 'school' | 'academy' | 'company' | '',
    familyName: '',
    tutorName: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(
    checkPasswordStrength('')
  );

  // 라우터
  const router = useRouter();

  // 이미 로그인된 사용자 확인은 제거 (필요시 추가)

  /**
   * 비밀번호 강도 업데이트
   */
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password));
    }
  }, [formData.password]);

  /**
   * 폼 입력 핸들러
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // 입력 시 에러 메시지 초기화
    if (localError) setLocalError(null);
  };

  /**
   * 회원 분류 선택
   */
  const handleTypeSelection = (type: MembershipType) => {
    setSelectedType(type);
    setFormData(prev => ({ ...prev, membershipType: type }));
    setStep('form');
  };

  /**
   * 폼 검증
   */
  const validateForm = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.phone
    ) {
      setLocalError('필수 항목을 모두 입력해주세요.');
      return false;
    }

    if (!formData.email.includes('@')) {
      setLocalError('올바른 이메일 주소를 입력해주세요.');
      return false;
    }

    if (formData.password.length < 8) {
      setLocalError('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    // 연락처 형식 검증
    if (formData.phone) {
      const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(formData.phone.replace(/-/g, ''))) {
        setLocalError('올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)');
        return false;
      }
    }

    // 단체 회원이 아닌 경우 생년월일 필수
    if (formData.membershipType !== 'organization' && !formData.birthDate) {
      setLocalError('생년월일을 입력해주세요.');
      return false;
    }

    // 만 14세 미만 체크
    if (formData.birthDate && formData.membershipType !== 'organization') {
      const today = new Date();
      const birthDate = new Date(formData.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age = age - 1;
      }

      if (age < 14) {
        setLocalError(
          '만 14세 미만은 보호자 동의가 필요합니다. 고객센터로 문의해주세요.'
        );
        return false;
      }
    }

    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setLocalError('필수 약관에 동의해주세요.');
      return false;
    }

    // 회원 유형별 필수 항목 검증
    if (
      formData.membershipType === 'organization' &&
      !formData.organizationName
    ) {
      setLocalError('단체명을 입력해주세요.');
      return false;
    }

    if (formData.membershipType === 'family' && !formData.familyName) {
      setLocalError('가족 이름을 입력해주세요.');
      return false;
    }

    if (formData.membershipType === 'tutoring' && !formData.tutorName) {
      setLocalError('과외 선생님 이름을 입력해주세요.');
      return false;
    }

    return true;
  };

  /**
   * 회원가입 처리
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setLocalError(null);

    try {
      // 역할 결정 (기본은 학습자, 단체 회원은 감독)
      const role = formData.membershipType === 'organization' ? 2 : 1;

      // 연락처 형식 정리 (하이픈 추가)
      let formattedPhone = formData.phone;
      if (formData.phone && !formData.phone.includes('-')) {
        const phone = formData.phone.replace(/-/g, '');
        if (phone.length === 10) {
          formattedPhone = `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
        } else if (phone.length === 11) {
          formattedPhone = `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
        }
      }

      // 추가 정보 준비
      const additionalData: Record<string, any> = {};

      // 회원 유형별 추가 정보
      if (formData.membershipType === 'organization') {
        additionalData.organizationName = formData.organizationName;
        additionalData.organizationType = formData.organizationType;
      } else if (formData.membershipType === 'family') {
        additionalData.familyName = formData.familyName;
      } else if (formData.membershipType === 'tutoring') {
        additionalData.tutorName = formData.tutorName;
      }

      const result = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.name
      );

      if (result.error) {
        setLocalError(getKoreanErrorMessage(result.error));
      } else {
        // 회원가입 성공 - 이메일 인증 단계로
        setStep('verification');
      }
    } catch (error) {
      setLocalError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Google 회원가입 처리 (Supabase 사용)
   */
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setLocalError(null);

    try {
      const { error: googleError } = await signInWithGoogle('/dashboard');
      
      if (googleError) {
        console.error('❌ Google 회원가입 실패:', googleError);
        setLocalError('Google 회원가입에 실패했습니다. 다시 시도해주세요.');
        setIsLoading(false);
      }
      // 성공 시 Google 페이지로 리디렉션되므로 로딩 상태는 유지됨
      
    } catch (error) {
      setLocalError('Google 회원가입을 사용할 수 없습니다.');
      setIsLoading(false);
    }
  };

  /**
   * 에러 메시지 한국어 변환
   */
  const getKoreanErrorMessage = (error: string): string => {
    if (
      error.includes('already registered') ||
      error.includes('already exists')
    ) {
      return '이미 가입된 이메일입니다. 로그인을 시도해보세요.';
    }
    if (error.includes('weak password')) {
      return '비밀번호가 너무 간단합니다. 더 복잡한 비밀번호를 사용해주세요.';
    }
    if (error.includes('invalid email')) {
      return '올바르지 않은 이메일 형식입니다.';
    }
    return error || '회원가입 중 오류가 발생했습니다.';
  };

  // 에러 메시지 결정
  const displayError = localError;

  return (
    <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        {/* 로고 및 제목 */}
        <div className='text-center'>
          <div className='flex justify-center mb-4'>
            <img
              src='/images/think-habit-logo.png'
              alt='생각도 습관입니다 - Think Habit 로고'
              className='h-8 object-contain'
            />
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-1'>회원가입</h2>
          <p className='text-sm text-gray-600 mb-8'>
            {step === 'type' && '원하시는 회원 유형을 선택해주세요'}
            {step === 'form' && '회원 정보를 입력해주세요'}
            {step === 'verification' && '이메일 인증을 완료해주세요'}
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className='flex justify-center mb-8'>
          <div className='flex items-center space-x-4'>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'type'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              1
            </div>
            <div
              className={`w-8 h-1 ${step !== 'type' ? 'bg-blue-600' : 'bg-gray-200'}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'form'
                  ? 'bg-blue-600 text-white'
                  : step === 'verification'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <div
              className={`w-8 h-1 ${step === 'verification' ? 'bg-green-600' : 'bg-gray-200'}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'verification'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              3
            </div>
          </div>
        </div>
      </div>

      {/* 1단계: 회원 분류 선택 */}
      {step === 'type' && (
        <div className='sm:mx-auto sm:w-full sm:max-w-4xl'>
          <div className='bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {Object.values(MEMBERSHIP_TYPES).map(type => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    onClick={() => handleTypeSelection(type.id)}
                    className={`
                      p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                      ${
                        selectedType === type.id
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className='flex items-start space-x-4'>
                      <div
                        className={`
                        p-3 rounded-lg 
                        ${
                          selectedType === type.id
                            ? `bg-${type.color}-100`
                            : 'bg-gray-100'
                        }
                      `}
                      >
                        <Icon className={`w-6 h-6 text-${type.color}-600`} />
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                          {type.name}
                        </h3>
                        <p className='text-sm text-gray-600 mb-4'>
                          {type.description}
                        </p>
                        <ul className='space-y-1'>
                          {type.features.map((feature, index) => (
                            <li
                              key={index}
                              className='flex items-center text-sm text-gray-600'
                            >
                              <Check className='w-4 h-4 text-green-500 mr-2' />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Google 회원가입 옵션 - 직접 구현 */}
            <div className='mt-8'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>또는</span>
                </div>
              </div>

              <div className='mt-6'>
                <DirectGoogleLogin redirectTo='/dashboard'>
                  Google로 간편 가입
                </DirectGoogleLogin>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2단계: 폼 입력 */}
      {step === 'form' && selectedType && (
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10'>
            {/* 선택된 회원 유형 표시 */}
            <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
              <div className='flex items-center space-x-3'>
                {(() => {
                  const type = MEMBERSHIP_TYPES[selectedType];
                  const Icon = type.icon;
                  return (
                    <>
                      <Icon className='w-5 h-5 text-blue-600' />
                      <span className='text-sm font-medium text-blue-900'>
                        {type.name}으로 가입
                      </span>
                      <button
                        onClick={() => setStep('type')}
                        className='ml-auto text-blue-600 hover:text-blue-800 text-sm'
                      >
                        변경
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 에러 메시지 */}
            {displayError && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                <p className='text-sm text-red-600'>{displayError}</p>
              </div>
            )}

            {/* 회원가입 폼 */}
            <form onSubmit={handleSignUp} className='space-y-6'>
              {/* 이메일 */}
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  이메일 <span className='text-red-500'>*</span>
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
                    placeholder='이메일을 입력하세요'
                  />
                </div>
              </div>

              {/* 이름 */}
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  {selectedType === 'organization' ? '담당자명' : '이름'}{' '}
                  <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <User className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    id='name'
                    name='name'
                    type='text'
                    autoComplete='name'
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder={
                      selectedType === 'organization'
                        ? '담당자명을 입력하세요'
                        : '이름을 입력하세요'
                    }
                  />
                </div>
              </div>

              {/* 연락처 */}
              <div>
                <label
                  htmlFor='phone'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  연락처 <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Phone className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    id='phone'
                    name='phone'
                    type='tel'
                    autoComplete='tel'
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='연락처를 입력하세요'
                  />
                </div>
              </div>

              {/* 생년월일 */}
              <div>
                <label
                  htmlFor='birthDate'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  생년월일{' '}
                  {selectedType !== 'organization' && (
                    <span className='text-red-500'>*</span>
                  )}
                </label>
                <input
                  id='birthDate'
                  name='birthDate'
                  type='date'
                  autoComplete='bday'
                  required={selectedType !== 'organization'}
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]} // 오늘 날짜까지만 선택 가능
                  className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                />
                {selectedType !== 'organization' && (
                  <p className='mt-1 text-xs text-gray-500'>
                    만 14세 미만은 보호자 동의가 필요합니다.
                  </p>
                )}
              </div>

              {/* 단체 회원 추가 정보 */}
              {selectedType === 'organization' && (
                <>
                  <div>
                    <label
                      htmlFor='organizationName'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      단체명 <span className='text-red-500'>*</span>
                    </label>
                    <input
                      id='organizationName'
                      name='organizationName'
                      type='text'
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                      placeholder='학교/학원/회사명을 입력하세요'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='organizationType'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      단체 유형
                    </label>
                    <select
                      id='organizationType'
                      name='organizationType'
                      value={formData.organizationType}
                      onChange={handleInputChange}
                      className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    >
                      <option value=''>선택해주세요</option>
                      <option value='school'>학교</option>
                      <option value='academy'>학원</option>
                      <option value='company'>회사</option>
                    </select>
                  </div>
                </>
              )}

              {/* 가족 회원 추가 정보 */}
              {selectedType === 'family' && (
                <div>
                  <label
                    htmlFor='familyName'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    가족 이름 <span className='text-red-500'>*</span>
                  </label>
                  <input
                    id='familyName'
                    name='familyName'
                    type='text'
                    required
                    value={formData.familyName}
                    onChange={handleInputChange}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='예: 김철수네 가족'
                  />
                  <p className='mt-1 text-xs text-gray-500'>
                    가족 구성원들이 알아볼 수 있는 이름을 입력해주세요.
                  </p>
                </div>
              )}

              {/* 과외 회원 추가 정보 */}
              {selectedType === 'tutoring' && (
                <div>
                  <label
                    htmlFor='tutorName'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    과외 선생님 이름 <span className='text-red-500'>*</span>
                  </label>
                  <input
                    id='tutorName'
                    name='tutorName'
                    type='text'
                    required
                    value={formData.tutorName}
                    onChange={handleInputChange}
                    className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='과외 선생님 이름을 입력하세요'
                  />
                </div>
              )}

              {/* 비밀번호 */}
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  비밀번호 <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className='block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                    placeholder='비밀번호를 입력하세요'
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

                {/* 비밀번호 강도 표시 */}
                {formData.password && (
                  <div className='mt-2'>
                    <div className='flex items-center space-x-2 text-xs'>
                      <div
                        className={`
                        h-1 flex-1 rounded-full 
                        ${
                          passwordStrength.strength === 'weak'
                            ? 'bg-red-300'
                            : passwordStrength.strength === 'medium'
                              ? 'bg-yellow-300'
                              : passwordStrength.strength === 'strong'
                                ? 'bg-blue-300'
                                : 'bg-green-300'
                        }
                      `}
                      ></div>
                      <span
                        className={`
                        font-medium
                        ${
                          passwordStrength.strength === 'weak'
                            ? 'text-red-600'
                            : passwordStrength.strength === 'medium'
                              ? 'text-yellow-600'
                              : passwordStrength.strength === 'strong'
                                ? 'text-blue-600'
                                : 'text-green-600'
                        }
                      `}
                      >
                        {passwordStrength.strength === 'weak'
                          ? '약함'
                          : passwordStrength.strength === 'medium'
                            ? '보통'
                            : passwordStrength.strength === 'strong'
                              ? '강함'
                              : '매우 강함'}
                      </span>
                    </div>

                    <div className='mt-1 grid grid-cols-2 gap-x-4 text-xs'>
                      <div className='flex items-center space-x-1'>
                        {passwordStrength.checks.length ? (
                          <Check className='w-3 h-3 text-green-500' />
                        ) : (
                          <X className='w-3 h-3 text-red-500' />
                        )}
                        <span
                          className={
                            passwordStrength.checks.length
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          8자 이상
                        </span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        {passwordStrength.checks.number ? (
                          <Check className='w-3 h-3 text-green-500' />
                        ) : (
                          <X className='w-3 h-3 text-red-500' />
                        )}
                        <span
                          className={
                            passwordStrength.checks.number
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          숫자 포함
                        </span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        {passwordStrength.checks.uppercase ? (
                          <Check className='w-3 h-3 text-green-500' />
                        ) : (
                          <X className='w-3 h-3 text-red-500' />
                        )}
                        <span
                          className={
                            passwordStrength.checks.uppercase
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          대문자 포함
                        </span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        {passwordStrength.checks.special ? (
                          <Check className='w-3 h-3 text-green-500' />
                        ) : (
                          <X className='w-3 h-3 text-red-500' />
                        )}
                        <span
                          className={
                            passwordStrength.checks.special
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          특수문자 포함
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  비밀번호 확인 <span className='text-red-500'>*</span>
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
                      block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm
                      ${
                        formData.confirmPassword &&
                        formData.password !== formData.confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-blue-500'
                      }
                    `}
                    placeholder='비밀번호를 다시 입력하세요'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  formData.password !== formData.confirmPassword && (
                    <p className='mt-1 text-sm text-red-600'>
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
              </div>

              {/* 약관 동의 */}
              <div className='space-y-3'>
                <div className='flex items-start'>
                  <input
                    id='agreeTerms'
                    name='agreeTerms'
                    type='checkbox'
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5'
                  />
                  <label
                    htmlFor='agreeTerms'
                    className='ml-2 block text-sm text-gray-700'
                  >
                    <span className='text-red-500'>*</span>
                    <Link
                      href='/terms'
                      className='text-blue-600 hover:text-blue-500 underline'
                    >
                      이용약관
                    </Link>
                    에 동의합니다
                  </label>
                </div>

                <div className='flex items-start'>
                  <input
                    id='agreePrivacy'
                    name='agreePrivacy'
                    type='checkbox'
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5'
                  />
                  <label
                    htmlFor='agreePrivacy'
                    className='ml-2 block text-sm text-gray-700'
                  >
                    <span className='text-red-500'>*</span>
                    <Link
                      href='/privacy'
                      className='text-blue-600 hover:text-blue-500 underline'
                    >
                      개인정보처리방침
                    </Link>
                    에 동의합니다
                  </label>
                </div>

                <div className='flex items-start'>
                  <input
                    id='agreeMarketing'
                    name='agreeMarketing'
                    type='checkbox'
                    checked={formData.agreeMarketing}
                    onChange={handleInputChange}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5'
                  />
                  <label
                    htmlFor='agreeMarketing'
                    className='ml-2 block text-sm text-gray-700'
                  >
                    마케팅 정보 수신에 동의합니다 (선택)
                  </label>
                </div>
              </div>

              {/* 회원가입 버튼 */}
              <div>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                >
                  {isLoading ? (
                    <div className='flex items-center'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      가입 처리 중...
                    </div>
                  ) : (
                    '회원가입'
                  )}
                </button>
              </div>
            </form>

            {/* Google 회원가입 옵션 */}
            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300' />
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>또는</span>
                </div>
              </div>

              <div className='mt-6'>
                <button
                  type='button'
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className='w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                >
                  <svg className='w-5 h-5 mr-3' viewBox='0 0 24 24'>
                    <path
                      fill='#4285f4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34a853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#fbbc05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#ea4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Google로 회원가입
                </button>
              </div>
            </div>

            {/* 로그인 링크 */}
            <div className='mt-6 text-center'>
              <p className='text-sm text-gray-600'>
                이미 계정이 있으신가요?{' '}
                <Link
                  href='/login'
                  className='font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200'
                >
                  로그인하기
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3단계: 이메일 인증 안내 */}
      {step === 'verification' && (
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10'>
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
                <Mail className='h-6 w-6 text-green-600' />
              </div>

              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                회원가입이 완료되었습니다
              </h3>

              <p className='text-sm text-gray-600 mb-6'>
                <span className='font-medium'>{formData.email}</span>로<br />
                인증 메일을 발송했습니다.
                <br />
                메일함을 확인하고 인증을 완료해주세요.
                <br />
                <br />
                <span className='text-blue-600 font-medium'>
                  (개발 환경에서는 이메일 확인 없이 로그인할 수 있습니다)
                </span>
              </p>

              <div className='space-y-4'>
                <button
                  onClick={() => router.push('/login')}
                  className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  로그인 페이지로 이동
                </button>

                <button
                  onClick={() => setStep('form')}
                  className='w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
                >
                  다시 가입하기
                </button>
              </div>

              <div className='mt-6 text-xs text-gray-500'>
                <p>메일이 오지 않았나요?</p>
                <p>스팸함을 확인하시거나 잠시 후 다시 시도해보세요.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
