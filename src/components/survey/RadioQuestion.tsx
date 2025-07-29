// components/survey/RadioQuestion.tsx
'use client';

import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

/**
 * 1-10 범위의 기본 옵션 생성 함수
 */
export const createScaleOptions = (
  min: number = 1,
  max: number = 10,
  labels?: { [key: number]: string }
): RadioOption[] => {
  const options: RadioOption[] = [];

  for (let i = min; i <= max; i++) {
    options.push({
      value: i.toString(),
      label: labels?.[i] || i.toString(),
      description: labels?.[i] ? `${i}점` : undefined,
    });
  }

  return options;
};

/**
 * 기본 1-10 점수 옵션
 */
export const defaultScaleOptions = createScaleOptions(1, 10, {
  1: '전혀 그렇지 않다',
  2: '그렇지 않다',
  3: '약간 그렇지 않다',
  4: '조금 그렇지 않다',
  5: '보통이다',
  6: '조금 그렇다',
  7: '약간 그렇다',
  8: '그렇다',
  9: '매우 그렇다',
  10: '완전히 그렇다',
});

// 라디오 옵션 타입
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

// RadioQuestion 컴포넌트 Props
export interface RadioQuestionProps {
  // 필수 Props
  id: string;
  question: string;
  options?: RadioOption[]; // 이제 선택사항 (기본값: 1-10 스케일)

  // 선택사항 Props
  selectedValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;

  // 스케일 설정 Props
  useDefaultScale?: boolean; // 기본 1-10 스케일 사용 여부
  scaleMin?: number; // 최소값 (기본: 1)
  scaleMax?: number; // 최대값 (기본: 10)
  scaleLabels?: { [key: number]: string }; // 커스텀 라벨

  // 스타일링 Props
  className?: string;
  questionClassName?: string;
  optionsClassName?: string;

  // 설명 및 접근성
  description?: string;
  helpText?: string;
}

/**
 * 단일 선택 라디오 버튼 질문 컴포넌트
 *
 * @example
 * ```tsx
 * // 기본 1-10 스케일 사용
 * <RadioQuestion
 *   id="stress-level"
 *   question="평소 스트레스 수준은 어느 정도인가요?"
 *   selectedValue={answer}
 *   onChange={setAnswer}
 *   required
 * />
 *
 * // 커스텀 옵션 사용
 * <RadioQuestion
 *   id="custom-question"
 *   question="당신의 선호도는?"
 *   options={[
 *     { value: "yes", label: "예" },
 *     { value: "no", label: "아니오" }
 *   ]}
 * />
 * ```
 */
