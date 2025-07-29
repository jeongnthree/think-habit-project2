// Mock for @/lib/supabase/server
const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  from: jest.fn().mockImplementation(table => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null,
    }),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null,
    }),
    then: jest.fn().mockResolvedValue({
      data: [{ id: 'test-id' }],
      error: null,
    }),
  })),
  storage: {
    from: jest.fn().mockImplementation(bucket => ({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['test']),
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      }),
      remove: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })),
  },
  rpc: jest.fn().mockImplementation((func, params) => ({
    then: jest.fn().mockResolvedValue({
      data: { result: 'success' },
      error: null,
    }),
  })),
};

export const createClient = jest.fn().mockReturnValue(mockSupabase);
