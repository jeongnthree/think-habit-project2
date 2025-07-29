// src/components/admin/AssignmentManager.tsx
import React, { useEffect, useMemo, useState } from 'react';

// 임시 타입 정의
interface User {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'learner';
  created_at: string;
}

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

interface UserAssignment {
  id: string;
  user_id: string;
  category_id: string;
  weekly_goal: number;
  target_period_weeks: number;
  assigned_at: string;
  assigned_by?: string;
  is_active: boolean;
  removed_at?: string;
  category?: Category;
}

// 임시 API 클래스
class TempAssignmentAPI {
  static async getUsers(options?: { role?: 'learner' | 'admin' }) {
    return {
      users: [
        {
          id: 'user1',
          name: '김철수',
          email: 'kim@example.com',
          role: 'learner' as const,
          created_at: new Date().toISOString(),
        },
        {
          id: 'user2',
          name: '이영희',
          email: 'lee@example.com',
          role: 'learner' as const,
          created_at: new Date().toISOString(),
        },
      ],
    };
  }

  static async getAllUserAssignments() {
    return {};
  }

  static async assignCategory(request: any) {
    return { id: 'temp-assignment' };
  }

  static async removeAssignment(assignmentId: string) {
    return { success: true };
  }

  static async batchAssignCategories(
    userIds: string[],
    categoryIds: string[],
    options?: any
  ) {
    return {
      assigned: [],
      skipped: 0,
      total: userIds.length * categoryIds.length,
    };
  }
}

class TempCategoryAPI {
  static async getCategories() {
    return {
      categories: [
        {
          id: 'cat1',
          name: '비판적 사고',
          description: '정보를 객관적으로 분석하고 평가하는 능력',
          area: 'cognitive' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 'cat2',
          name: '문제 분해',
          description: '복잡한 문제를 작은 단위로 나누어 해결하는 방법',
          area: 'problem_solving' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ],
    };
  }
}

interface AssignmentManagerProps {
  selectedUserId?: string;
  onUserSelect?: (userId: string) => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  selectedUserId,
  onUserSelect,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 대량 할당 모달 상태
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchOptions, setBatchOptions] = useState({
    weekly_goal: 1,
    target_period_weeks: 4,
  });

  const areas = [
    { id: 'cognitive', name: '인지적 사고' },
    { id: 'problem_solving', name: '문제해결' },
    { id: 'decision_making', name: '의사결정' },
    { id: 'social_emotional', name: '사회적/감정적' },
    { id: 'strategic', name: '전략적 사고' },
  ];

