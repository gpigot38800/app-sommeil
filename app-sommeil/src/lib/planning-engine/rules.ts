import type { ShiftType } from "./types";

/** Convert "HH:MM" to minutes since midnight (0-1439) */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight to "HH:MM" (handles wrap-around) */
export function minutesToTime(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calculate the shortest circular distance between two times.
 * Positive = forward (later), handles wrap-around midnight.
 * Returns value in range (-720, 720] representing the shortest path.
 */
export function circularDifference(fromMinutes: number, toMinutes: number): number {
  let diff = ((toMinutes - fromMinutes) % 1440 + 1440) % 1440;
  if (diff > 720) diff -= 1440;
  return diff;
}

/**
 * Calculate caffeine cutoff based on shift type:
 * - jour: 8h before target sleep (480 min)
 * - soir/nuit: 6h before target sleep (360 min)
 */
export function calculateCaffeineCutoff(
  targetSleepMinutes: number,
  shiftType: ShiftType | null
): string {
  // jour or repos (null) = 8h, soir/nuit = 6h
  const hoursBeforeSleep = (shiftType === "jour" || shiftType === null) ? 480 : 360;
  return minutesToTime(targetSleepMinutes - hoursBeforeSleep);
}

/**
 * Calculate 2h dimmed light window before bedtime.
 * - jour/soir/repos (null): 2h before target sleep time (dimmed light to prepare for sleep)
 * - nuit: no light window (return null) since user sleeps during daytime
 */
export function calculateLightWindow(
  dayShiftType: ShiftType | null,
  targetSleepMinutes: number
): { lightStart: string | null; lightEnd: string | null } {
  if (dayShiftType === "nuit") {
    return { lightStart: null, lightEnd: null };
  }

  // For jour, soir, and repos (null): 2h dimmed light before bedtime
  const startMinutes = targetSleepMinutes - 120;
  return {
    lightStart: minutesToTime(startMinutes),
    lightEnd: minutesToTime(targetSleepMinutes),
  };
}

/** Calculate sleep duration in minutes from habitual times */
export function calculateSleepDuration(
  sleepMinutes: number,
  wakeMinutes: number
): number {
  let duration = wakeMinutes - sleepMinutes;
  if (duration <= 0) duration += 1440;
  return duration;
}

/**
 * Calculate sleep deficit for a day.
 * Deficit = max(0, habitual duration - available sleep time)
 */
export function calculateDeficit(
  habitualDurationMinutes: number,
  targetSleepMinutes: number,
  targetWakeMinutes: number
): number {
  const availableDuration = calculateSleepDuration(targetSleepMinutes, targetWakeMinutes);
  return Math.max(0, habitualDurationMinutes - availableDuration);
}

/** Calculate the number of calendar days between two dates */
export function differenceInCalendarDays(
  dateA: string,
  dateB: string
): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = a.getTime() - b.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
