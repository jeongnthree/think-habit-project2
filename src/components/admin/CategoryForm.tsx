// Category Form Component - Think-Habit Lite

import { Button, Input } from '@/components/ui';
import { Category } from '@/types';
import React, { useState } from 'react';

interface CategoryFormData {
  name: string;
  description: string;
  template: string;
}

interface CategoryFormProps {
  category?: Category;
  onSave: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    template: category?.template || '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      setError(null);
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          카테고리 이름 <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="예: 비판적 사고"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          설명
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="카테고리에 대한 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          훈련 템플릿
        </label>
        <textarea
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          placeholder="학습자가 사용할 훈련 템플릿을 입력하세요"
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          학습자가 일지를 작성할 때 기본으로 제공될 템플릿입니다.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!formData.name.trim()}
        >
          {category ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  );
};