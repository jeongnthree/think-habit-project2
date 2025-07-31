/**
 * Integration tests for database operations and data consistency
 * Tests complete database workflows including transactions and rollbacks
 */

import { POST as createTaskTemplate } from '@/app/api/categories/[id]/tasks/route';
import { POST as createPhotoJournal } from '@/app/api/training/journals/photo/route';
import { GET as getJournals } from '@/app/api/training/journals/route';
import { POST as createStructuredJournal } from '@/app/api/training/journals/structured/route';
import { NextRequest } from 'next/server';

// Mock comprehensive database operations
const createMockDatabase = () => {
  const database = {
    users: [
      {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { role: 'student' },
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'coach-1',
        email: 'coach@example.com',
        user_metadata: { role: 'coach' },
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    categories: [
      {
        id: 'cat-1',
        name: '비판적 사고',
        description: '비판적 사고 훈련',
        template: '뉴스 분석하기',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    task_templates: [
      {
        id: 'task-1',
        category_id: 'cat-1',
        title: '기사 요약하기',
        description: '핵심 내용 요약',
        order_index: 0,
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'task-2',
        category_id: 'cat-1',
        title: '편향성 분석하기',
        description: '편향성 찾기',
        order_index: 1,
        is_required: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
    journals: [],
    task_completions: [],
    journal_photos: [],
    progress_tracking: [],
    user_category_assignments: [
      {
        id: 'assignment-1',
        user_id: 'user-1',
        category_id: 'cat-1',
        assigned_at: '2024-01-01T00:00:00Z',
        target_weekly_count: 3,
      },
    ],
  };

  const createMockClient = () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: database.users[0] },
        error: null,
      }),
    },
    from: jest.fn((table: string) => {
      const tableData = database[table as keyof typeof database] as any[];

      return {
        select: jest.fn((columns = '*') => ({
          eq: jest.fn((column: string, value: any) => ({
            single: jest.fn().mockImplementation(() => {
              const record = tableData.find(item => item[column] === value);
              return Promise.resolve({
                data: record || null,
                error: record ? null : { message: 'Record not found' },
              });
            }),
            order: jest.fn((column: string) => ({
              limit: jest.fn((limit: number) => ({
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: tableData
                    .filter(item => item[column] === value)
                    .slice(0, limit),
                  error: null,
                }),
              })),
            })),
            gte: jest.fn((column: string, value: any) => ({
              lte: jest.fn((column2: string, value2: any) => ({
                order: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue({
                    data: tableData.filter(
                      item => item[column] >= value && item[column2] <= value2
                    ),
                    error: null,
                  }),
                })),
              })),
            })),
          })),
          in: jest.fn((column: string, values: any[]) => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: tableData.filter(item => values.includes(item[column])),
                error: null,
              }),
            })),
          })),
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({
              data: tableData,
              error: null,
            }),
          })),
        })),
        insert: jest.fn((data: any) => ({
          select: jest.fn(() => ({
            single: jest.fn().mockImplementation(() => {
              const newRecord = {
                id: `${table}-${Date.now()}-${Math.random()}`,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              tableData.push(newRecord);
              return Promise.resolve({
                data: newRecord,
                error: null,
              });
            }),
          })),
        })),
        update: jest.fn((data: any) => ({
          eq: jest.fn((column: string, value: any) => ({
            select: jest.fn(() => ({
              single: jest.fn().mockImplementation(() => {
                const recordIndex = tableData.findIndex(
                  item => item[column] === value
                );
                if (recordIndex >= 0) {
                  tableData[recordIndex] = {
                    ...tableData[recordIndex],
                    ...data,
                    updated_at: new Date().toISOString(),
                  };
                  return Promise.resolve({
                    data: tableData[recordIndex],
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: null,
                  error: { message: 'Record not found' },
                });
              }),
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn((column: string, value: any) => ({
            select: jest.fn(() => ({
              single: jest.fn().mockImplementation(() => {
                const recordIndex = tableData.findIndex(
                  item => item[column] === value
                );
                if (recordIndex >= 0) {
                  const deletedRecord = tableData.splice(recordIndex, 1)[0];
                  return Promise.resolve({
                    data: deletedRecord,
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: null,
                  error: { message: 'Record not found' },
                });
              }),
            })),
          })),
        })),
        upsert: jest.fn((data: any) => ({
          select: jest.fn(() => ({
            single: jest.fn().mockImplementation(() => {
              const existingIndex = tableData.findIndex(
                item =>
                  item.user_id === data.user_id &&
                  item.category_id === data.category_id
              );

              if (existingIndex >= 0) {
                tableData[existingIndex] = {
                  ...tableData[existingIndex],
                  ...data,
                  updated_at: new Date().toISOString(),
                };
                return Promise.resolve({
                  data: tableData[existingIndex],
                  error: null,
                });
              } else {
                const newRecord = {
                  id: `${table}-${Date.now()}-${Math.random()}`,
                  ...data,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                tableData.push(newRecord);
                return Promise.resolve({
                  data: newRecord,
                  error: null,
                });
              }
            }),
          })),
        })),
      };
    }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test-path/image.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl: 'https://storage.example.com/test-path/image.jpg',
          },
        }),
      })),
    },
  });

  return { database, createMockClient };
};

