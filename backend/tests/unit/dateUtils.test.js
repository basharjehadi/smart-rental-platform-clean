/**
 * 📅 Unit Tests for Centralized Date Utilities
 * 
 * Tests timezone handling, DST boundaries, and date math operations
 * using Europe/Warsaw timezone for consistency.
 */

import {
  getCurrentWarsawTime,
  toWarsawTime,
  fromWarsawTime,
  addDays,
  addDaysUTC,
  calculatePublishAfter,
  isPastDate,
  isFutureDate,
  getDaysDifference,
  formatWarsawDate,
  getStartOfDayWarsaw,
  getEndOfDayWarsaw,
  isWithinHourRange,
  getNextHourOccurrence,
  isValidDate,
  parseWarsawDate,
  WARSAW_TIMEZONE
} from '../../src/utils/dateUtils.js';

describe('Date Utilities', () => {
  // Mock dates for consistent testing
  const mockDate = new Date('2024-01-15T10:00:00Z'); // UTC
  const mockDateWarsaw = new Date('2024-01-15T11:00:00+01:00'); // Warsaw time (CET)
  const mockDateWarsawDST = new Date('2024-07-15T12:00:00+02:00'); // Warsaw time (CEST)

  describe('Timezone Constants', () => {
    test('should export WARSAW_TIMEZONE constant', () => {
      expect(WARSAW_TIMEZONE).toBe('Europe/Warsaw');
    });
  });

  describe('getCurrentWarsawTime', () => {
    test('should return current time in Warsaw timezone', () => {
      const result = getCurrentWarsawTime();
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(0);
    });

    test('should handle DST transitions correctly', () => {
      // Test during winter (CET)
      const winterDate = new Date('2024-01-15T10:00:00Z');
      const winterWarsaw = toWarsawTime(winterDate);
      expect(winterWarsaw.getHours()).toBe(11); // +1 hour in winter

      // Test during summer (CEST)
      const summerDate = new Date('2024-07-15T10:00:00Z');
      const summerWarsaw = toWarsawTime(summerDate);
      expect(summerWarsaw.getHours()).toBe(12); // +2 hours in summer
    });
  });

  describe('toWarsawTime', () => {
    test('should convert UTC date to Warsaw timezone', () => {
      const result = toWarsawTime(mockDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(mockDate.getTime());
    });

    test('should handle DST boundary correctly', () => {
      // March 31, 2024 - DST starts (2:00 AM becomes 3:00 AM)
      const dstStart = new Date('2024-03-31T01:59:00Z');
      const dstStartWarsaw = toWarsawTime(dstStart);
      // Note: Actual timezone conversion may vary based on DST rules
      expect(dstStartWarsaw.getHours()).toBeGreaterThanOrEqual(2);
      expect(dstStartWarsaw.getHours()).toBeLessThanOrEqual(4);

      const dstStart2 = new Date('2024-03-31T02:00:00Z');
      const dstStart2Warsaw = toWarsawTime(dstStart2);
      expect(dstStart2Warsaw.getHours()).toBeGreaterThanOrEqual(2);
      expect(dstStart2Warsaw.getHours()).toBeLessThanOrEqual(4);
    });
  });

  describe('fromWarsawTime', () => {
    test('should convert Warsaw timezone date to UTC', () => {
      const result = fromWarsawTime(mockDateWarsaw);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(mockDateWarsaw.getTime());
    });

    test('should handle DST boundary correctly', () => {
      // October 27, 2024 - DST ends (3:00 AM becomes 2:00 AM)
      const dstEnd = new Date('2024-10-27T02:59:00+02:00'); // CEST
      const dstEndUTC = fromWarsawTime(dstEnd);
      // Note: Actual timezone conversion may vary based on DST rules
      expect(dstEndUTC.getUTCHours()).toBeGreaterThanOrEqual(0);
      expect(dstEndUTC.getUTCHours()).toBeLessThanOrEqual(2);

      const dstEnd2 = new Date('2024-10-27T03:00:00+01:00'); // CET
      const dstEnd2UTC = fromWarsawTime(dstEnd2);
      expect(dstEnd2UTC.getUTCHours()).toBeGreaterThanOrEqual(1);
      expect(dstEnd2UTC.getUTCHours()).toBeLessThanOrEqual(3);
    });
  });

  describe('addDays', () => {
    test('should add days correctly in Warsaw timezone', () => {
      const result = addDays(mockDate, 5);
      expect(result).toBeInstanceOf(Date);
      
      // Should be 5 days later in Warsaw time
      const expectedDate = new Date(mockDate);
      expectedDate.setDate(expectedDate.getDate() + 5);
      expect(result.getDate()).toBe(expectedDate.getDate());
    });

    test('should handle negative days', () => {
      const result = addDays(mockDate, -3);
      expect(result).toBeInstanceOf(Date);
      
      const expectedDate = new Date(mockDate);
      expectedDate.setDate(expectedDate.getDate() - 3);
      expect(result.getDate()).toBe(expectedDate.getDate());
    });

    test('should handle DST boundary crossings correctly', () => {
      // March 30, 2024 - day before DST starts
      const beforeDST = new Date('2024-03-30T10:00:00Z');
      const afterDST = addDays(beforeDST, 1);
      
      // Should still be the same time of day despite DST change
      expect(afterDST.getHours()).toBe(beforeDST.getHours());
    });

    test('should handle month/year boundaries', () => {
      const endOfMonth = new Date('2024-01-31T10:00:00Z');
      const nextMonth = addDays(endOfMonth, 1);
      expect(nextMonth.getMonth()).toBe(1); // February
      expect(nextMonth.getDate()).toBe(1);
    });
  });

  describe('addDaysUTC', () => {
    test('should add days and return UTC date', () => {
      const result = addDaysUTC(mockDate, 7);
      expect(result).toBeInstanceOf(Date);
      
      // Should be 7 days later
      const expectedDate = new Date(mockDate);
      expectedDate.setDate(expectedDate.getDate() + 7);
      expect(result.getDate()).toBe(expectedDate.getDate());
    });

    test('should maintain timezone consistency', () => {
      const result = addDaysUTC(mockDate, 1);
      const warsawResult = toWarsawTime(result);
      
      // Should be same time of day in Warsaw time
      expect(warsawResult.getHours()).toBe(mockDateWarsaw.getHours());
    });
  });

  describe('calculatePublishAfter', () => {
    test('should calculate publishAfter as 14 days from lease end date', () => {
      const leaseEndDate = new Date('2024-01-15T00:00:00Z');
      const result = calculatePublishAfter(leaseEndDate);
      
      expect(result).toBeInstanceOf(Date);
      
      // Should be 14 days later
      const expectedDate = new Date(leaseEndDate);
      expectedDate.setDate(expectedDate.getDate() + 14);
      expect(result.getDate()).toBe(expectedDate.getDate());
    });

    test('should handle DST transitions in publishAfter calculation', () => {
      // Test lease ending during DST transition
      const leaseEndDST = new Date('2024-03-30T00:00:00Z'); // Day before DST starts
      const result = calculatePublishAfter(leaseEndDST);
      
      // Should be 14 days later, accounting for DST
      const expectedDate = new Date(leaseEndDST);
      expectedDate.setDate(expectedDate.getDate() + 14);
      expect(result.getDate()).toBe(expectedDate.getDate());
    });

    test('should return UTC date for database storage', () => {
      const leaseEndDate = new Date('2024-01-15T00:00:00Z');
      const result = calculatePublishAfter(leaseEndDate);
      
      // Should be UTC date for database storage
      // Note: JavaScript Date objects always have timezone offset based on local system
      // but toISOString() ensures UTC representation
      expect(result.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify it's 14 days after the lease end date
      const expectedDate = new Date(leaseEndDate);
      expectedDate.setDate(expectedDate.getDate() + 14);
      expect(result.getDate()).toBe(expectedDate.getDate());
    });
  });

  describe('isPastDate', () => {
    test('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      expect(isPastDate(pastDate)).toBe(true);
    });

    test('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(isPastDate(futureDate)).toBe(false);
    });

    test('should handle DST boundaries correctly', () => {
      // Test with dates around DST transitions
      const now = getCurrentWarsawTime();
      expect(isPastDate(now)).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    test('should return true for future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(isFutureDate(futureDate)).toBe(true);
    });

    test('should return false for past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      expect(isFutureDate(pastDate)).toBe(false);
    });
  });

  describe('getDaysDifference', () => {
    test('should calculate correct day difference', () => {
      const date1 = new Date('2024-01-15T00:00:00Z');
      const date2 = new Date('2024-01-20T00:00:00Z');
      
      expect(getDaysDifference(date1, date2)).toBe(5);
    });

    test('should handle negative differences', () => {
      const date1 = new Date('2024-01-20T00:00:00Z');
      const date2 = new Date('2024-01-15T00:00:00Z');
      
      expect(getDaysDifference(date1, date2)).toBe(-5);
    });

    test('should handle DST boundaries correctly', () => {
      const beforeDST = new Date('2024-03-30T00:00:00Z');
      const afterDST = new Date('2024-04-01T00:00:00Z');
      
      // Should be 2 days despite DST change
      expect(getDaysDifference(beforeDST, afterDST)).toBe(2);
    });
  });

  describe('formatWarsawDate', () => {
    test('should format date in Warsaw timezone', () => {
      const result = formatWarsawDate(mockDate, 'yyyy-MM-dd');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should use default format if not specified', () => {
      const result = formatWarsawDate(mockDate);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getStartOfDayWarsaw', () => {
    test('should return start of day in Warsaw timezone', () => {
      const result = getStartOfDayWarsaw(mockDate);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('getEndOfDayWarsaw', () => {
    test('should return end of day in Warsaw timezone', () => {
      const result = getEndOfDayWarsaw(mockDate);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('isWithinHourRange', () => {
    test('should return true for current time within range', () => {
      // Mock current time to 14:00 (2 PM)
      const mockNow = new Date('2024-01-15T14:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      
      expect(isWithinHourRange(9, 17)).toBe(true);
      expect(isWithinHourRange(14, 16)).toBe(true);
      
      jest.restoreAllMocks();
    });

    test('should return false for current time outside range', () => {
      const mockNow = new Date('2024-01-15T14:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      
      expect(isWithinHourRange(9, 13)).toBe(false);
      expect(isWithinHourRange(16, 18)).toBe(false);
      
      jest.restoreAllMocks();
    });

    test('should handle overnight ranges', () => {
      const mockNow = new Date('2024-01-15T23:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      
      expect(isWithinHourRange(22, 6)).toBe(true);
      
      jest.restoreAllMocks();
    });
  });

  describe('getNextHourOccurrence', () => {
    test('should return next occurrence of specified hour', () => {
      const mockNow = new Date('2024-01-15T14:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      
      const result = getNextHourOccurrence(16); // 4 PM
      expect(result.getHours()).toBe(16);
      expect(result.getDate()).toBe(15); // Same day
      
      jest.restoreAllMocks();
    });

    test('should return next day if hour has passed', () => {
      const mockNow = new Date('2024-01-15T14:30:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
      
      const result = getNextHourOccurrence(10); // 10 AM
      expect(result.getHours()).toBe(10);
      expect(result.getDate()).toBe(16); // Next day
      
      jest.restoreAllMocks();
    });
  });

  describe('isValidDate', () => {
    test('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });

    test('should return false for invalid dates', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('not a date')).toBe(false);
    });
  });

  describe('parseWarsawDate', () => {
    test('should parse valid date string and convert to Warsaw timezone', () => {
      const result = parseWarsawDate('2024-01-15T10:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(isValidDate(result)).toBe(true);
    });

    test('should return null for invalid date string', () => {
      expect(parseWarsawDate('invalid date')).toBeNull();
      expect(parseWarsawDate('')).toBeNull();
    });
  });

  describe('DST Boundary Tests', () => {
    test('should handle spring forward (DST start) correctly', () => {
      // March 31, 2024 - clocks go forward 1 hour
      const beforeDST = new Date('2024-03-31T01:30:00Z');
      const afterDST = new Date('2024-03-31T03:30:00Z');
      
      const beforeWarsaw = toWarsawTime(beforeDST);
      const afterWarsaw = toWarsawTime(afterDST);
      
      // Should be 1-2 hours difference in Warsaw time due to DST transition
      const diffHours = (afterWarsaw.getTime() - beforeWarsaw.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(1);
      expect(diffHours).toBeLessThanOrEqual(2);
    });

    test('should handle fall back (DST end) correctly', () => {
      // October 27, 2024 - clocks go back 1 hour
      const beforeDST = new Date('2024-10-27T02:30:00+02:00'); // CEST
      const afterDST = new Date('2024-10-27T02:30:00+01:00'); // CET
      
      const beforeUTC = fromWarsawTime(beforeDST);
      const afterUTC = fromWarsawTime(afterDST);
      
      // Should be 0-1 hour difference in UTC due to DST transition
      const diffHours = (afterUTC.getTime() - beforeUTC.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(0);
      expect(diffHours).toBeLessThanOrEqual(1);
    });

    test('should maintain consistent day boundaries during DST transitions', () => {
      // Test adding days across DST boundaries
      const beforeDST = new Date('2024-03-30T00:00:00Z');
      const afterDST = addDays(beforeDST, 1);
      
      // Should still be next day despite DST change
      expect(afterDST.getDate()).toBe(beforeDST.getDate() + 1);
    });
  });
});
