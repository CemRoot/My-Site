/**
 * Timezone-aware availability for the site header badge.
 *
 * Timezone: Europe/Dublin — PERSONAL_INFO.location is Dublin, Ireland
 * (phone +353). Annual holiday Aug 25–Sep 13 inclusive; otherwise
 * available 09:00–21:00 local, offline overnight.
 *
 * To change the holiday window later, edit HOLIDAY_WINDOW below
 * (month is 1-indexed: 8 = August, 9 = September).
 */

export type AvailabilityStatus = 'available' | 'offline' | 'holiday';

/** Site owner local timezone (Dublin). */
export const AVAILABILITY_TIMEZONE = 'Europe/Dublin';

/** Inclusive daily window: available from 09:00 until 21:00 (exclusive). */
export const AVAILABLE_FROM_HOUR = 9;
export const AVAILABLE_UNTIL_HOUR = 21;

/** Recurring annual holiday — inclusive on both ends. */
export const HOLIDAY_WINDOW = {
  startMonth: 8,
  startDay: 25,
  endMonth: 9,
  endDay: 13,
} as const;

const dublinPartsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: AVAILABILITY_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  hourCycle: 'h23',
});

function getDublinParts(date: Date): { month: number; day: number; hour: number } {
  const parts = dublinPartsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? NaN);

  return {
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
  };
}

/** True when month/day falls in the annual Aug 25–Sep 13 window (inclusive). */
export function isInHolidayWindow(month: number, day: number): boolean {
  const { startMonth, startDay, endMonth, endDay } = HOLIDAY_WINDOW;
  const afterStart = month > startMonth || (month === startMonth && day >= startDay);
  const beforeEnd = month < endMonth || (month === endMonth && day <= endDay);
  return afterStart && beforeEnd;
}

export function getAvailabilityStatus(now: Date = new Date()): AvailabilityStatus {
  const { month, day, hour } = getDublinParts(now);

  if (isInHolidayWindow(month, day)) return 'holiday';

  if (hour >= AVAILABLE_FROM_HOUR && hour < AVAILABLE_UNTIL_HOUR) {
    return 'available';
  }

  return 'offline';
}
