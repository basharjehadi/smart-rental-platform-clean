/**
 * 📅 Centralized Date Utilities
 *
 * All date math operations use Europe/Warsaw timezone to ensure consistency
 * across the review system, lease status checker, and other date-sensitive operations.
 *
 * This prevents timezone-related bugs and ensures publishAfter calculations
 * are consistent with job comparisons.
 */

import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

// Timezone constant - all operations use this
export const WARSAW_TIMEZONE = 'Europe/Warsaw';

/**
 * Get current time in Warsaw timezone
 * @returns {Date} Current time in Warsaw timezone
 */
export function getCurrentWarsawTime() {
  return toZonedTime(new Date(), WARSAW_TIMEZONE);
}

/**
 * Convert a date to Warsaw timezone
 * @param {Date} date - Date to convert
 * @returns {Date} Date in Warsaw timezone
 */
export function toWarsawTime(date) {
  return toZonedTime(date, WARSAW_TIMEZONE);
}

/**
 * Convert a Warsaw timezone date to UTC
 * @param {Date} warsawDate - Date in Warsaw timezone
 * @returns {Date} Date in UTC
 */
export function fromWarsawTime(warsawDate) {
  return fromZonedTime(warsawDate, WARSAW_TIMEZONE);
}

/**
 * Add days to a date, handling DST boundaries correctly
 * Uses Warsaw timezone for all calculations
 *
 * @param {Date} date - Base date (will be converted to Warsaw timezone)
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date in Warsaw timezone
 */
export function addDays(date, days) {
  const warsawDate = toWarsawTime(date);
  const result = new Date(warsawDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add days to a date and return as UTC
 * Useful for storing in database while maintaining Warsaw timezone logic
 *
 * @param {Date} date - Base date (will be converted to Warsaw timezone)
 * @param {number} days - Number of days to add
 * @returns {Date} New date in UTC
 */
export function addDaysUTC(date, days) {
  const warsawResult = addDays(date, days);
  return fromWarsawTime(warsawResult);
}

/**
 * Calculate publishAfter date for reviews
 * Always adds 14 days to lease end date in Warsaw timezone
 *
 * @param {Date} leaseEndDate - Lease end date
 * @returns {Date} publishAfter date in UTC (for database storage)
 */
export function calculatePublishAfter(leaseEndDate) {
  const warsawResult = addDays(leaseEndDate, 14);
  // Convert to UTC for database storage by creating a new Date from the ISO string
  const utcDate = new Date(warsawResult.toISOString());
  // Ensure it's treated as UTC
  return new Date(
    Date.UTC(
      utcDate.getUTCFullYear(),
      utcDate.getUTCMonth(),
      utcDate.getUTCDate(),
      utcDate.getUTCHours(),
      utcDate.getUTCMinutes(),
      utcDate.getUTCSeconds(),
      utcDate.getUTCMilliseconds()
    )
  );
}

/**
 * Check if a date is in the past relative to current Warsaw time
 *
 * @param {Date} date - Date to check
 * @returns {boolean} true if date is in the past
 */
export function isPastDate(date) {
  const warsawNow = getCurrentWarsawTime();
  const warsawDate = toWarsawTime(date);
  return warsawDate < warsawNow;
}

/**
 * Check if a date is in the future relative to current Warsaw time
 *
 * @param {Date} date - Date to check
 * @returns {boolean} true if date is in the future
 */
export function isFutureDate(date) {
  const warsawNow = getCurrentWarsawTime();
  const warsawDate = toWarsawTime(date);
  return warsawDate > warsawNow;
}

/**
 * Get the difference in days between two dates
 * Uses Warsaw timezone for accurate day boundary calculations
 *
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in days (positive if date2 > date1)
 */
export function getDaysDifference(date1, date2) {
  const warsawDate1 = toWarsawTime(date1);
  const warsawDate2 = toWarsawTime(date2);

  const diffTime = warsawDate2.getTime() - warsawDate1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format a date in Warsaw timezone for display
 *
 * @param {Date} date - Date to format
 * @param {string} formatString - Date-fns format string
 * @returns {string} Formatted date string
 */
export function formatWarsawDate(date, formatString = 'yyyy-MM-dd HH:mm:ss') {
  const warsawDate = toWarsawTime(date);
  return format(warsawDate, formatString, { timeZone: WARSAW_TIMEZONE });
}

/**
 * Get the start of day in Warsaw timezone
 *
 * @param {Date} date - Date to get start of day for
 * @returns {Date} Start of day in Warsaw timezone
 */
export function getStartOfDayWarsaw(date) {
  const warsawDate = toWarsawTime(date);
  const startOfDay = new Date(warsawDate);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get the end of day in Warsaw timezone
 *
 * @param {Date} date - Date to get end of day for
 * @returns {Date} End of day in Warsaw timezone
 */
export function getEndOfDayWarsaw(date) {
  const warsawDate = toWarsawTime(date);
  const endOfDay = new Date(warsawDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Check if current time is within a specific hour range in Warsaw timezone
 * Useful for cron job scheduling
 *
 * @param {number} startHour - Start hour (0-23)
 * @param {number} endHour - End hour (0-23)
 * @returns {boolean} true if current time is within the range
 */
export function isWithinHourRange(startHour, endHour) {
  const warsawNow = getCurrentWarsawTime();
  const currentHour = warsawNow.getHours();

  if (startHour <= endHour) {
    // Same day range (e.g., 9:00 - 17:00)
    return currentHour >= startHour && currentHour < endHour;
  } else {
    // Overnight range (e.g., 22:00 - 06:00)
    return currentHour >= startHour || currentHour < endHour;
  }
}

/**
 * Get the next occurrence of a specific hour in Warsaw timezone
 * Useful for scheduling future jobs
 *
 * @param {number} hour - Target hour (0-23)
 * @returns {Date} Next occurrence of the hour
 */
export function getNextHourOccurrence(hour) {
  const warsawNow = getCurrentWarsawTime();
  const nextHour = new Date(warsawNow);

  if (warsawNow.getHours() >= hour) {
    // Target hour has passed today, get tomorrow
    nextHour.setDate(nextHour.getDate() + 1);
  }

  nextHour.setHours(hour, 0, 0, 0);
  // Return the date in the same timezone context for testing
  return nextHour;
}

/**
 * Validate that a date is a valid Date object
 *
 * @param {any} date - Date to validate
 * @returns {boolean} true if valid date
 */
export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse a date string and convert to Warsaw timezone
 *
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Date in Warsaw timezone, or null if invalid
 */
export function parseWarsawDate(dateString) {
  try {
    const date = new Date(dateString);
    if (!isValidDate(date)) {
      return null;
    }
    return toWarsawTime(date);
  } catch {
    return null;
  }
}
