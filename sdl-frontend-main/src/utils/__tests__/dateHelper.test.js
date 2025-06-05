import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate, daysBetween, isToday, getRelativeTime } from '../dateHelper.js'

describe('dateHelper', () => {
  describe('formatDate', () => {
    it('應該正確格式化有效日期', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date, 'en-US')
      expect(result).toMatch(/January \d+, 2024/)
    })

    it('應該處理無效日期', () => {
      expect(formatDate(null)).toBe('無效日期')
      expect(formatDate(undefined)).toBe('無效日期')
      expect(formatDate(new Date('invalid'))).toBe('無效日期')
      expect(formatDate('not a date')).toBe('無效日期')
    })

    it('應該使用默認語言設置', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(typeof result).toBe('string')
      expect(result).not.toBe('無效日期')
    })
  })

  describe('daysBetween', () => {
    it('應該正確計算日期差', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-05')
      expect(daysBetween(date1, date2)).toBe(4)
    })

    it('應該處理負數差值', () => {
      const date1 = new Date('2024-01-05')
      const date2 = new Date('2024-01-01')
      expect(daysBetween(date1, date2)).toBe(-4)
    })

    it('應該處理相同日期', () => {
      const date = new Date('2024-01-01')
      expect(daysBetween(date, date)).toBe(0)
    })

    it('應該處理無效日期', () => {
      const validDate = new Date('2024-01-01')
      expect(daysBetween(null, validDate)).toBe(0)
      expect(daysBetween(validDate, null)).toBe(0)
      expect(daysBetween(new Date('invalid'), validDate)).toBe(0)
    })
  })

  describe('isToday', () => {
    let mockDate

    beforeEach(() => {
      // Mock Date constructor to always return 2024-01-15
      mockDate = new Date('2024-01-15T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('應該識別今天的日期', () => {
      const today = new Date('2024-01-15T08:30:00Z')
      expect(isToday(today)).toBe(true)
    })

    it('應該識別非今天的日期', () => {
      const yesterday = new Date('2024-01-14T12:00:00Z')
      const tomorrow = new Date('2024-01-16T12:00:00Z')
      expect(isToday(yesterday)).toBe(false)
      expect(isToday(tomorrow)).toBe(false)
    })

    it('應該處理無效日期', () => {
      expect(isToday(null)).toBe(false)
      expect(isToday(new Date('invalid'))).toBe(false)
    })
  })

  describe('getRelativeTime', () => {
    let mockNow

    beforeEach(() => {
      mockNow = new Date('2024-01-15T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockNow)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('應該返回"剛剛"對於很新的時間', () => {
      const justNow = new Date('2024-01-15T11:59:30Z')
      expect(getRelativeTime(justNow)).toBe('剛剛')
    })

    it('應該返回分鐘前', () => {
      const fiveMinutesAgo = new Date('2024-01-15T11:55:00Z')
      expect(getRelativeTime(fiveMinutesAgo)).toBe('5 分鐘前')
    })

    it('應該返回小時前', () => {
      const twoHoursAgo = new Date('2024-01-15T10:00:00Z')
      expect(getRelativeTime(twoHoursAgo)).toBe('2 小時前')
    })

    it('應該返回天前', () => {
      const threeDaysAgo = new Date('2024-01-12T12:00:00Z')
      expect(getRelativeTime(threeDaysAgo)).toBe('3 天前')
    })

    it('應該返回格式化日期對於很久以前', () => {
      const longAgo = new Date('2024-01-01T12:00:00Z')
      const result = getRelativeTime(longAgo)
      expect(result).not.toMatch(/天前/)
      expect(typeof result).toBe('string')
    })

    it('應該處理無效日期', () => {
      expect(getRelativeTime(null)).toBe('無效日期')
      expect(getRelativeTime(new Date('invalid'))).toBe('無效日期')
    })
  })
}) 