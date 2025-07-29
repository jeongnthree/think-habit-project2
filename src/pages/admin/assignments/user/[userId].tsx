// src/pages/admin/assignments/user/[userId].tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

// 임시 타입 정의 (실제 타입 파일이 없는 경우)
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

// 임시 API 클래스 (실제 API 파일이 없는 경우)
class TempAssignmentAPI {
  static async getUsers(): Promise<{ users: User[] }> {
    // 임시 데이터 반환
    return {
      users: [
        {
          id: 'user1',
          name: '테스트 사용자',
          email: 'test@example.com',
          role: 'learner',
          created_at: new Date().toISOString(),
        },
      ],
    };
  }

  static async getUserAssignments(userId: string): Promise<any> {
    return {
      assignments: [],
      assignmentsByArea: {},
      totalAssignments: 0,
    };
  }

  static async assignCategory(request: any): Promise<any> {
    return { id: 'temp-assignment' };
  }

  static async removeAssignment(assignmentId: string): Promise<any> {
    return { success: true };
  }

  static async updateAssignment(
    assignmentId: string,
    updates: any
  ): Promise<any> {
    return { id: assignmentId, ...updates };
  }

  static async getRecommendedAssignments(
    userId: string
  ): Promise<Record<string, Category[]>> {
    return {};
  }

  static async getUserLearningPath(userId: string): Promise<any[]> {
    return [];
  }
}

class TempCategoryAPI {
  static async getCategories(): Promise<{ categories: Category[] }> {
    return { categories: [] };
  }
}

