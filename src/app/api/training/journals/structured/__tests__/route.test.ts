import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

// Mock validation
jest.mock('@/utils/journal-validation', () => ({
  validateStructuredJournal: jest.fn(),
}));

// Mock progress calculation
jest.mock('@/utils/progress-calculation', () => ({
  updateWeeklyProgress: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
};

const validJournalData = {
  title: '테스트 일지',
  category_id: '123e4567-e89b-12d3-a456-426614174000',
  journal_type: 'structured',
  task_completions: [
    {
      task_template_id: '123e4567-e89b-12d3-a456-426614174001',
      is_completed: true,
      completion_note: '완료했습니다',
    },
  ],
  reflection: '오늘의 성찰',
  is_public: false,
};

describe('/api/training/journals/structured', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    require('@/lib/supabase/server').createClient.mockReturnValue(mockSupabase);
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null,
    });

    require('@/utils/journal-validation').validateStructuredJournal.mockReturnValue({
      success: true,
      data: validJournalData,
      fieldErrors: {},
    });

    require('@/utils/progress-calculation').updateWeeklyProgress.mockResolvedValue({
      id: 'progress1',
      completion_rate: 67,
    });
  });

  describe('POST', () => {
    it('creates structured journal successfully', async () => {
      const mockJournal = {
        id: 'journal1',
        ...validJournalData,
        user_id: 'user1',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: mockJournal,
        error: null,
      });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.journal).toEqual(mockJournal);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('인증이 필요합니다');
    });

    it('returns 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('잘못된 요청 형식입니다');
    });

    it('returns 400 for validation errors', async () => {
      require('@/utils/journal-validation').validateStructuredJournal.mockReturnValue({
        success: false,
        fieldErrors: {
          title: '제목을 입력해주세요',
        },
      });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify({ ...validJournalData, title: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('입력 데이터가 올바르지 않습니다');
      expect(data.validationErrors).toEqual({
        title: '제목을 입력해주세요',
      });
    });

    it('handles database insertion error', async () => {
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('일지 저장에 실패했습니다');
    });

    it('handles task completion insertion', async () => {
      const mockJournal = {
        id: 'journal1',
        ...validJournalData,
        user_id: 'user1',
      };

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: mockJournal,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'completion1' }],
          error: null,
        });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockSupabase.from).toHaveBeenCalledWith('task_completions');
    });

    it('handles task completion insertion error', async () => {
      const mockJournal = {
        id: 'journal1',
        ...validJournalData,
        user_id: 'user1',
      };

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: mockJournal,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Task completion error' },
        });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('태스크 완료 정보 저장에 실패했습니다');
    });

    it('updates weekly progress after journal creation', async () => {
      const mockJournal = {
        id: 'journal1',
        ...validJournalData,
        user_id: 'user1',
      };

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: mockJournal,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'completion1' }],
          error: null,
        });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);

      expect(require('@/utils/progress-calculation').updateWeeklyProgress)
        .toHaveBeenCalledWith('user1', validJournalData.category_id, expect.any(Array));
    });

    it('handles progress update error gracefully', async () => {
      const mockJournal = {
        id: 'journal1',
        ...validJournalData,
        user_id: 'user1',
      };

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: mockJournal,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'completion1' }],
          error: null,
        });

      require('@/utils/progress-calculation').updateWeeklyProgress
        .mockRejectedValue(new Error('Progress update failed'));

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed even if progress update fails
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('validates required fields', async () => {
      const incompleteData = {
        title: '테스트 일지',
        // missing category_id and other required fields
      };

      require('@/utils/journal-validation').validateStructuredJournal.mockReturnValue({
        success: false,
        fieldErrors: {
          category_id: '카테고리를 선택해주세요',
          task_completions: '최소 하나의 태스크가 필요합니다',
        },
      });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.validationErrors).toHaveProperty('category_id');
      expect(data.validationErrors).toHaveProperty('task_completions');
    });

    it('handles unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(validJournalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('서버 오류가 발생했습니다');
    });

    it('processes task completions correctly', async () => {
      const journalWithMultipleTasks = {
        ...validJournalData,
        task_completions: [
          {
            task_template_id: '123e4567-e89b-12d3-a456-426614174001',
            is_completed: true,
            completion_note: '첫 번째 완료',
          },
          {
            task_template_id: '123e4567-e89b-12d3-a456-426614174002',
            is_completed: false,
            completion_note: '',
          },
        ],
      };

      const mockJournal = {
        id: 'journal1',
        ...journalWithMultipleTasks,
        user_id: 'user1',
      };

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({
          data: mockJournal,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: 'completion1' }, { id: 'completion2' }],
          error: null,
        });

      const request = new NextRequest('http://localhost/api/training/journals/structured', {
        method: 'POST',
        body: JSON.stringify(journalWithMultipleTasks),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });
});