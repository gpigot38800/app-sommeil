import { timeToMinutes, calculateSleepDuration } from "../planning-engine/rules";
import type { ShiftInput } from "./types";

/**
 * Estimate sleep opportunity (in minutes) for a given shift,
 * considering the next day's shift for quick-return detection.
 */
export function estimateSleepOpportunity(
  shift: ShiftInput,
  nextShift: ShiftInput | null,
  habitualDurationMinutes: number
): { sleepMinutes: number; hasQuickReturn: boolean } {
  const type = shift.shiftType;

  // Rest or absence days: full habitual sleep
  if (type === "repos" || type === "absence") {
    return { sleepMinutes: habitualDurationMinutes, hasQuickReturn: false };
  }

  // No times available: estimate based on category
  if (!shift.endTime) {
    const estimates: Record<string, number> = {
      jour: habitualDurationMinutes,
      soir: Math.min(habitualDurationMinutes, 420), // ~7h
      nuit: 330, // ~5.5h diurnal sleep
    };
    return {
      sleepMinutes: estimates[type] ?? habitualDurationMinutes,
      hasQuickReturn: false,
    };
  }

  const shiftEndMinutes = timeToMinutes(shift.endTime);
  const effectiveBreak = shift.breakMinutes ?? 0;

  // Quick return detection: < 11h between end of this shift and start of next
  let hasQuickReturn = false;
  let availableGapMinutes = 0;

  if (nextShift?.startTime && nextShift.shiftType !== "repos" && nextShift.shiftType !== "absence") {
    const nextStartMinutes = timeToMinutes(nextShift.startTime);
    // Gap in minutes (handle midnight wrap)
    let gap = nextStartMinutes - shiftEndMinutes;
    if (gap <= 0) gap += 1440;
    availableGapMinutes = gap;
    hasQuickReturn = gap < 660; // < 11h
  }

  let sleepMinutes: number;

  switch (type) {
    case "nuit": {
      // Night workers sleep during daytime, typically 5-6h
      sleepMinutes = 330; // 5.5h base
      // If break > 0, slightly more sleep opportunity
      if (effectiveBreak >= 30) sleepMinutes += 15;
      break;
    }
    case "soir": {
      // Evening shift: sleep after shift end, but late
      // Typically can sleep 6-7h before next day
      if (availableGapMinutes > 0 && hasQuickReturn) {
        // Quick return: sleep limited by gap - 1.5h (commute + wind down)
        sleepMinutes = Math.max(240, availableGapMinutes - 90);
      } else {
        sleepMinutes = Math.min(habitualDurationMinutes, 420);
      }
      break;
    }
    case "jour":
    default: {
      // Day shift: sleep normally the night before
      if (availableGapMinutes > 0 && hasQuickReturn) {
        sleepMinutes = Math.max(300, availableGapMinutes - 90);
      } else {
        sleepMinutes = habitualDurationMinutes;
      }
      break;
    }
  }

  // Cap at habitual duration
  sleepMinutes = Math.min(sleepMinutes, habitualDurationMinutes);

  return { sleepMinutes, hasQuickReturn };
}

/**
 * Count maximum consecutive night shifts in a series of shifts.
 */
export function countConsecutiveNights(shifts: ShiftInput[]): number {
  let maxConsecutive = 0;
  let current = 0;

  for (const shift of shifts) {
    if (shift.shiftType === "nuit") {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }

  return maxConsecutive;
}

/**
 * Calculate habitual sleep duration in minutes from sleep/wake times.
 */
export function getHabitualDuration(sleepTime: string, wakeTime: string): number {
  const sleepMin = timeToMinutes(sleepTime);
  const wakeMin = timeToMinutes(wakeTime);
  return calculateSleepDuration(sleepMin, wakeMin);
}
