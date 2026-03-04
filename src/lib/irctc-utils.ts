import { addDays, subDays, differenceInSeconds, startOfDay, setHours, setMinutes, setSeconds, format, isAfter, isBefore, isSameDay } from 'date-fns';

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Converts a Date to its wall-clock representation in India Standard Time (IST).
 * IST is UTC + 5:30 (330 minutes).
 */
export function toIST(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istOffset = 330; // IST is UTC+5:30
  const istDate = new Date(utc + (60000 * istOffset));
  return istDate;
}

/**
 * Returns the current time in IST as a Date object (wall-clock shifted).
 */
export function getCurrentIST(): Date {
  return toIST(new Date());
}

export type BookingType = 'GENERAL' | 'TATKAL';
export type BookingStatus = 'FUTURE' | 'TODAY_BEFORE_OPEN' | 'TODAY_AFTER_OPEN' | 'OPEN';

export interface BookingResult {
  journeyDate: Date;
  bookingDate: Date;
  status: BookingStatus;
  daysRemaining: number;
}

/**
 * Calculates the booking date based on the rule:
 * GENERAL: 60 days before journey.
 * TATKAL: 1 day before journey.
 */
export function calculateBookingDate(journeyDate: Date, type: BookingType = 'GENERAL'): Date {
  const daysToSubtract = type === 'TATKAL' ? 1 : 60;
  return subDays(journeyDate, daysToSubtract);
}

/**
 * Determines the current status of booking for a given journey date and target opening hour.
 */
export function getBookingStatus(
  journeyDate: Date,
  now: Date = new Date(),
  type: BookingType = 'GENERAL',
  targetHour: number = 8
): BookingStatus {
  const istNow = toIST(now);
  const istJourneyDate = toIST(journeyDate);
  const bookingDate = calculateBookingDate(istJourneyDate, type);
  const todayIST = startOfDay(istNow);
  const bookingDayIST = startOfDay(bookingDate);

  if (isBefore(todayIST, bookingDayIST)) {
    return 'FUTURE';
  }

  if (isSameDay(todayIST, bookingDayIST)) {
    const openingTime = setSeconds(setMinutes(setHours(todayIST, targetHour), 0), 0);
    return isBefore(istNow, openingTime) ? 'TODAY_BEFORE_OPEN' : 'TODAY_AFTER_OPEN';
  }

  return 'OPEN';
}

/**
 * Calculates the countdown until booking opens at the specific target hour IST.
 */
export function getCountdown(
  journeyDate: Date,
  now: Date = new Date(),
  type: BookingType = 'GENERAL',
  targetHour: number = 8
) {
  const istNow = toIST(now);
  const istJourneyDate = toIST(journeyDate);
  const bookingDate = calculateBookingDate(istJourneyDate, type);
  const bookingOpeningTime = setSeconds(setMinutes(setHours(startOfDay(bookingDate), targetHour), 0), 0);

  const diffSeconds = differenceInSeconds(bookingOpeningTime, istNow);
  if (diffSeconds <= 0) return null;

  const days = Math.floor(diffSeconds / (24 * 3600));
  const hours = Math.floor((diffSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return { days, hours, minutes, seconds };
}

/**
 * Generates a Google Calendar link for a reminder 5 minutes before booking opens.
 * targetHour: 8 (General), 10 (Tatkal AC), 11 (Tatkal Non-AC)
 */
export function generateGoogleCalendarLink(
  journeyDate: Date,
  type: BookingType = 'GENERAL',
  targetHour: number = 8
): string {
  const istJourneyDate = toIST(journeyDate);
  const bookingDate = calculateBookingDate(istJourneyDate, type);
  const bookingDayStart = startOfDay(bookingDate);

  // Set reminder for 5 minutes before opening time (e.g., 7:55 AM for 8:00 AM)
  const reminderTime = setSeconds(setMinutes(setHours(bookingDayStart, targetHour - 1), 55), 0);
  const startTime = setSeconds(setMinutes(setHours(bookingDayStart, targetHour), 0), 0);

  const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");

  const classType = targetHour === 10 ? "AC Classes" : targetHour === 11 ? "Non-AC Classes" : "General";
  const details = encodeURIComponent(`Open IRCTC App immediately. ${type} booking for ${classType} starts in 5 minutes at ${targetHour}:00 AM IST.`);
  const text = encodeURIComponent(`IRCTC ${type} Booking (${classType}): ${format(istJourneyDate, 'dd MMM')}`);
  const dates = `${formatDate(reminderTime)}/${formatDate(startTime)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${dates}&ctz=${IST_TIMEZONE}`;
}
//