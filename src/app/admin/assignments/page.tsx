'use client';

import { createAssignment, deleteAssignment, getAssignments, updateAssignment } from '@/api/assignments';
import { getCategories } from '@/api/categories';
import { Button, Card, Input } from '@/components/ui';
import { Assignment, AssignmentCreateRequest, AssignmentUpdateRequest, Category } from '@/types/database';
import { useEffect, useState } from 'react';

interface AssignmentFormData {
  studentId: string;
  categoryId: string;
  weeklyGoal: number;
  startDate: string;
  endDate: string;
}

// 임시 사용자 데이터 (실제로는 API에서 가져와야 함)
const mockUsers = [
  { id: 'user1', name: '김철수', role: 'student' },
  { id: 'user2', name: '이영희', role: 'student' },
  { id: 'user3', name: '박민수', role: 'student' },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    studentId: '',
    categoryId: '',
    weeklyGoal: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsResponse, categoriesResponse] = await Promise.all([
        getAssignments(),
        getCategories(),
      ]);

      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data || []);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

      if (!assignmentsResponse.success) {
        setError(assignmentsResponse.error || '할당 목록을 불러오는데 실패했습니다.');
      }
      if (!categoriesResponse.success) {
        setError(categoriesResponse.error || '카테고리 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      studentId: '',
      categoryId: '',
      weeklyGoal: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
    setEditingAssignment(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  // 새 할당 추가
  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  // 할당 수정
  const handleEdit = (assignment: Assignment) => {
    setFormData({
      studentId: assignment.student_id,
      categoryId: assignment.category_id,
      weeklyGoal: assignment.weekly_goal,
      startDate: assignment.start_date || new Date().toISOString().split('T')[0],
      endDate: assignment.end_date || '',
    });
    setEditingAssignment(assignment);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // 할당 삭제
  const handleDelete = async (assignment: Assignment) => {
    const studentName = mockUsers.find(u => u.id === assignment.student_id)?.name || '사용자';
    const categoryName = categories.find(c => c.id === assignment.category_id)?.name || '카테고리';
    
    if (!confirm(`${studentName}의 "${categoryName}" 할당을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await deleteAssignment(assignment.id);
      if (response.success) {
        setSuccess('할당이 삭제되었습니다.');
        loadData();
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
    
    if (!formData.studentId || !formData.categoryId) {
      setError('학습자와 카테고리를 선택해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingAssignment) {
        // 수정
        const updateData: AssignmentUpdateRequest = {
          weekly_goal: formData.weeklyGoal,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
        };
        
        const response = await updateAssignment(editingAssignment.id, updateData);
        if (response.success) {
          setSuccess('할당이 수정되었습니다.');
          resetForm();
          loadData();
        } else {
          setError(response.error || '수정에 실패했습니다.');
        }
      } else {
        // 생성
        const createData: AssignmentCreateRequest = {
          student_ids: [formData.studentId],
          category_ids: [formData.categoryId],
          weekly_goal: formData.weeklyGoal,
          start_date: formData.startDate || undefined,
          end_date: formData.endDate || undefined,
        };
        
        const response = await createAssignment(createData);
        if (response.success) {
          setSuccess('할당이 생성되었습니다.');
          resetForm();
          loadData();
        } else {
          setError(response.error || '생성에 실패했습니다.');
        }
      }
    } catch (err) {
      setError(editingAssignment ? '수정에 실패했습니다.' : '생성에 실패했습니다.');
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
          <h1 className="text-3xl font-bold text-gray-900">할당 관리</h1>
          <p className="text-gray-600 mt-2">
            학습자에게 카테고리를 할당하고 관리합니다.
          </p>
        </div>
        <Button onClick={handleAdd}>
          새 할당 추가
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

      {/* 할당 폼 */}
      {showForm && (
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAssignment ? '할당 수정' : '새 할당 추가'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학습자 선택
                </label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving || !!editingAssignment}
                  required
                >
                  <option value="">학습자를 선택하세요</option>
                  {mockUsers.filter(user => user.role === 'student').map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 선택
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving || !!editingAssignment}
                  required
                >
                  <option value="">카테고리를 선택하세요</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="주당 목표 횟수"
                type="number"
                min="1"
                max="7"
                value={formData.weeklyGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, weeklyGoal: parseInt(e.target.value) || 1 }))}
                disabled={saving}
                required
              />

              <Input
                label="시작일"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={saving}
              />

              <Input
                label="종료일 (선택사항)"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
                disabled={!formData.studentId || !formData.categoryId}
              >
                {editingAssignment ? '수정' : '생성'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 할당 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {assignments.map((assignment) => {
            const student = mockUsers.find(u => u.id === assignment.student_id);
            const category = categories.find(c => c.id === assignment.category_id);
            
            return (
              <li key={assignment.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {student?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {student?.name || '알 수 없는 사용자'}
                          </p>
                          <span className="ml-2 text-sm text-gray-500">→</span>
                          <p className="ml-2 text-sm font-medium text-blue-600">
                            {category?.name || '알 수 없는 카테고리'}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>주당 {assignment.weekly_goal}회</span>
                          <span className="mx-2">•</span>
                          <span>
                            {assignment.start_date ? 
                              new Date(assignment.start_date).toLocaleDateString() : 
                              '시작일 미설정'
                            }
                            {assignment.end_date && 
                              ` ~ ${new Date(assignment.end_date).toLocaleDateString()}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.is_active ? '활성' : '비활성'}
                      </span>
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(assignment)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            할당이 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            첫 번째 카테고리 할당을 추가해보세요.
          </p>
          <Button onClick={handleAdd}>
            할당 추가
          </Button>
        </div>
      )}
    </div>
  );
}