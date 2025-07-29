import {
    formatDate,
    formatDateTime,
    getRelativeTime,
    getWeekEnd,
    getWeekStart,
    isThisWeek,
    isToday
} from '../dateUtils'

describe('Date Utils', () => {
  const mockDate = new Date('2024-01-15T10:30:00Z')
  const mockNow = new Date('2024-01-15T15:00:00Z')

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockNow)
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      expect(formatDate(mockDate)).toBe('2024. 1. 15.')
    })

    it('handles string input', () => {
      expect(formatDate('2024-01-15')).toBe('2024. 1. 15.')
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      expect(formatDateTime(mockDate)).toBe('2024. 1. 15. 10:30')
    })
  })

  describe('getRelativeTime', () => {
    it('returns "방금 전" for very recent times', () => {
      const recent = new Date(mockNow.getTime() - 30000) // 30 seconds ago
      expect(getRelativeTime(recent)).toBe('방금 전')
    })

    it('returns minutes for recent times', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60 * 1000)
      expect(getRelativeTime(fiveMinutesAgo)).toBe('5분 전')
    })

    it('returns hours for times within a day', () => {
      const twoHoursAgo = new Date(mockNow.getTime() - 2 * 60 * 60 * 1000)
      expect(getRelativeTime(twoHoursAgo)).toBe('2시간 전')
    })

    it('returns days for times within a week', () => {
      const threeDaysAgo = new Date(mockNow.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(threeDaysAgo)).toBe('3일 전')
    })

    it('returns formatted date for older times', () => {
      const twoWeeksAgo = new Date(mockNow.getTime() - 14 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(twoWeeksAgo)).toBe('2024. 1. 1.')
    })
  })

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(mockNow)).toBe(true)
    })

    it('returns false for yesterday', () => {
      const yesterday = new Date(mockNow.getTime() - 24 * 60 * 60 * 1000)
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe('isThisWeek', () => {
    it('returns true for dates in current week', () => {
      expect(isThisWeek(mockNow)).toBe(true)
    })

    it('returns false for dates in previous week', () => {
      const lastWeek = new Date(mockNow.getTime() - 7 * 24 * 60 * 60 * 1000)
      expect(isThisWeek(lastWeek)).toBe(false)
    })
  })

  describe('getWeekStart', () => {
    it('returns start of week (Sunday)', () => {
      const weekStart = getWeekStart(mockDate)
      expect(weekStart.getDay()).toBe(0) // Sunday
      expect(weekStart.getHours()).toBe(0)
      expect(weekStart.getMinutes()).toBe(0)
      expect(weekStart.getSeconds()).toBe(0)
    })
  })

  describe('getWeekEnd', () => {
    it('returns end of week (Saturday)', () => {
      const weekEnd = getWeekEnd(mockDate)
      expect(weekEnd.getDay()).toBe(6) // Saturday
      expect(weekEnd.getHours()).toBe(23)
      expect(weekEnd.getMinutes()).toBe(59)
      expect(weekEnd.getSeconds()).toBe(59)
    })
  })
})