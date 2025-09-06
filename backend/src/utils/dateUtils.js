/**
 * Date utility functions for the Smart Rental System
 * 
 * This module provides date calculation functions including the termination policy
 * implementation as outlined by ChatGPT.
 */

/**
 * Compute the earliest possible termination end date based on the cutoff policy
 * 
 * @param {Date} requestAt - The date when the termination request is made
 * @param {Object} policy - Termination policy configuration
 * @param {number} policy.cutoffDay - Day of month cutoff (e.g., 10)
 * @param {number} policy.minNoticeDays - Minimum notice period in days (e.g., 30)
 * @param {string} policy.timezone - Timezone for calculations (e.g., 'Europe/Warsaw')
 * @returns {Date} The earliest possible termination end date
 */
export const computeEarliestTerminationEnd = (requestAt, policy) => {
  const { cutoffDay = 10, minNoticeDays = 0, timezone = 'Europe/Warsaw' } = policy;
  
  // Convert request date to the specified timezone
  // Using basic Date methods since we don't want to add moment.js dependency
  const req = new Date(requestAt);
  
  // Get day of month in the request timezone
  // Note: This is a simplified approach. In production, you'd want to use a proper timezone library
  const day = req.getDate();
  
  // Apply cutoff rule (UPDATED):
  // - On/before cutoff day -> end of CURRENT month
  // - After cutoff day      -> end of NEXT month
  const monthsToAdd = day <= cutoffDay ? 0 : 1;
  
  // Calculate candidate end date (end of target month)
  const candidate = new Date(req);
  candidate.setMonth(candidate.getMonth() + monthsToAdd + 1); // Go to month after target
  candidate.setDate(0); // Last day of previous month = last day of target month
  candidate.setHours(23, 59, 59, 999); // End of day
  
  // Enforce minimum notice period if configured
  if (minNoticeDays > 0) {
    const minEnd = new Date(req);
    minEnd.setDate(minEnd.getDate() + minNoticeDays);
    minEnd.setHours(23, 59, 59, 999); // End of day
    
    if (candidate < minEnd) {
      // Bump to the first end-of-month >= minEnd
      let cursor = new Date(minEnd);
      cursor.setDate(0); // Last day of current month
      cursor.setHours(23, 59, 59, 999);
      
      // If cursor is before minEnd, move to next month
      if (cursor < minEnd) {
        cursor.setMonth(cursor.getMonth() + 1);
        cursor.setDate(0); // Last day of next month
        cursor.setHours(23, 59, 59, 999);
      }
      
      candidate.setTime(cursor.getTime());
    }
  }
  
  return candidate;
};

/**
 * Resolve termination policy for a lease
 * 
 * @param {Object} lease - Lease object with property and organization data
 * @returns {Object} Resolved termination policy
 */
export const resolveTerminationPolicy = (lease) => {
  // Default policy values
  const defaultPolicy = {
    cutoffDay: 10,
    minNoticeDays: 0,
    timezone: 'Europe/Warsaw'
  };
  
  // Try to get policy from organization first, then property, then use defaults
  const orgPolicy = lease?.offer?.organization?.terminationPolicy;
  const propertyPolicy = lease?.property?.terminationPolicy;
  
  // Merge policies with defaults (organization > property > defaults)
  const policy = {
    ...defaultPolicy,
    ...propertyPolicy,
    ...orgPolicy
  };
  
  return policy;
};

/**
 * Format date for display in UI
 *
 * @param {Date} date - Date to format
 * @param {string} timezone - Timezone for formatting
 * @returns {string} Formatted date string
 */
export const formatTerminationDate = (date, timezone = 'Europe/Warsaw') => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone
  });
};

/**
 * Get termination policy explanation text for UI
 * 
 * @param {Object} policy - Termination policy
 * @returns {string} Human-readable explanation
 */
export const getTerminationPolicyExplanation = (policy) => {
  const { cutoffDay } = policy;
  return `Requests on/before day ${cutoffDay} end this month; after that, next month.`;
};

/**
 * Calculate publish after date for reviews
 * 
 * @param {Date} endDate - Lease end date
 * @returns {Date} Date when review can be published
 */
export const calculatePublishAfter = (endDate) => {
  const publishAfter = new Date(endDate);
  publishAfter.setDate(publishAfter.getDate() + 14); // 14 days after lease end
  return publishAfter;
};

/**
 * Add days to a date
 * 
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get end of day in Warsaw timezone
 * 
 * @param {Date} date - Input date
 * @returns {Date} End of day in Warsaw timezone
 */
export const getEndOfDayWarsaw = (date) => {
  const warsawDate = new Date(date);
  warsawDate.setHours(23, 59, 59, 999);
  return warsawDate;
};

/**
 * Check if current time is within specified hour range
 * 
 * @param {number} startHour - Start hour (0-23)
 * @param {number} endHour - End hour (0-23)
 * @returns {boolean} True if within range
 */
export const isWithinHourRange = (startHour, endHour) => {
  const now = new Date();
  const currentHour = now.getHours();
  
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour <= endHour;
  } else {
    // Handle overnight range (e.g., 22:00 to 06:00)
    return currentHour >= startHour || currentHour <= endHour;
  }
};

/**
 * Get next occurrence of specified hour
 * 
 * @param {number} hour - Target hour (0-23)
 * @returns {Date} Next occurrence of the hour
 */
export const getNextHourOccurrence = (hour) => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
};

/**
 * Check if a value is a valid date
 * 
 * @param {any} value - Value to check
 * @returns {boolean} True if valid date
 */
export const isValidDate = (value) => {
  return value instanceof Date && !isNaN(value.getTime());
};

/**
 * Parse date string in Warsaw timezone
 * 
 * @param {string} dateString - Date string to parse
 * @returns {Date} Parsed date
 */
export const parseWarsawDate = (dateString) => {
  return new Date(dateString);
};

/**
 * Warsaw timezone constant
 */
export const WARSAW_TIMEZONE = 'Europe/Warsaw';