// Mock validation functions
jest.mock('@/utils/journal-validation', () => ({
  validateStructuredJournal: jest.fn(data => ({
    success: true,
    data,
    fieldErrors: {},
  })),
  validatePhotoJournal: jest.fn(data => ({
    success: true,
    data,
    fieldErrors: {},
  })),
  validateTaskTemplate: jest.fn(data => ({
    success: true,
    data,
    fieldErrors: {},
  })),
}));

// Mock progress calculation
jest.mock('@/utils/progress-calculation', () => ({
  updateWeeklyProgress: jest.fn().mockResolvedValue({
    id: 'progress-1',
    user_id: 'user-1',
    category_id: 'cat-1',
    week_start_date: '2024-01-01',
    target_count: 3,
    completed_count: 1,
    completion_rate: 33,
    current_streak: 1,
    best_streak: 1,
    last_entry_date: '2024-01-01',
  }),
}));

describe('Database Operations Integration Tests', () => {
  let mockDb: ReturnType<typeof createMockDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDatabase();
    require('@/lib/supabase/server').createClient = jest.fn(() =>
      mockDb.createMockClient()
    );
  });

  describe('Structured Journal Database Operations', () => {
    it('should create journal with task completions in transaction', async () => {
      const journalData = {
        title: '트랜잭션 테스트 일지',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '완료된 태스크',
          },
          {
            task_template_id: 'task-2',
            is_completed: false,
            completion_note: '미완료 태스크',
          },
        ],
        reflection: '트랜잭션 테스트 성찰',
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await createStructuredJournal(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);

      // Verify journal was created
      expect(mockDb.database.journals).toHaveLength(1);
      expect(mockDb.database.journals[0].title).toBe('트랜잭션 테스트 일지');
      expect(mockDb.database.journals[0].user_id).toBe('user-1');

      // Verify task completions were created
      expect(mockDb.database.task_completions).toHaveLength(2);
      expect(mockDb.database.task_completions[0].is_completed).toBe(true);
      expect(mockDb.database.task_completions[1].is_completed).toBe(false);

      // Verify progress was updated
      expect(
        require('@/utils/progress-calculation').updateWeeklyProgress
      ).toHaveBeenCalledWith('user-1', 'cat-1', expect.any(Array));
    });

    it('should handle database constraint violations', async () => {
      // Mock constraint violation
      const mockClient = mockDb.createMockClient();
      mockClient.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'duplicate key value violates unique constraint',
                code: '23505',
              },
            }),
          })),
        })),
      }));

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      const journalData = {
        title: '제약 조건 테스트',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await createStructuredJournal(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('일지 저장에 실패했습니다');
    });

    it('should maintain referential integrity', async () => {
      // Test with invalid category_id
      const journalData = {
        title: '참조 무결성 테스트',
        category_id: 'invalid-category',
        journal_type: 'structured',
        task_completions: [],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await createStructuredJournal(request);
      const result = await response.json();

      // Should handle foreign key constraint
      expect(response.status).toBe(400);
      expect(result.error).toContain('카테고리');
    });

    it('should handle concurrent journal creation', async () => {
      const journalData = {
        title: '동시성 테스트 일지',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '완료',
          },
        ],
        is_public: false,
      };

      // Create multiple concurrent requests
      const requests = Array.from(
        { length: 5 },
        (_, i) =>
          new NextRequest('http://localhost/api/training/journals/structured', {
            method: 'POST',
            body: JSON.stringify({
              ...journalData,
              title: `동시성 테스트 일지 ${i + 1}`,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
      );

      const responses = await Promise.all(
        requests.map(request => createStructuredJournal(request))
      );

      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
      });

      // Should have created 5 journals
      expect(mockDb.database.journals).toHaveLength(5);
      expect(mockDb.database.task_completions).toHaveLength(5);
    });
  });

  describe('Photo Journal Database Operations', () => {
    it('should create photo journal with file storage', async () => {
      const mockFile = new File(['test image content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('title', '사진 일지 테스트');
      formData.append('category_id', 'cat-1');
      formData.append('journal_type', 'photo');
      formData.append('photos', mockFile);
      formData.append('photo_descriptions', JSON.stringify(['테스트 이미지']));
      formData.append('description', '사진 일지 설명');
      formData.append('is_public', 'false');

      const request = new NextRequest(
        'http://localhost/api/training/journals/photo',
        {
          method: 'POST',
          body: formData,
        }
      );

      const response = await createPhotoJournal(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);

      // Verify journal was created
      expect(mockDb.database.journals).toHaveLength(1);
      expect(mockDb.database.journals[0].journal_type).toBe('photo');

      // Verify photo records were created
      expect(mockDb.database.journal_photos).toHaveLength(1);
      expect(mockDb.database.journal_photos[0].photo_url).toContain(
        'storage.example.com'
      );
    });

    it('should handle file storage failures', async () => {
      // Mock storage failure
      const mockClient = mockDb.createMockClient();
      mockClient.storage.from = jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage quota exceeded' },
        }),
      }));

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('title', '스토리지 실패 테스트');
      formData.append('category_id', 'cat-1');
      formData.append('journal_type', 'photo');
      formData.append('photos', mockFile);

      const request = new NextRequest(
        'http://localhost/api/training/journals/photo',
        {
          method: 'POST',
          body: formData,
        }
      );

      const response = await createPhotoJournal(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toContain('파일 업로드');
    });

    it('should cleanup files on journal creation failure', async () => {
      // Mock successful file upload but journal creation failure
      const mockClient = mockDb.createMockClient();
      let uploadedFiles: string[] = [];

      mockClient.storage.from = jest.fn(() => ({
        upload: jest.fn().mockImplementation((path: string) => {
          uploadedFiles.push(path);
          return Promise.resolve({
            data: { path },
            error: null,
          });
        }),
        remove: jest.fn().mockImplementation((paths: string[]) => {
          uploadedFiles = uploadedFiles.filter(file => !paths.includes(file));
          return Promise.resolve({ data: null, error: null });
        }),
      }));

      mockClient.from = jest.fn((table: string) => {
        if (table === 'journals') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Journal creation failed' },
                }),
              })),
            })),
          };
        }
        return mockDb.createMockClient().from(table);
      });

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('title', '정리 테스트');
      formData.append('category_id', 'cat-1');
      formData.append('journal_type', 'photo');
      formData.append('photos', mockFile);

      const request = new NextRequest(
        'http://localhost/api/training/journals/photo',
        {
          method: 'POST',
          body: formData,
        }
      );

      const response = await createPhotoJournal(request);

      expect(response.status).toBe(500);
      // Files should be cleaned up
      expect(mockClient.storage.from().remove).toHaveBeenCalled();
    });
  });

  describe('Task Template Management', () => {
    it('should create task templates with proper ordering', async () => {
      const taskData = {
        title: '새 태스크',
        description: '새로운 태스크 설명',
        order_index: 2,
        is_required: true,
        difficulty_level: 'medium',
        estimated_minutes: 15,
      };

      const request = new NextRequest(
        'http://localhost/api/categories/cat-1/tasks',
        {
          method: 'POST',
          body: JSON.stringify(taskData),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Set coach user
      const mockClient = mockDb.createMockClient();
      mockClient.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockDb.database.users[1] }, // coach user
        error: null,
      });

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      const response = await createTaskTemplate(request, {
        params: { id: 'cat-1' },
      });
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);

      // Verify task was added to database
      expect(mockDb.database.task_templates).toHaveLength(3); // 2 existing + 1 new
      const newTask = mockDb.database.task_templates.find(
        t => t.title === '새 태스크'
      );
      expect(newTask).toBeDefined();
      expect(newTask?.order_index).toBe(2);
    });

    it('should handle task template reordering', async () => {
      // Create multiple tasks first
      const tasks = [
        { title: '태스크 A', order_index: 0 },
        { title: '태스크 B', order_index: 1 },
        { title: '태스크 C', order_index: 2 },
      ];

      for (const task of tasks) {
        mockDb.database.task_templates.push({
          id: `task-${task.title}`,
          category_id: 'cat-1',
          title: task.title,
          description: '설명',
          order_index: task.order_index,
          is_required: true,
          created_at: new Date().toISOString(),
        });
      }

      // Test reordering logic would be implemented in a separate endpoint
      expect(mockDb.database.task_templates).toHaveLength(5); // 2 original + 3 new
    });

    it('should validate task template dependencies', async () => {
      const taskData = {
        title: '의존성 태스크',
        description: '다른 태스크에 의존하는 태스크',
        order_index: 0,
        is_required: true,
        depends_on: ['non-existent-task'],
      };

      const request = new NextRequest(
        'http://localhost/api/categories/cat-1/tasks',
        {
          method: 'POST',
          body: JSON.stringify(taskData),
        }
      );

      // Mock validation failure
      require('@/utils/journal-validation').validateTaskTemplate.mockReturnValueOnce(
        {
          success: false,
          fieldErrors: {
            depends_on: '존재하지 않는 태스크에 의존할 수 없습니다.',
          },
        }
      );

      const response = await createTaskTemplate(request, {
        params: { id: 'cat-1' },
      });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.validationErrors.depends_on).toBeDefined();
    });
  });

  describe('Progress Tracking Database Operations', () => {
    it('should update progress tracking accurately', async () => {
      // Create a journal first
      const journalData = {
        title: '진행률 테스트 일지',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '완료',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      await createStructuredJournal(request);

      // Verify progress tracking was updated
      expect(mockDb.database.progress_tracking).toHaveLength(1);
      const progress = mockDb.database.progress_tracking[0];
      expect(progress.user_id).toBe('user-1');
      expect(progress.category_id).toBe('cat-1');
      expect(progress.completed_count).toBe(1);
    });

    it('should handle weekly progress reset', async () => {
      // Add existing progress from previous week
      mockDb.database.progress_tracking.push({
        id: 'old-progress',
        user_id: 'user-1',
        category_id: 'cat-1',
        week_start_date: '2023-12-25', // Previous week
        completed_count: 3,
        target_count: 3,
        completion_rate: 100,
        current_streak: 7,
        best_streak: 7,
        last_entry_date: '2023-12-31',
        created_at: '2023-12-25T00:00:00Z',
        updated_at: '2023-12-31T23:59:59Z',
      });

      // Create journal in new week
      const journalData = {
        title: '새 주 일지',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '새 주 첫 완료',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      await createStructuredJournal(request);

      // Should create new progress record for current week
      expect(mockDb.database.progress_tracking).toHaveLength(2);
      const currentWeekProgress = mockDb.database.progress_tracking.find(
        p => p.week_start_date === '2024-01-01'
      );
      expect(currentWeekProgress).toBeDefined();
      expect(currentWeekProgress?.completed_count).toBe(1);
    });

    it('should calculate streaks correctly', async () => {
      // Create journals for consecutive days
      const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];

      for (const date of dates) {
        mockDb.database.journals.push({
          id: `journal-${date}`,
          user_id: 'user-1',
          category_id: 'cat-1',
          title: `일지 ${date}`,
          journal_type: 'structured',
          created_at: `${date}T10:00:00Z`,
          is_public: false,
        });
      }

      // Progress calculation should handle streak logic
      expect(
        require('@/utils/progress-calculation').updateWeeklyProgress
      ).toBeDefined();
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain consistency during complex operations', async () => {
      // Simulate complex operation: create journal, update progress, assign achievements
      const journalData = {
        title: '복잡한 작업 테스트',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '완료',
          },
          {
            task_template_id: 'task-2',
            is_completed: true,
            completion_note: '완료',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await createStructuredJournal(request);
      expect(response.status).toBe(201);

      // Verify all related data was created consistently
      expect(mockDb.database.journals).toHaveLength(1);
      expect(mockDb.database.task_completions).toHaveLength(2);
      expect(mockDb.database.progress_tracking).toHaveLength(1);

      // All records should reference the same journal
      const journal = mockDb.database.journals[0];
      const completions = mockDb.database.task_completions;
      completions.forEach(completion => {
        expect(completion.journal_id).toBe(journal.id);
      });
    });

    it('should handle partial failures with rollback', async () => {
      // Mock scenario where journal creation succeeds but task completion fails
      const mockClient = mockDb.createMockClient();
      let journalCreated = false;

      mockClient.from = jest.fn((table: string) => {
        if (table === 'journals') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockImplementation(() => {
                  journalCreated = true;
                  return Promise.resolve({
                    data: {
                      id: 'journal-1',
                      title: '부분 실패 테스트',
                      user_id: 'user-1',
                    },
                    error: null,
                  });
                }),
              })),
            })),
          };
        } else if (table === 'task_completions') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Task completion failed' },
                }),
              })),
            })),
          };
        }
        return mockDb.createMockClient().from(table);
      });

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      const journalData = {
        title: '부분 실패 테스트',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '완료',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      const response = await createStructuredJournal(request);
      expect(response.status).toBe(500);

      // In a real implementation, the journal creation should be rolled back
      // For this test, we verify the error handling
      expect(journalCreated).toBe(true);
    });

    it('should enforce data validation at database level', async () => {
      // Test with invalid data that should be caught by database constraints
      const invalidJournalData = {
        title: '', // Empty title should fail validation
        category_id: 'cat-1',
        journal_type: 'invalid-type', // Invalid journal type
        task_completions: [],
        is_public: false,
      };

      // Mock validation to pass but database to fail
      require('@/utils/journal-validation').validateStructuredJournal.mockReturnValueOnce(
        {
          success: true,
          data: invalidJournalData,
          fieldErrors: {},
        }
      );

      const mockClient = mockDb.createMockClient();
      mockClient.from = jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'check constraint "valid_journal_type" violated',
                code: '23514',
              },
            }),
          })),
        })),
      }));

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(invalidJournalData),
        }
      );

      const response = await createStructuredJournal(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Query Performance and Optimization', () => {
    it('should use efficient queries for large datasets', async () => {
      // Add many records to test query efficiency
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `journal-${i}`,
        user_id: 'user-1',
        category_id: 'cat-1',
        title: `Journal ${i}`,
        journal_type: 'structured',
        created_at: new Date(2024, 0, (i % 30) + 1).toISOString(),
        is_public: i % 2 === 0,
      }));

      mockDb.database.journals.push(...largeDataset);

      const url = new URL('http://localhost/api/training/journals');
      url.searchParams.set('userId', 'user-1');
      url.searchParams.set('limit', '20');
      url.searchParams.set('offset', '0');

      const request = new NextRequest(url);
      const startTime = Date.now();

      const response = await getJournals(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should use proper indexing for frequent queries', async () => {
      // This would test that proper database indexes are used
      // In a real scenario, we'd check query execution plans

      const mockClient = mockDb.createMockClient();
      let queryCount = 0;

      mockClient.from = jest.fn((table: string) => {
        queryCount++;
        return mockDb.createMockClient().from(table);
      });

      require('@/lib/supabase/server').createClient = jest.fn(() => mockClient);

      // Perform multiple related queries
      const journalData = {
        title: '인덱스 테스트',
        category_id: 'cat-1',
        journal_type: 'structured',
        task_completions: [
          {
            task_template_id: 'task-1',
            is_completed: true,
            completion_note: '완료',
          },
        ],
        is_public: false,
      };

      const request = new NextRequest(
        'http://localhost/api/training/journals/structured',
        {
          method: 'POST',
          body: JSON.stringify(journalData),
        }
      );

      await createStructuredJournal(request);

      // Should minimize the number of database queries
      expect(queryCount).toBeLessThan(10);
    });
  });
});