export default function RadioQuestion({
  id,
  question,
  options,
  selectedValue,
  onChange,
  required = false,
  error,
  disabled = false,
  useDefaultScale = true,
  scaleMin = 1,
  scaleMax = 10,
  scaleLabels,
  className = '',
  questionClassName = '',
  optionsClassName = '',
  description,
  helpText,
}: RadioQuestionProps) {
  // 내부 상태 (제어되지 않는 컴포넌트 지원)
  const [internalValue, setInternalValue] = useState<string>('');

  // 사용할 옵션 결정
  const finalOptions =
    options ||
    (useDefaultScale
      ? createScaleOptions(
          scaleMin,
          scaleMax,
          scaleLabels || {
            [scaleMin]: '전혀 그렇지 않다',
            [Math.ceil((scaleMin + scaleMax) / 2)]: '보통이다',
            [scaleMax]: '완전히 그렇다',
          }
        )
      : defaultScaleOptions);

  // 현재 선택된 값 (제어 vs 비제어)
  const currentValue =
    selectedValue !== undefined ? selectedValue : internalValue;

  /**
   * 옵션 선택 핸들러
   */
  const handleOptionChange = (value: string) => {
    if (disabled) return;

    // 외부 onChange가 있으면 호출 (제어된 컴포넌트)
    if (onChange) {
      onChange(value);
    } else {
      // 내부 상태 업데이트 (비제어 컴포넌트)
      setInternalValue(value);
    }
  };

  /**
   * 키보드 네비게이션 지원
   */
  const handleKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOptionChange(value);
    }
  };

  /**
   * 필수 필드 검증
   */
  const isValid = !required || currentValue !== '';
  const showError = error || (required && !isValid);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 질문 제목 */}
      <div className={`space-y-2 ${questionClassName}`}>
        <h3 id={`${id}-question`} className='text-lg font-medium text-gray-900'>
          {question}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </h3>

        {/* 설명 텍스트 */}
        {description && <p className='text-sm text-gray-600'>{description}</p>}
      </div>

      {/* 라디오 옵션들 */}
      <fieldset className={`space-y-3 ${optionsClassName}`} disabled={disabled}>
        <legend className='sr-only'>{question}</legend>

        {finalOptions.map((option, index) => {
          const optionId = `${id}-option-${index}`;
          const isSelected = currentValue === option.value;

          return (
            <div
              key={option.value}
              className={`
                relative flex items-start p-3 rounded-lg border transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${showError && !isSelected ? 'border-red-300' : ''}
              `}
              onClick={() => handleOptionChange(option.value)}
              onKeyDown={e => handleKeyDown(e, option.value)}
              tabIndex={disabled ? -1 : 0}
              role='radio'
              aria-checked={isSelected}
              aria-labelledby={`${optionId}-label`}
              aria-describedby={
                option.description ? `${optionId}-description` : undefined
              }
            >
              {/* 라디오 버튼 */}
              <div className='flex items-center h-5'>
                <input
                  id={optionId}
                  name={id}
                  type='radio'
                  value={option.value}
                  checked={isSelected}
                  onChange={() => handleOptionChange(option.value)}
                  disabled={disabled}
                  className={`
                    h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2
                    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  aria-labelledby={`${optionId}-label`}
                />
              </div>

              {/* 옵션 레이블 및 설명 */}
              <div className='ml-3 flex-1'>
                <label
                  id={`${optionId}-label`}
                  htmlFor={optionId}
                  className={`
                    block text-sm font-medium cursor-pointer
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                    ${disabled ? 'cursor-not-allowed' : ''}
                  `}
                >
                  {option.label}
                </label>

                {/* 옵션 설명 */}
                {option.description && (
                  <p
                    id={`${optionId}-description`}
                    className={`
                      mt-1 text-xs
                      ${isSelected ? 'text-blue-700' : 'text-gray-500'}
                    `}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </fieldset>

      {/* 에러 메시지 */}
      {showError && (
        <div className='flex items-center space-x-2 text-sm text-red-600'>
          <AlertCircle className='h-4 w-4' />
          <span>
            {error ||
              (required && !currentValue ? '이 질문은 필수입니다.' : '')}
          </span>
        </div>
      )}

      {/* 도움말 텍스트 */}
      {helpText && !showError && (
        <p className='text-xs text-gray-500'>{helpText}</p>
      )}
    </div>
  );
}

/**
 * RadioQuestion 컴포넌트의 기본 스타일 변형들
 */
export const RadioQuestionVariants = {
  // 컴팩트 버전
  compact: {
    className: 'space-y-2',
    questionClassName: 'space-y-1',
    optionsClassName: 'space-y-2',
  },

  // 카드 스타일
  card: {
    className:
      'p-6 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4',
    questionClassName: 'pb-2 border-b border-gray-100',
    optionsClassName: 'space-y-3',
  },

  // 인라인 스타일 (작은 화면용)
  inline: {
    className: 'space-y-3',
    optionsClassName: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  },
};

/**
 * 사용 예시를 위한 샘플 데이터
 */
export const sampleRadioQuestions = {
  // 기본 1-10 스케일 사용
  stressLevel: {
    id: 'stress-level',
    question: '평소 스트레스 수준은 어느 정도인가요?',
    description:
      '지난 한 달 동안의 전반적인 스트레스 정도를 1-10점으로 평가해주세요.',
    required: true,
    helpText: '1점: 전혀 스트레스 없음, 10점: 극심한 스트레스',
  },

  // 3-7 범위 커스텀 스케일
  satisfaction: {
    id: 'satisfaction',
    question: '현재 생활에 대한 만족도는?',
    useDefaultScale: true,
    scaleMin: 3,
    scaleMax: 7,
    scaleLabels: {
      3: '불만족',
      5: '보통',
      7: '매우 만족',
    },
    required: true,
  },

  // 커스텀 옵션 사용
  sleepQuality: {
    id: 'sleep-quality',
    question: '최근 수면의 질은 어떠신가요?',
    options: [
      { value: '1', label: '매우 나쁨', description: '거의 잠들지 못함' },
      { value: '2', label: '나쁨', description: '자주 깨고 피곤함' },
      { value: '3', label: '보통', description: '그럭저럭 잠듦' },
      { value: '4', label: '좋음', description: '잘 잠들고 개운함' },
      { value: '5', label: '매우 좋음', description: '깊게 잠들고 상쾌함' },
    ],
    helpText: '지난 일주일 동안의 수면 상태를 기준으로 답해주세요.',
  },
};