const UserAssignmentDetailPage: React.FC = () => {
  const router = useRouter();
  const { userId } = router.query;

  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendations, setRecommendations] = useState<
    Record<string, Category[]>
  >({});
  const [learningPath, setLearningPath] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드 상태
  const [editingAssignment, setEditingAssignment] = useState<string | null>(
    null
  );
  const [editForm, setEditForm] = useState({
    weekly_goal: 1,
    target_period_weeks: 4,
  });

  const areas = [
    {
      id: 'cognitive',
      name: '인지적 사고',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
    },
    {
      id: 'problem_solving',
      name: '문제해결',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
    },
    {
      id: 'decision_making',
      name: '의사결정',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
    },
    {
      id: 'social_emotional',
      name: '사회적/감정적',
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
    },
    {
      id: 'strategic',
      name: '전략적 사고',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
    },
  ];

  const getUserById = async (userIdStr: string): Promise<User> => {
    // 실제로는 사용자 API에서 단일 사용자 조회
    const usersData = await TempAssignmentAPI.getUsers();
    const foundUser = usersData.users.find((u: User) => u.id === userIdStr);
    if (!foundUser) throw new Error('사용자를 찾을 수 없습니다.');
    return foundUser;
  };

  useEffect(() => {
    if (userId && typeof userId === 'string') {
      loadUserData(userId);
    }
  }, [userId]);

  const loadUserData = async (userIdStr: string) => {
    try {
      setLoading(true);

      const [
        userData,
        assignmentsData,
        categoriesData,
        recommendationsData,
        pathData,
      ] = await Promise.all([
        getUserById(userIdStr),
        TempAssignmentAPI.getUserAssignments(userIdStr),
        TempCategoryAPI.getCategories(),
        TempAssignmentAPI.getRecommendedAssignments(userIdStr),
        TempAssignmentAPI.getUserLearningPath(userIdStr),
      ]);

      setUser(userData);
      setAssignments(assignmentsData);
      setCategories(categoriesData.categories);
      setRecommendations(recommendationsData);
      setLearningPath(pathData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 할당
  const handleAssignCategory = async (categoryId: string) => {
    if (!userId || typeof userId !== 'string') return;

    try {
      await TempAssignmentAPI.assignCategory({
        user_id: userId,
        category_id: categoryId,
        weekly_goal: 1,
        target_period_weeks: 4,
        assigned_at: new Date().toISOString(),
        is_active: true,
      });

      await loadUserData(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 실패');
    }
  };

  // 할당 해제
  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('정말로 이 할당을 해제하시겠습니까?')) return;

    try {
      await TempAssignmentAPI.removeAssignment(assignmentId);
      if (userId && typeof userId === 'string') {
        await loadUserData(userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 해제 실패');
    }
  };

  // 할당 수정
  const handleUpdateAssignment = async (assignmentId: string) => {
    try {
      await TempAssignmentAPI.updateAssignment(assignmentId, editForm);
      setEditingAssignment(null);
      if (userId && typeof userId === 'string') {
        await loadUserData(userId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 수정 실패');
    }
  };

  // 할당 편집 시작
  const startEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment.id);
    setEditForm({
      weekly_goal: assignment.weekly_goal,
      target_period_weeks: assignment.target_period_weeks,
    });
  };

  // 진행률 계산
  const calculateProgress = (assignment: any) => {
    const weeksSinceAssigned = Math.floor(
      (Date.now() - new Date(assignment.assigned_at).getTime()) /
        (1000 * 60 * 60 * 24 * 7)
    );

    const expectedTotal = Math.min(
      weeksSinceAssigned * assignment.weekly_goal,
      assignment.target_period_weeks * assignment.weekly_goal
    );

    // 임시로 완료된 로그 수를 랜덤하게 생성 (실제로는 DB에서 조회)
    const completedLogs = Math.floor(Math.random() * (expectedTotal + 1));
    const progressRate =
      expectedTotal > 0 ? (completedLogs / expectedTotal) * 100 : 0;

    return {
      completedLogs,
      expectedTotal,
      progressRate: Math.min(progressRate, 100),
      weeksSinceAssigned,
    };
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-gray-500'>사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-red-500'>사용자를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{user.name} - 할당 관리 | Think Habit 3</title>
        <meta
          name='description'
          content={`${user.name}의 카테고리 할당 관리`}
        />
      </Head>

      <div className='min-h-screen bg-gray-50'>
        {/* 헤더 */}
        <div className='bg-white shadow'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div className='flex items-center'>
                <button
                  onClick={() => router.push('/admin/assignments')}
                  className='mr-4 text-gray-600 hover:text-gray-800'
                >
                  ← 돌아가기
                </button>
                <div>
                  <h1 className='text-3xl font-bold text-gray-900'>
                    {user.name}
                  </h1>
                  <p className='mt-1 text-sm text-gray-600'>{user.email}</p>
                </div>
              </div>

              <div className='flex space-x-3'>
                <button
                  onClick={() => loadUserData(userId as string)}
                  className='bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700'
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* 에러 메시지 */}
          {error && (
            <div className='mb-6 bg-red-50 border border-red-200 rounded p-4'>
              <p className='text-red-700'>{error}</p>
              <button
                onClick={() => setError(null)}
                className='text-red-500 hover:text-red-700 text-sm mt-1'
              >
                닫기
              </button>
            </div>
          )}

          {/* 할당 현황 요약 */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-blue-600'>
                  {assignments.totalAssignments || 0}
                </div>
                <div className='text-sm text-gray-600'>총 할당</div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-green-600'>
                  {Object.keys(assignments.assignmentsByArea || {}).length}
                </div>
                <div className='text-sm text-gray-600'>활성 영역</div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-purple-600'>
                  {learningPath.reduce((sum, item: any) => {
                    const progress = calculateProgress(item);
                    return sum + (progress.progressRate || 0);
                  }, 0) / Math.max(learningPath.length, 1)}
                  %
                </div>
                <div className='text-sm text-gray-600'>평균 진행률</div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-orange-600'>
                  {learningPath.reduce((sum, item: any) => {
                    const progress = calculateProgress(item);
                    return sum + progress.completedLogs;
                  }, 0)}
                </div>
                <div className='text-sm text-gray-600'>완료된 훈련</div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* 현재 할당 목록 */}
            <div className='bg-white rounded-lg shadow'>
              <div className='p-6 border-b'>
                <h2 className='text-xl font-semibold'>현재 할당 목록</h2>
              </div>

              <div className='p-6'>
                {areas.map(area => {
                  const areaAssignments =
                    assignments.assignmentsByArea?.[area.id] || [];

                  return (
                    <div key={area.id} className='mb-6'>
                      <div
                        className={`flex items-center mb-3 p-3 rounded-lg ${area.lightColor}`}
                      >
                        <div
                          className={`w-4 h-4 rounded ${area.color} mr-3`}
                        ></div>
                        <h3 className='font-medium'>{area.name}</h3>
                        <span className='ml-auto text-sm text-gray-600'>
                          {areaAssignments.length}개
                        </span>
                      </div>

                      {areaAssignments.length > 0 ? (
                        <div className='space-y-3 ml-7'>
                          {areaAssignments.map((assignment: any) => {
                            const progress = calculateProgress(assignment);
                            const isEditing =
                              editingAssignment === assignment.id;

                            return (
                              <div
                                key={assignment.id}
                                className='border rounded-lg p-4'
                              >
                                <div className='flex justify-between items-start mb-2'>
                                  <div>
                                    <h4 className='font-medium'>
                                      {assignment.category?.name || '카테고리'}
                                    </h4>
                                    <p className='text-sm text-gray-600'>
                                      {assignment.category?.description || ''}
                                    </p>
                                  </div>
                                  <div className='flex space-x-2'>
                                    <button
                                      onClick={() =>
                                        startEditAssignment(assignment)
                                      }
                                      className='text-blue-600 hover:text-blue-800 text-sm'
                                    >
                                      편집
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRemoveAssignment(assignment.id)
                                      }
                                      className='text-red-600 hover:text-red-800 text-sm'
                                    >
                                      해제
                                    </button>
                                  </div>
                                </div>

                                {isEditing ? (
                                  <div className='mt-3 p-3 bg-gray-50 rounded'>
                                    <div className='grid grid-cols-2 gap-3 mb-3'>
                                      <div>
                                        <label className='block text-xs font-medium mb-1'>
                                          주당 목표
                                        </label>
                                        <input
                                          type='number'
                                          min='1'
                                          max='10'
                                          value={editForm.weekly_goal}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              weekly_goal: parseInt(
                                                e.target.value
                                              ),
                                            })
                                          }
                                          className='w-full px-2 py-1 border rounded text-sm'
                                        />
                                      </div>
                                      <div>
                                        <label className='block text-xs font-medium mb-1'>
                                          목표 기간 (주)
                                        </label>
                                        <input
                                          type='number'
                                          min='1'
                                          max='52'
                                          value={editForm.target_period_weeks}
                                          onChange={e =>
                                            setEditForm({
                                              ...editForm,
                                              target_period_weeks: parseInt(
                                                e.target.value
                                              ),
                                            })
                                          }
                                          className='w-full px-2 py-1 border rounded text-sm'
                                        />
                                      </div>
                                    </div>
                                    <div className='flex justify-end space-x-2'>
                                      <button
                                        onClick={() =>
                                          setEditingAssignment(null)
                                        }
                                        className='px-3 py-1 text-sm border rounded hover:bg-gray-100'
                                      >
                                        취소
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleUpdateAssignment(assignment.id)
                                        }
                                        className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
                                      >
                                        저장
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className='mt-3'>
                                    <div className='grid grid-cols-3 gap-4 text-sm'>
                                      <div>
                                        <span className='text-gray-600'>
                                          주당 목표:
                                        </span>
                                        <span className='ml-1 font-medium'>
                                          {assignment.weekly_goal}회
                                        </span>
                                      </div>
                                      <div>
                                        <span className='text-gray-600'>
                                          목표 기간:
                                        </span>
                                        <span className='ml-1 font-medium'>
                                          {assignment.target_period_weeks}주
                                        </span>
                                      </div>
                                      <div>
                                        <span className='text-gray-600'>
                                          진행률:
                                        </span>
                                        <span className='ml-1 font-medium'>
                                          {progress.progressRate.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>

                                    <div className='mt-3'>
                                      <div className='flex justify-between text-xs text-gray-600 mb-1'>
                                        <span>
                                          완료: {progress.completedLogs}회
                                        </span>
                                        <span>
                                          목표: {progress.expectedTotal}회
                                        </span>
                                      </div>
                                      <div className='w-full bg-gray-200 rounded-full h-2'>
                                        <div
                                          className={`h-2 rounded-full ${area.color}`}
                                          style={{
                                            width: `${Math.min(progress.progressRate, 100)}%`,
                                          }}
                                        ></div>
                                      </div>
                                    </div>

                                    <div className='mt-2 text-xs text-gray-500'>
                                      할당일:{' '}
                                      {new Date(
                                        assignment.assigned_at
                                      ).toLocaleDateString()}
                                      ({progress.weeksSinceAssigned}주 경과)
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className='ml-7 text-gray-500 text-sm'>
                          할당된 카테고리가 없습니다.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 추천 할당 */}
            <div className='bg-white rounded-lg shadow'>
              <div className='p-6 border-b'>
                <h2 className='text-xl font-semibold'>추천 할당</h2>
                <p className='text-sm text-gray-600 mt-1'>
                  아직 할당되지 않은 카테고리입니다.
                </p>
              </div>

              <div className='p-6 max-h-96 overflow-y-auto'>
                {areas.map(area => {
                  const areaRecommendations = recommendations[area.id] || [];

                  if (areaRecommendations.length === 0) return null;

                  return (
                    <div key={area.id} className='mb-6'>
                      <div
                        className={`flex items-center mb-3 p-3 rounded-lg ${area.lightColor}`}
                      >
                        <div
                          className={`w-4 h-4 rounded ${area.color} mr-3`}
                        ></div>
                        <h3 className='font-medium'>{area.name}</h3>
                        <span className='ml-auto text-sm text-gray-600'>
                          {areaRecommendations.length}개
                        </span>
                      </div>

                      <div className='space-y-2 ml-7'>
                        {areaRecommendations
                          .slice(0, 5)
                          .map((category: Category) => (
                            <div
                              key={category.id}
                              className='flex justify-between items-center p-3 border rounded hover:bg-gray-50'
                            >
                              <div>
                                <h4 className='font-medium text-sm'>
                                  {category.name}
                                </h4>
                                <p className='text-xs text-gray-600 truncate'>
                                  {category.description}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleAssignCategory(category.id)
                                }
                                className='ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700'
                              >
                                할당
                              </button>
                            </div>
                          ))}

                        {areaRecommendations.length > 5 && (
                          <div className='text-center text-sm text-gray-500 pt-2'>
                            +{areaRecommendations.length - 5}개 더 있음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {Object.values(recommendations).every(
                  (recs: Category[]) => recs.length === 0
                ) && (
                  <div className='text-center py-8 text-gray-500'>
                    모든 카테고리가 할당되었습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 학습 경로 */}
          {learningPath.length > 0 && (
            <div className='mt-8 bg-white rounded-lg shadow'>
              <div className='p-6 border-b'>
                <h2 className='text-xl font-semibold'>학습 경로</h2>
                <p className='text-sm text-gray-600 mt-1'>
                  할당 순서에 따른 학습 진행 현황입니다.
                </p>
              </div>

              <div className='p-6'>
                <div className='space-y-4'>
                  {learningPath.map((item: any, index: number) => {
                    const progress = calculateProgress(item);
                    const area = areas.find(a => a.id === item.category?.area);

                    return (
                      <div key={item.id} className='flex items-center'>
                        <div className='flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium'>
                          {index + 1}
                        </div>

                        <div className='ml-4 flex-1'>
                          <div className='flex justify-between items-start mb-2'>
                            <div>
                              <h4 className='font-medium'>
                                {item.category?.name || '카테고리'}
                              </h4>
                              <div className='flex items-center text-sm text-gray-600'>
                                <div
                                  className={`w-3 h-3 rounded ${area?.color} mr-2`}
                                ></div>
                                <span>{area?.name}</span>
                              </div>
                            </div>
                            <div className='text-right text-sm'>
                              <div className='font-medium'>
                                {progress.progressRate.toFixed(1)}%
                              </div>
                              <div className='text-gray-600'>
                                {progress.completedLogs}/
                                {progress.expectedTotal}
                              </div>
                            </div>
                          </div>

                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className={`h-2 rounded-full ${area?.color}`}
                              style={{
                                width: `${Math.min(progress.progressRate, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserAssignmentDetailPage;
