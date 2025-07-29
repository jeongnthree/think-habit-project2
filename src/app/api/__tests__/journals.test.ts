import { NextRequest } from 'next/server'
import { GET, POST } from '../journals/route'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'journal1',
                  title: 'Test Journal',
                  content: 'Test content',
                  student_id: 'user1',
                  category_id: 'category1',
                  is_public: true,
                  created_at: '2024-01-01T00:00:00Z',
                }
              ],
              error: null,
              count: 1,
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'new-journal',
              title: 'New Journal',
              content: 'New content',
              student_id: 'user1',
              category_id: 'category1',
              is_public: false,
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          }))
        }))
      }))
    }))
  }
}))

describe('/api/journals', () => {
  describe('GET', () => {
    it('returns journals list successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/journals?studentId=user1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0]).toMatchObject({
        id: 'journal1',
        title: 'Test Journal',
        content: 'Test content',
      })
    })

    it('returns 400 when studentId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/journals')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('학생 ID가 필요합니다.')
    })
  })

  describe('POST', () => {
    it('creates journal successfully', async () => {
      const requestBody = {
        student_id: 'user1',
        category_id: 'category1',
        title: 'New Journal',
        content: 'New content',
        is_public: false,
      }

      const request = new NextRequest('http://localhost:3000/api/journals', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: 'new-journal',
        title: 'New Journal',
        content: 'New content',
      })
    })

    it('returns 400 when required fields are missing', async () => {
      const requestBody = {
        title: 'New Journal',
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/journals', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('필수 필드가 누락되었습니다.')
    })
  })
})