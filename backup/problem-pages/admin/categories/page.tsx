'use client';

import { createCategory, deleteCategory, getCategories, updateCategory } from '@/api/categories';
import { Button, Card, Input } from '@/components/ui';
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '@/types/database';
import { useEffect, useState } from 'react';

interface CategoryFormData {
  name: string;
  description: string;
  template: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    template: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 카테고리 목록 로드
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.error || '카테고리를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      template: '',
    });
    setEditingCategory(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  // 새 카테고리 추가
  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  // 카테고리 수정
  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      template: category.template || '',
    });
    setEditingCategory(category);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // 카테고리 삭제
  const handleDelete = async (category: Category) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await deleteCategory(category.id);
      if (response.success) {
        setSuccess('카테고리가 삭제되었습니다.');
        loadCategories();
      } else {
        setError(response.error || '삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('삭제에 실패했습니다.');
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingCategory) {
        // 수정
        const updateData: CategoryUpdateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          template: formData.template.trim() || undefined,
        };
        
        const response = await updateCategory(editingCategory.id, updateData);
        if (response.success) {
          setSuccess('카테고리가 수정되었습니다.');
          resetForm();
          loadCategories();
        } else {
          setError(response.error || '수정에 실패했습니다.');
        }
      } else {
        // 생성
        const createData: CategoryCreateRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          template: formData.template.trim() || undefined,
        };
        
        const response = await createCategory(createData);
        if (response.success) {
          setSuccess('카테고리가 생성되었습니다.');
          resetForm();
          loadCategories();
        } else {
          setError(response.error || '생성에 실패했습니다.');
        }
      }
    } catch (err) {
      setError(editingCategory ? '수정에 실패했습니다.' : '생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="text-gray-600 mt-2">
            훈련 카테고리를 생성하고 관리합니다.
          </p>
        </div>
        <Button onClick={handleAdd}>
          새 카테고리 추가
        </Button>
      </div>

      {/* 상태 메시지 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-700">{success}</div>
        </div>
      )}

      {/* 카테고리 폼 */}
      {showForm && (
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="카테고리 이름"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="예: 비판적 사고"
              disabled={saving}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="카테고리에 대한 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                템플릿
              </label>
              <textarea
                value={formData.template}
                onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                placeholder="일지 작성 시 사용할 템플릿을 입력하세요"
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={!formData.name.trim()}
              >
                {editingCategory ? '수정' : '생성'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 카테고리 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {category.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  삭제
                </button>
              </div>
            </div>

            {category.description && (
              <p className="text-gray-600 text-sm mb-4">
                {category.description}
              </p>
            )}

            {category.template && (
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">템플릿:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {category.template.length > 100 
                    ? category.template.substring(0, 100) + '...'
                    : category.template
                  }
                </p>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                생성일: {new Date(category.created_at).toLocaleDateString()}
              </span>
              <span className={`px-2 py-1 rounded-full ${
                category.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {category.is_active ? '활성' : '비활성'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            카테고리가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            첫 번째 훈련 카테고리를 추가해보세요.
          </p>
          <Button onClick={handleAdd}>
            카테고리 추가
          </Button>
        </div>
      )}
    </div>
  );
}