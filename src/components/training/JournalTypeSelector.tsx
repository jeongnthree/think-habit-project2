import React from 'react';

import { Card } from '@/components/ui';

interface JournalTypeSelectorProps {
  onSelect: (type: 'structured' | 'photo') => void;
  selectedType?: 'structured' | 'photo';
  categoryName?: string;
  categoryDescription?: string;
  hasTaskTemplates?: boolean;
  taskTemplateCount?: number;
}

export const JournalTypeSelector: React.FC<JournalTypeSelectorProps> = ({
  onSelect,
  selectedType,
  categoryName,
  categoryDescription,
  hasTaskTemplates = false,
  taskTemplateCount = 0,
}) => {
  return (
    <div className='max-w-4xl mx-auto p-6'>
      {/* 카테고리 정보 */}
      {categoryName && (
        <Card className='p-6 mb-8 bg-blue-50 border-blue-200'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-blue-900 mb-2'>
              📚 {categoryName}
            </h1>
            {categoryDescription && (
              <p className='text-blue-800 text-sm'>{categoryDescription}</p>
            )}
          </div>
        </Card>
      )}

      <div className='text-center mb-8'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          📝 훈련 일지 작성하기
        </h2>
        <p className='text-gray-600'>어떤 방식으로 일지를 작성하시겠어요?</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* 양식 작성 */}
        <Card
          className={`p-6 transition-all ${
            !hasTaskTemplates
              ? 'opacity-50 cursor-not-allowed bg-gray-100'
              : selectedType === 'structured'
                ? 'ring-2 ring-blue-500 bg-blue-50 cursor-pointer'
                : 'hover:bg-gray-50 cursor-pointer hover:shadow-lg'
          }`}
          onClick={() => hasTaskTemplates && onSelect('structured')}
        >
          <div className='text-center'>
            <div className='text-4xl mb-4'>📋</div>
            <h3
              className={`text-lg font-semibold mb-2 ${
                !hasTaskTemplates ? 'text-gray-500' : 'text-gray-900'
              }`}
            >
              양식 작성하기
            </h3>
            <p
              className={`text-sm mb-4 ${
                !hasTaskTemplates ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {hasTaskTemplates ? (
                <>
                  구조화된 템플릿을 따라
                  <br />
                  단계별로 작성해요
                </>
              ) : (
                <>
                  이 카테고리에는 템플릿이
                  <br />
                  설정되지 않았습니다
                </>
              )}
            </p>
            {hasTaskTemplates ? (
              <div className='space-y-2 text-xs text-gray-500'>
                <div className='flex items-center justify-center'>
                  <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
                  체계적인 사고 훈련
                </div>
                <div className='flex items-center justify-center'>
                  <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                  {taskTemplateCount}개의 가이드 질문
                </div>
                <div className='flex items-center justify-center'>
                  <span className='w-2 h-2 bg-purple-500 rounded-full mr-2'></span>
                  구조화된 성찰
                </div>
              </div>
            ) : (
              <div className='text-xs text-gray-400'>
                관리자에게 템플릿 설정을 요청하세요
              </div>
            )}
          </div>
        </Card>

        {/* 사진 업로드 */}
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
            selectedType === 'photo'
              ? 'ring-2 ring-blue-500 bg-blue-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect('photo')}
        >
          <div className='text-center'>
            <div className='text-4xl mb-4'>📷</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              사진 업로드
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              손글씨 메모나 노트를
              <br />
              사진으로 간편하게
            </p>
            <div className='space-y-2 text-xs text-gray-500'>
              <div className='flex items-center justify-center'>
                <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
                빠른 기록
              </div>
              <div className='flex items-center justify-center'>
                <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                손글씨 인식
              </div>
              <div className='flex items-center justify-center'>
                <span className='w-2 h-2 bg-purple-500 rounded-full mr-2'></span>
                음성 메모 지원
              </div>
            </div>
          </div>
        </Card>
      </div>

      {selectedType && (
        <div className='mt-6 text-center'>
          <p className='text-sm text-green-600 font-medium'>
            ✅ {selectedType === 'structured' ? '양식 작성' : '사진 업로드'}{' '}
            방식을 선택했습니다
          </p>
        </div>
      )}
    </div>
  );
};
