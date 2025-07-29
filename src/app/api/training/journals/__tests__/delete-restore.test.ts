// API tests for journal deletion and restoration

import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { POST as RESTORE } from '../[id]/restore/route';
import { DELETE } from '../[id]/route';

// Mock Supabase
jest.mock('@/lib/supabase/server');

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(),
  insert: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
};

const mockUserProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  role: 'student',
};

const mockJournal = {
  id: 'journal-1',
  title: 'Test Journal',
  content: 'Test content',
  student_id: 'profile-1',
  category_id: 'category-1',
  journal_type: 'structured',
  is_public: false,
  deleted_at: null,
  deleted_by: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category: { name: 'Test Category' },
  task_completions: [],
  journal_photos: [],
};

const mockDeletedJournal = {
  ...mockJournal,
  deleted_at: '2024-01-15T10:00:00Z',
  deleted_by: 'profile-1',
};

describe('Journal Deletion API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('DELETE /api/training/journals/[id]', () => {
    it('should soft delete journal successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null,
      });

      // Mock journal fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockJournal,
        error: null,
      });

      // Mock soft delete update
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockJournal, deleted_at: '2024-01-15T10:00:00Z' },
        error: null,
      });

      // Mock audit log insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1',
        {
          method: 'DELETE',
          body: JSON.stringify({ permanent: false }),
        }
      );

      const response = await DELETE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.type).toBe('soft');
      expect(result.message).toBe('Journal moved to trash');
    });

    it('should permanently delete journal successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null,
      });

      // Mock journal fetch with photos
      const journalWithPhotos = {
        ...mockDeletedJournal,
        journal_photos: [
          {
            id: 'photo-1',
            photo_url: 'https://example.com/storage/photo1.jpg',
          },
        ],
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: journalWithPhotos,
        error: null,
      });

      // Mock permanent delete
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.delete.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock audit log insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1',
        {
          method: 'DELETE',
          body: JSON.stringify({ permanent: true }),
        }
      );

      const response = await DELETE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.type).toBe('permanent');
      expect(result.message).toBe('Journal permanently deleted');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent journal', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null,
      });

      // Mock journal not found
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/non-existent',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, {
        params: { id: 'non-existent' },
      });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Journal not found');
    });

    it('should return 403 for unauthorized access', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockUserProfile, id: 'different-profile' },
        error: null,
      });

      // Mock journal fetch (owned by different user)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockJournal,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1',
        {
          method: 'DELETE',
        }
      );

      const response = await DELETE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });

  describe('POST /api/training/journals/[id]/restore', () => {
    it('should restore deleted journal successfully', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null,
      });

      // Mock deleted journal fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDeletedJournal,
        error: null,
      });

      // Mock restore update
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockDeletedJournal, deleted_at: null, deleted_by: null },
        error: null,
      });

      // Mock audit log insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock full journal fetch after restore
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockJournal, deleted_at: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1/restore',
        {
          method: 'POST',
        }
      );

      const response = await RESTORE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Journal restored successfully');
    });

    it('should return 400 for journal that is not deleted', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null,
      });

      // Mock non-deleted journal fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockJournal, // Not deleted
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1/restore',
        {
          method: 'POST',
        }
      );

      const response = await RESTORE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Journal is not deleted');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1/restore',
        {
          method: 'POST',
        }
      );

      const response = await RESTORE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return 403 for unauthorized access', async () => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock user profile fetch
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockUserProfile, id: 'different-profile' },
        error: null,
      });

      // Mock deleted journal fetch (owned by different user)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDeletedJournal,
        error: null,
      });

      const request = new NextRequest(
        'http://localhost/api/training/journals/journal-1/restore',
        {
          method: 'POST',
        }
      );

      const response = await RESTORE(request, { params: { id: 'journal-1' } });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });
  });
});
