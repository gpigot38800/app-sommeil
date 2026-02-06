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

/** Calculate caffeine cutoff: 6h before target sleep time */
export function calculateCaffeineCutoff(targetSleepMinutes: number): string {
  return minutesToTime(targetSleepMinutes - 360);
}

/**
 * Calculate 2h light exposure window based on target shift type.
 * - jour: centered around wake time (light at wake to advance circadian)
 * - soir: late morning (moderate light for intermediate cycle)
 * - nuit: 2h before sleep time (darkness to delay circadian)
 */
export function calculateLightWindow(
  targetShiftType: ShiftType,
  targetSleepMinutes: number,
  targetWakeMinutes: number
): { lightStart: string; lightEnd: string } {
  let startMinutes: number;

  switch (targetShiftType) {
    case "jour":
      // Light centered around wake time
      startMinutes = targetWakeMinutes - 60;
      break;
    case "soir":
      // Light in late morning (10:00-12:00 range)
      startMinutes = targetWakeMinutes + 60;
      break;
    case "nuit":
      // Darkness window: 2h before sleep (avoid light before bed)
      startMinutes = targetSleepMinutes - 120;
      break;
  }

  return {
    lightStart: minutesToTime(startMinutes),
    lightEnd: minutesToTime(startMinutes + 120),
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
 * Available sleep = time between target sleep and next constraint (shift start)
 */
export function calculateDeficit(
  habitualDurationMinutes: number,
  targetSleepMinutes: number,
  targetWakeMinutes: number
): number {
  const availableDuration = calculateSleepDuration(targetSleepMinutes, targetWakeMinutes);
  return Math.max(0, habitualDurationMinutes - availableDuration);
}

/** Get reference sleep time for a shift type */
export function getReferenceSleepTime(shiftType: ShiftType): number {
  switch (shiftType) {
    case "jour":
      return timeToMinutes("23:00");
    case "soir":
      return timeToMinutes("01:00");
    case "nuit":
      return timeToMinutes("08:00");
  }
}
