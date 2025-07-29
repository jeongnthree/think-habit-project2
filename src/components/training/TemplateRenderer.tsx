// src/components/training/TemplateRenderer.tsx
import React, { useEffect, useState } from 'react';

// 임시 타입 정의
interface Category {
  id: string;
  name: string;
  description?: string;
  area:
    | 'cognitive'
    | 'problem_solving'
    | 'decision_making'
    | 'social_emotional'
    | 'strategic';
  template_structure?: string;
  template_instructions?: string;
  is_active: boolean;
  created_at: string;
}

interface TemplateField {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'number'
    | 'date'
    | 'time';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // select, radio, checkbox용
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  helpText?: string;
}

interface TemplateRendererProps {
  category: Category;
  initialValues?: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  onValidationChange: (isValid: boolean) => void;
  readonly?: boolean;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  category,
  initialValues = {},
  onChange,
  onValidationChange,
  readonly = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 카테고리별 기본 템플릿 구조
  const getTemplateFields = (categoryArea: string): TemplateField[] => {
    const commonFields: TemplateField[] = [
      {
        id: 'situation',
        type: 'textarea',
        label: '상황 설명',
        placeholder: '어떤 상황에서 이 생각습관을 적용했나요?',
        required: true,
        validation: { minLength: 10, maxLength: 500 },
        helpText: '구체적인 상황을 자세히 기록해주세요.',
      },
      {
        id: 'thinking_process',
        type: 'textarea',
        label: '사고 과정',
        placeholder: '어떤 생각의 과정을 거쳤나요?',
        required: true,
        validation: { minLength: 20, maxLength: 1000 },
        helpText: '단계별로 생각한 과정을 순서대로 적어주세요.',
      },
    ];

    // 영역별 특화 필드
    const areaSpecificFields: Record<string, TemplateField[]> = {
      cognitive: [
        {
          id: 'cognitive_bias',
          type: 'select',
          label: '인지 편향 유형',
          options: [
            '확증편향',
            '가용성편향',
            '앵커링편향',
            '대표성편향',
            '기타',
          ],
          helpText: '발견한 인지 편향이 있다면 선택해주세요.',
        },
        {
          id: 'alternative_thinking',
          type: 'textarea',
          label: '대안적 사고',
          placeholder: '다른 관점에서는 어떻게 생각할 수 있을까요?',
          validation: { minLength: 10, maxLength: 500 },
        },
      ],
      problem_solving: [
        {
          id: 'problem_definition',
          type: 'textarea',
          label: '문제 정의',
          placeholder: '해결하고자 하는 문제를 명확히 정의해주세요.',
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: 'solution_options',
          type: 'textarea',
          label: '해결책 옵션',
          placeholder: '고려한 해결책들을 나열해주세요.',
          validation: { minLength: 10, maxLength: 500 },
        },
        {
          id: 'selected_solution',
          type: 'textarea',
          label: '선택한 해결책',
          placeholder: '최종 선택한 해결책과 이유를 설명해주세요.',
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
      ],
      decision_making: [
        {
          id: 'decision_criteria',
          type: 'textarea',
          label: '의사결정 기준',
          placeholder: '어떤 기준으로 판단했나요?',
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: 'pros_cons',
          type: 'textarea',
          label: '장단점 분석',
          placeholder: '각 선택지의 장단점을 분석해주세요.',
          validation: { minLength: 10, maxLength: 500 },
        },
        {
          id: 'confidence_level',
          type: 'select',
          label: '확신 정도',
          options: ['매우 확신', '확신', '보통', '불확실', '매우 불확실'],
          required: true,
        },
      ],
      social_emotional: [
        {
          id: 'emotion_before',
          type: 'select',
          label: '상황 전 감정',
          options: ['기쁨', '분노', '슬픔', '두려움', '놀람', '혐오', '중립'],
          required: true,
        },
        {
          id: 'emotion_after',
          type: 'select',
          label: '상황 후 감정',
          options: ['기쁨', '분노', '슬픔', '두려움', '놀람', '혐오', '중립'],
          required: true,
        },
        {
          id: 'empathy_consideration',
          type: 'textarea',
          label: '상대방 관점 고려',
          placeholder: '상대방의 입장에서는 어떻게 느꼈을까요?',
          validation: { minLength: 10, maxLength: 300 },
        },
      ],
      strategic: [
        {
          id: 'long_term_goal',
          type: 'textarea',
          label: '장기 목표',
          placeholder: '이 결정이 장기적으로 어떤 목표와 연결되나요?',
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: 'resource_consideration',
          type: 'textarea',
          label: '자원 고려사항',
          placeholder: '시간, 비용, 인력 등 필요한 자원을 고려했나요?',
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: 'risk_assessment',
          type: 'select',
          label: '위험도 평가',
          options: ['매우 낮음', '낮음', '보통', '높음', '매우 높음'],
          required: true,
        },
      ],
    };

    // 공통 마무리 필드
    const closingFields: TemplateField[] = [
      {
        id: 'outcome',
        type: 'textarea',
        label: '결과',
        placeholder: '어떤 결과가 나왔나요?',
        validation: { minLength: 10, maxLength: 500 },
        helpText: '실제 결과와 예상과의 차이점도 함께 기록해주세요.',
      },
      {
        id: 'lessons_learned',
        type: 'textarea',
        label: '배운 점',
        placeholder: '이번 경험에서 배운 점이나 개선할 점은?',
        required: true,
        validation: { minLength: 10, maxLength: 500 },
        helpText: '다음에는 어떻게 다르게 접근할지도 생각해보세요.',
      },
      {
        id: 'application_plan',
        type: 'textarea',
        label: '적용 계획',
        placeholder: '앞으로 어떻게 이 생각습관을 활용할 계획인가요?',
        validation: { minLength: 10, maxLength: 300 },
        helpText: '구체적인 적용 계획을 세워보세요.',
      },
      {
        id: 'difficulty_rating',
        type: 'select',
        label: '적용 난이도',
        options: ['매우 쉬움', '쉬움', '보통', '어려움', '매우 어려움'],
        required: true,
        helpText: '이 생각습관을 적용하는 것이 얼마나 어려웠나요?',
      },
      {
        id: 'effectiveness_rating',
        type: 'select',
        label: '효과성 평가',
        options: ['매우 효과적', '효과적', '보통', '비효과적', '매우 비효과적'],
        required: true,
        helpText: '이 생각습관이 상황 해결에 얼마나 도움이 되었나요?',
      },
    ];

    return [
      ...commonFields,
      ...(areaSpecificFields[categoryArea] || []),
      ...closingFields,
    ];
  };

  const templateFields = getTemplateFields(category.area);

  // 카테고리별 템플릿이 있다면 그것을 우선 사용
  const finalFields = category.template_structure
    ? JSON.parse(category.template_structure)
    : templateFields;

  // 값 변경 처리
  const handleValueChange = (fieldId: string, value: any) => {
    const newValues = { ...values, [fieldId]: value };
    setValues(newValues);
    onChange(fieldId, value);

    // 유효성 검사
    validateField(fieldId, value);
  };

  // 필드 유효성 검사
  const validateField = (fieldId: string, value: any) => {
    const field = finalFields.find((f: TemplateField) => f.id === fieldId);
    if (!field) return;

    const newErrors = { ...errors };

    // 필수 필드 검사
    if (field.required && (!value || value.toString().trim() === '')) {
      newErrors[fieldId] = '필수 항목입니다.';
    } else if (field.validation) {
      const validation = field.validation;

      // 문자열 길이 검사
      if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
          newErrors[fieldId] =
            `최소 ${validation.minLength}자 이상 입력해주세요.`;
        } else if (
          validation.maxLength &&
          value.length > validation.maxLength
        ) {
          newErrors[fieldId] =
            `최대 ${validation.maxLength}자까지 입력 가능합니다.`;
        } else if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          if (!regex.test(value)) {
            newErrors[fieldId] = '올바른 형식이 아닙니다.';
          } else {
            delete newErrors[fieldId];
          }
        } else {
          delete newErrors[fieldId];
        }
      }