  // 데이터 로딩
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, categoriesData, assignmentsData] = await Promise.all([
        TempAssignmentAPI.getUsers({ role: 'learner' }),
        TempCategoryAPI.getCategories(),
        TempAssignmentAPI.getAllUserAssignments(),
      ]);

      setUsers(usersData.users);
      setCategories(categoriesData.categories);
      setAssignments(assignmentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 사용자 목록
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        searchTerm === '' ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [users, searchTerm]);

  // 영역별 카테고리 그룹화
  const categoriesByArea = useMemo(() => {
    return categories.reduce((acc: Record<string, Category[]>, category) => {
      const area = category.area;
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(category);
      return acc;
    }, {});
  }, [categories]);

  // 필터링된 카테고리 목록
  const filteredCategories = useMemo(() => {
    if (selectedArea === 'all') return categories;
    return categories.filter(cat => cat.area === selectedArea);
  }, [categories, selectedArea]);

  // 카테고리 할당
  const handleAssignCategory = async (userId: string, categoryId: string) => {
    try {
      await TempAssignmentAPI.assignCategory({
        user_id: userId,
        category_id: categoryId,
        weekly_goal: 1,
        target_period_weeks: 4,
        assigned_at: new Date().toISOString(),
        is_active: true,
      });

      await loadData(); // 데이터 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 실패');
    }
  };

  // 할당 해제
  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('정말로 이 할당을 해제하시겠습니까?')) return;

    try {
      await TempAssignmentAPI.removeAssignment(assignmentId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 해제 실패');
    }
  };

  // 대량 할당
  const handleBatchAssign = async () => {
    if (selectedUsers.length === 0 || selectedCategories.length === 0) {
      setError('사용자와 카테고리를 선택해주세요.');
      return;
    }

    try {
      await TempAssignmentAPI.batchAssignCategories(
        selectedUsers,
        selectedCategories,
        batchOptions
      );

      setShowBatchModal(false);
      setSelectedUsers([]);
      setSelectedCategories([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '대량 할당 실패');
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-gray-500'>할당 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 에러 메시지 */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded p-4'>
          <p className='text-red-700'>{error}</p>
          <button
            onClick={() => setError(null)}
            className='text-red-500 hover:text-red-700 text-sm mt-1'
          >
            닫기
          </button>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold'>할당 관리</h2>
          <button
            onClick={() => setShowBatchModal(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          >
            대량 할당
          </button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div>
            <label className='block text-sm font-medium mb-1'>
              사용자 검색
            </label>
            <input
              type='text'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder='이름 또는 이메일로 검색'
              className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>영역 필터</label>
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>모든 영역</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div className='flex items-end'>
            <button
              onClick={loadData}
              className='bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700'
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-blue-50 rounded p-4 text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {filteredUsers.length}
            </div>
            <div className='text-sm text-gray-600'>총 학습자</div>
          </div>
          <div className='bg-green-50 rounded p-4 text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {Object.keys(assignments).length}
            </div>
            <div className='text-sm text-gray-600'>할당된 학습자</div>
          </div>
          <div className='bg-purple-50 rounded p-4 text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {Object.values(assignments).reduce(
                (sum: number, user: any) =>
                  sum + (user?.assignments?.length || 0),
                0
              )}
            </div>
            <div className='text-sm text-gray-600'>총 할당 수</div>
          </div>
          <div className='bg-orange-50 rounded p-4 text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {categories.length}
            </div>
            <div className='text-sm text-gray-600'>활성 카테고리</div>
          </div>
        </div>
      </div>

      {/* 사용자별 할당 목록 */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>사용자별 할당 현황</h3>

        {filteredUsers.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredUsers.map(user => {
              const userAssignments = assignments[user.id];

              return (
                <div key={user.id} className='border rounded-lg p-4'>
                  <div className='flex justify-between items-start mb-3'>
                    <div>
                      <h3 className='font-semibold text-lg'>
                        {user.name || user.email}
                      </h3>
                      <p className='text-gray-600 text-sm'>{user.email}</p>
                    </div>
                    <div className='text-right'>
                      <span className='text-sm text-gray-500'>
                        총 {userAssignments?.assignments?.length || 0}개 할당됨
                      </span>
                      {onUserSelect && (
                        <button
                          onClick={() => onUserSelect(user.id)}
                          className='ml-2 text-blue-600 hover:text-blue-800 text-sm'
                        >
                          상세 관리
                        </button>
                      )}
                    </div>
                  </div>

                  {userAssignments ? (
                    <>
                      {/* 영역별 할당 현황 */}
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3'>
                        {areas.map(area => {
                          const areaAssignments =
                            userAssignments.assignmentsByArea?.[area.id] || [];
                          return (
                            <div
                              key={area.id}
                              className='bg-gray-50 rounded p-3'
                            >
                              <h4 className='font-medium text-sm mb-2'>
                                {area.name}
                              </h4>
                              {areaAssignments.length > 0 ? (
                                <div className='space-y-1'>
                                  {areaAssignments.map((assignment: any) => (
                                    <div
                                      key={assignment.id}
                                      className='flex justify-between items-center text-xs'
                                    >
                                      <span className='truncate'>
                                        {assignment.category?.name ||
                                          '카테고리'}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleRemoveAssignment(assignment.id)
                                        }
                                        className='text-red-500 hover:text-red-700 ml-1'
                                        title='할당 해제'
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className='text-gray-400 text-xs'>
                                  할당된 카테고리 없음
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 빠른 카테고리 할당 */}
                      <div className='pt-3 border-t'>
                        <div className='flex flex-wrap gap-2'>
                          {filteredCategories.slice(0, 5).map(category => {
                            const isAssigned =
                              userAssignments.assignments?.some(
                                (a: any) => a.category_id === category.id
                              ) || false;
                            return (
                              <button
                                key={category.id}
                                onClick={() =>
                                  handleAssignCategory(user.id, category.id)
                                }
                                disabled={isAssigned}
                                className={`text-xs px-2 py-1 rounded ${
                                  isAssigned
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {category.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className='text-center py-4 text-gray-500'>
                      할당된 카테고리가 없습니다.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 대량 할당 모달 */}
      {showBatchModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-xl font-semibold'>대량 할당</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                ×
              </button>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* 사용자 선택 */}
              <div>
                <h4 className='font-medium mb-3'>사용자 선택</h4>
                <div className='border rounded max-h-64 overflow-y-auto p-3'>
                  {users.map(user => (
                    <label key={user.id} className='flex items-center mb-2'>
                      <input
                        type='checkbox'
                        checked={selectedUsers.includes(user.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter(id => id !== user.id)
                            );
                          }
                        }}
                        className='mr-2'
                      />
                      <span className='text-sm'>
                        {user.name || user.email} ({user.email})
                      </span>
                    </label>
                  ))}
                </div>
                <div className='mt-2 text-sm text-gray-600'>
                  {selectedUsers.length}명 선택됨
                </div>
              </div>

              {/* 카테고리 선택 */}
              <div>
                <h4 className='font-medium mb-3'>카테고리 선택</h4>
                <div className='border rounded max-h-64 overflow-y-auto p-3'>
                  {areas.map(area => {
                    const areaCategories = categoriesByArea[area.id] || [];
                    return (
                      <div key={area.id} className='mb-4'>
                        <h5 className='font-medium text-sm text-gray-700 mb-2'>
                          {area.name}
                        </h5>
                        {areaCategories.map((category: Category) => (
                          <label
                            key={category.id}
                            className='flex items-center mb-1 ml-4'
                          >
                            <input
                              type='checkbox'
                              checked={selectedCategories.includes(category.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedCategories([
                                    ...selectedCategories,
                                    category.id,
                                  ]);
                                } else {
                                  setSelectedCategories(
                                    selectedCategories.filter(
                                      id => id !== category.id
                                    )
                                  );
                                }
                              }}
                              className='mr-2'
                            />
                            <span className='text-sm'>{category.name}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div className='mt-2 text-sm text-gray-600'>
                  {selectedCategories.length}개 선택됨
                </div>
              </div>
            </div>

            {/* 할당 옵션 */}
            <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  주당 목표 횟수
                </label>
                <input
                  type='number'
                  min='1'
                  max='10'
                  value={batchOptions.weekly_goal}
                  onChange={e =>
                    setBatchOptions({
                      ...batchOptions,
                      weekly_goal: parseInt(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  목표 기간 (주)
                </label>
                <input
                  type='number'
                  min='1'
                  max='52'
                  value={batchOptions.target_period_weeks}
                  onChange={e =>
                    setBatchOptions({
                      ...batchOptions,
                      target_period_weeks: parseInt(e.target.value),
                    })
                  }
                  className='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {/* 할당 실행 */}
            <div className='mt-6 flex justify-end space-x-3'>
              <button
                onClick={() => setShowBatchModal(false)}
                className='px-4 py-2 border rounded hover:bg-gray-50'
              >
                취소
              </button>
              <button
                onClick={handleBatchAssign}
                disabled={
                  selectedUsers.length === 0 || selectedCategories.length === 0
                }
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                할당 실행
              </button>
            </div>

            {/* 할당 미리보기 */}
            {selectedUsers.length > 0 && selectedCategories.length > 0 && (
              <div className='mt-4 p-4 bg-gray-50 rounded'>
                <h5 className='font-medium mb-2'>할당 미리보기</h5>
                <p className='text-sm text-gray-600'>
                  {selectedUsers.length}명의 사용자에게{' '}
                  {selectedCategories.length}개의 카테고리를 할당합니다. (총{' '}
                  {selectedUsers.length * selectedCategories.length}개의 할당)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
