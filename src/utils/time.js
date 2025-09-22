/**
 * Time Utility Functions
 * 
 * Centralized time manipulation and formatting functions
 */

import { DAYS } from '../constants/app';
import { getLocalizedNumber } from './numberLocalization';

/**
 * Convert 12-hour format to 24-hour format
 * @param {string} hourStr - Hour in 12-hour format
 * @param {string} minuteStr - Minute string
 * @param {string} ampm - AM or PM
 * @returns {Object} Object with hour and minute in 24-hour format
 */
export const to24h = (hourStr, minuteStr, ampm) => {
  let h = parseInt(hourStr, 10);
  let m = parseInt(minuteStr, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { hour: h, minute: m };
};

/**
 * Format time for display
 * @param {string} h12 - Hour in 12-hour format
 * @param {string} mStr - Minute string
 * @param {string} ampm - AM or PM
 * @returns {string} Formatted time string
 */
export const formatTimeLabel = (h12, mStr, ampm) => `${h12}:${mStr} ${ampm}`;

/**
 * Format time for display with localized numbers and AM/PM
 * @param {string} h12 - Hour in 12-hour format
 * @param {string} mStr - Minute string
 * @param {string} ampm - AM or PM
 * @param {Function} t - Translation function
 * @returns {string} Formatted time string with localized numbers and AM/PM
 */
export const formatLocalizedTime = (h12, mStr, ampm, t) => {
  const localizedHour = getLocalizedNumber(h12, t);
  const localizedMinute = getLocalizedNumber(mStr, t);
  const localizedAmPm = t(`time.${ampm.toLowerCase()}`);
  return `${localizedHour}:${localizedMinute} ${localizedAmPm}`;
};

/**
 * Format milliseconds to MM:SS format
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time string
 */
export const formatTime = (ms) => {
  if (!ms) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

/**
 * Format seconds to MM:SS format
 * @param {number} secs - Seconds
 * @returns {string} Formatted time string
 */
export const formatTimeFromSeconds = (secs) => {
  const minutes = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

/**
 * Get current time in 12-hour format
 * @returns {Object} Object with hour, minute, and ampm
 */
export const getCurrentTime = () => {
  const now = new Date();
  let hour = now.getHours();
  const minute = now.getMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  if (hour === 0) hour = 12;
  if (hour > 12) hour = hour - 12;
  
  return {
    hour: hour.toString(),
    minute: minute.toString().padStart(2, '0'),
    ampm
  };
};

/**
 * Get next date for a specific day and time
 * @param {string} dayName - Day name (e.g., 'Mon', 'Tue')
 * @param {number} hour24 - Hour in 24-hour format
 * @param {number} minute - Minute
 * @returns {Date} Next occurrence of the specified day and time
 */
export const nextDateForDayAtTime = (dayName, hour24, minute) => {
  const now = new Date();
  const targetDow = DAYS.indexOf(dayName);
  const todayDow = now.getDay();

  let deltaDays = (targetDow - todayDow + 7) % 7;

  const candidate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour24,
    minute,
    0,
    0
  );

  if (deltaDays === 0 && candidate <= now) {
    deltaDays = 7;
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + deltaDays,
    hour24,
    minute,
    0,
    0
  );
};