      // 숫자 범위 검사
      if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
          newErrors[fieldId] = `최소값은 ${validation.min}입니다.`;
        } else if (validation.max !== undefined && value > validation.max) {
          newErrors[fieldId] = `최대값은 ${validation.max}입니다.`;
        } else {
          delete newErrors[fieldId];
        }
      }
    } else {
      delete newErrors[fieldId];
    }

    setErrors(newErrors);
  };

  // 전체 유효성 검사
  useEffect(() => {
    const requiredFields = finalFields.filter(
      (field: TemplateField) => field.required
    );
    const hasAllRequired = requiredFields.every(
      (field: TemplateField) =>
        values[field.id] && values[field.id].toString().trim() !== ''
    );

    const hasNoErrors = Object.keys(errors).length === 0;
    onValidationChange(hasAllRequired && hasNoErrors);
  }, [values, errors, finalFields, onValidationChange]);

  // 초기값 설정
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // 필드 렌더링
  const renderField = (field: TemplateField) => {
    const value = values[field.id] || '';
    const error = errors[field.id];
    const isRequired = field.required;

    const baseProps = {
      id: field.id,
      disabled: readonly,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`,
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            {...baseProps}
            type='text'
            value={value}
            placeholder={field.placeholder}
            onChange={e => handleValueChange(field.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...baseProps}
            value={value}
            placeholder={field.placeholder}
            rows={4}
            onChange={e => handleValueChange(field.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            {...baseProps}
            value={value}
            onChange={e => handleValueChange(field.id, e.target.value)}
          >
            <option value=''>선택해주세요</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className='space-y-2'>
            {field.options?.map(option => (
              <label key={option} className='flex items-center'>
                <input
                  type='radio'
                  name={field.id}
                  value={option}
                  checked={value === option}
                  disabled={readonly}
                  onChange={e => handleValueChange(field.id, e.target.value)}
                  className='mr-2'
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className='space-y-2'>
            {field.options?.map(option => (
              <label key={option} className='flex items-center'>
                <input
                  type='checkbox'
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  disabled={readonly}
                  onChange={e => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleValueChange(field.id, newValues);
                  }}
                  className='mr-2'
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            {...baseProps}
            type='number'
            value={value}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={e =>
              handleValueChange(field.id, parseFloat(e.target.value) || 0)
            }
          />
        );

      case 'date':
        return (
          <input
            {...baseProps}
            type='date'
            value={value}
            onChange={e => handleValueChange(field.id, e.target.value)}
          />
        );

      case 'time':
        return (
          <input
            {...baseProps}
            type='time'
            value={value}
            onChange={e => handleValueChange(field.id, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className='space-y-6'>
      {/* 카테고리 정보 */}
      <div className='bg-blue-50 rounded-lg p-4'>
        <h3 className='font-semibold text-blue-900 mb-2'>{category.name}</h3>
        <p className='text-blue-700 text-sm'>{category.description}</p>
        {category.template_instructions && (
          <div className='mt-3 p-3 bg-blue-100 rounded text-sm text-blue-800'>
            <strong>작성 가이드:</strong>
            <div
              className='mt-1'
              dangerouslySetInnerHTML={{
                __html: category.template_instructions.replace(/\n/g, '<br/>'),
              }}
            />
          </div>
        )}
      </div>

      {/* 필드들 */}
      {finalFields.map((field: TemplateField) => (
        <div key={field.id} className='space-y-2'>
          <label
            htmlFor={field.id}
            className='block text-sm font-medium text-gray-700'
          >
            {field.label}
            {field.required && <span className='text-red-500 ml-1'>*</span>}
          </label>

          {renderField(field)}

          {errors[field.id] && (
            <p className='text-red-500 text-sm'>{errors[field.id]}</p>
          )}

          {field.helpText && !errors[field.id] && (
            <p className='text-gray-500 text-sm'>{field.helpText}</p>
          )}
        </div>
      ))}

      {/* 진행률 표시 */}
      {!readonly && (
        <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm font-medium'>작성 진행률</span>
            <span className='text-sm text-gray-600'>
              {
                Object.keys(values).filter(
                  key => values[key] && values[key].toString().trim() !== ''
                ).length
              }{' '}
              / {finalFields.length}
            </span>
          </div>

          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{
                width: `${
                  (Object.keys(values).filter(
                    key => values[key] && values[key].toString().trim() !== ''
                  ).length /
                    finalFields.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
