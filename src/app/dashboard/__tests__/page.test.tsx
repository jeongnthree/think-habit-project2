import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '../page'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('renders dashboard with loading state initially', () => {
    render(<DashboardPage />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('renders dashboard content after loading', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('내 대시보드')).toBeInTheDocument()
    })

    expect(screen.getByText('훈련 진행 상황을 한눈에 확인하세요.')).toBeInTheDocument()
  })

  it('displays statistics cards', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('할당된 카테고리')).toBeInTheDocument()
      expect(screen.getByText('완료한 일지')).toBeInTheDocument()
      expect(screen.getByText('연속 기록')).toBeInTheDocument()
      expect(screen.getByText('전체 완료율')).toBeInTheDocument()
    })

    // Check if numbers are displayed
    expect(screen.getByText('3')).toBeInTheDocument() // assignedCategories
    expect(screen.getByText('12')).toBeInTheDocument() // completedJournals
    expect(screen.getByText('5일')).toBeInTheDocument() // streakDays
    expect(screen.getByText('75%')).toBeInTheDocument() // overallCompletionRate
  })

  it('displays progress section', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('이번 주 진행률')).toBeInTheDocument()
      expect(screen.getByText('목표 달성률')).toBeInTheDocument()
      expect(screen.getByText('60%')).toBeInTheDocument()
    })
  })

  it('displays recent journals section', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('최근 일지')).toBeInTheDocument()
      expect(screen.getByText('비판적 사고 훈련 - 뉴스 분석')).toBeInTheDocument()
      expect(screen.getByText('창의적 문제 해결')).toBeInTheDocument()
      expect(screen.getByText('감정 조절 훈련')).toBeInTheDocument()
    })
  })

  it('displays quick actions section', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('빠른 액션')).toBeInTheDocument()
      expect(screen.getByText('새 일지 작성')).toBeInTheDocument()
      expect(screen.getByText('일지 목록 보기')).toBeInTheDocument()
      expect(screen.getByText('관리자 페이지')).toBeInTheDocument()
    })
  })

  it('has correct navigation links', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /새 일지 작성/ })).toHaveAttribute('href', '/training')
      expect(screen.getByRole('link', { name: /일지 목록 보기/ })).toHaveAttribute('href', '/training/journals')
      expect(screen.getByRole('link', { name: /관리자 페이지/ })).toHaveAttribute('href', '/admin')
    })
  })
})