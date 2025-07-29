'use client';

import { Card } from '@/components/ui';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

// 임시 사용자 데이터
const mockUsers: User[] = [
  {
    id: '1',
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'student@test.com',
    full_name: '김철수',
    role: 'student',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'teacher@test.com',
    full_name: '이선생',
    role: 'teacher',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'admin@test.com',
    full_name: '관리자',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 목록 로드
  const loadUsers = async () => {
    try {
      setLoading(true);
      // 실제로는 API 호출
      // const response = await fetch('/api/admin/users');
      // const data = await response.json();
      // if (data.success) {
      //   setUsers(data.data);
      // }

      // 임시 데이터 사용
      setUsers(mockUsers);
    } catch (err) {
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 역할 변경
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // 실제로는 API 호출
      // await fetch(`/api/admin/users/${userId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ role: newRole }),
      // });

      // 임시 처리
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      alert('역할이 변경되었습니다.');
    } catch (err) {
      alert('역할 변경에 실패했습니다.');
    }
  };

  // 역할별 색상
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'coach':
        return 'bg-green-100 text-green-800';
      case 'student':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 역할 한글명
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'teacher':
        return '선생님';
      case 'coach':
        return '코치';
      case 'student':
        return '학습자';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      {/* 헤더 */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>사용자 관리</h1>
        <p className='text-gray-600 mt-2'>
          시스템 사용자들의 정보와 역할을 관리합니다.
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
          <div className='text-red-700'>{error}</div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <Card className='p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-gray-100 rounded-lg'>
              <svg
                className='w-6 h-6 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>전체 사용자</p>
              <p className='text-2xl font-bold text-gray-900'>{users.length}</p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <svg
                className='w-6 h-6 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>학습자</p>
              <p className='text-2xl font-bold text-gray-900'>
                {users.filter(u => u.role === 'student').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <svg
                className='w-6 h-6 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>선생님/코치</p>
              <p className='text-2xl font-bold text-gray-900'>
                {
                  users.filter(u => u.role === 'teacher' || u.role === 'coach')
                    .length
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-red-100 rounded-lg'>
              <svg
                className='w-6 h-6 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>관리자</p>
              <p className='text-2xl font-bold text-gray-900'>
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 사용자 목록 */}
      <Card className='overflow-hidden'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>사용자 목록</h2>
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  사용자
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  이메일
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  역할
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  가입일
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  액션
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map(user => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium'>
                        {user.full_name?.charAt(0) ||
                          user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.full_name || '이름 없음'}
                        </div>
                        <div className='text-sm text-gray-500'>
                          ID: {user.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>{user.email}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                    >
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                      className='text-sm border border-gray-300 rounded px-2 py-1'
                    >
                      <option value='student'>학습자</option>
                      <option value='teacher'>선생님</option>
                      <option value='coach'>코치</option>
                      <option value='admin'>관리자</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
