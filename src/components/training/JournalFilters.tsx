'use client';

import { Button, Card } from '@/components/ui';
import { Category } from '@/types/database';
import { Calendar, Camera, FileText, Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface JournalFiltersProps {
  categories: Category[];
  currentFilters: {
    categoryId?: string;
    search?: string;
    journalType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onFilterChange: (filters: {
    categoryId?: string;
    search?: string;
    journalType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export function JournalFilters({
  categories,
  currentFilters,
  onFilterChange,
}: JournalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = {
      ...localFilters,
      [key]: value || undefined,
    };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      categoryId: '',
      search: '',
      journalType: '',
      dateFrom: '',
      dateTo: '',
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    value => value && value.length > 0
  );

  return (
    <Card className='p-4'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Filter className='h-5 w-5 text-gray-500' />
          <span className='font-medium text-gray-900'>필터</span>
          {hasActiveFilters && (
            <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
              활성
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          {hasActiveFilters && (
            <Button
              variant='outline'
              size='sm'
              onClick={clearFilters}
              className='text-gray-600'
            >
              <X className='h-4 w-4 mr-1' />
              초기화
            </Button>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '접기' : '펼치기'}
          </Button>
        </div>
      </div>

      {/* Quick Search */}
      <div className='mb-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='일지 제목이나 내용으로 검색...'
            value={localFilters.search || ''}
            onChange={e => handleFilterChange('search', e.target.value)}
            onKeyPress={e => e.key === 'Enter' && applyFilters()}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className='space-y-4 pt-4 border-t border-gray-200'>
          {/* Category Filter */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              카테고리
            </label>
            <select
              value={localFilters.categoryId || ''}
              onChange={e => handleFilterChange('categoryId', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value=''>모든 카테고리</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Journal Type Filter */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              일지 유형
            </label>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => handleFilterChange('journalType', '')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  !localFilters.journalType
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className='h-4 w-4' />
                전체
              </button>
              <button
                type='button'
                onClick={() => handleFilterChange('journalType', 'structured')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  localFilters.journalType === 'structured'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className='h-4 w-4' />
                구조화된 일지
              </button>
              <button
                type='button'
                onClick={() => handleFilterChange('journalType', 'photo')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  localFilters.journalType === 'photo'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Camera className='h-4 w-4' />
                사진 일지
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                시작 날짜
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='date'
                  value={localFilters.dateFrom || ''}
                  onChange={e => handleFilterChange('dateFrom', e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                종료 날짜
              </label>
              <div className='relative'>
                <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='date'
                  value={localFilters.dateTo || ''}
                  onChange={e => handleFilterChange('dateTo', e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className='flex justify-end pt-4'>
            <Button onClick={applyFilters}>필터 적용</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
