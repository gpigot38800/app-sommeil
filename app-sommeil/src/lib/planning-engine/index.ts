import type { PlanningInput, PlanResult, GeneratedPlanDay, ShiftType } from "./types";
import {
  timeToMinutes,
  minutesToTime,
  circularDifference,
  calculateCaffeineCutoff,
  calculateLightWindow,
  calculateSleepDuration,
  calculateDeficit,
  differenceInCalendarDays,
} from "./rules";

const MIN_DAYS = 2;
const MAX_DAYS = 6;

export function generateTransitionPlan(input: PlanningInput): PlanResult {
  const { habitualSleepTime, habitualWakeTime, fromShift, toShift } = input;

  // Calculate habitual sleep duration
  const habitualSleepMinutes = timeToMinutes(habitualSleepTime);
  const habitualWakeMinutes = timeToMinutes(habitualWakeTime);
  const habitualDuration = calculateSleepDuration(habitualSleepMinutes, habitualWakeMinutes);

  // Calculate number of days from shift dates
  const daysBetween = differenceInCalendarDays(toShift.startDate, fromShift.endDate);
  const actualDays = Math.min(Math.max(daysBetween, MIN_DAYS), MAX_DAYS);

  // Start = user's habitual sleep time (from profile)
  const startSleepMinutes = habitualSleepMinutes;

  // Target = toShift.startTime - habitualDuration (sleep enough before the shift)
  const toShiftStartMinutes = timeToMinutes(toShift.startTime);
  const targetSleepMinutes = ((toShiftStartMinutes - habitualDuration) % 1440 + 1440) % 1440;

  // Calculate total gap (shortest circular path)
  const totalGap = circularDifference(startSleepMinutes, targetSleepMinutes);

  // Calculate increment per day
  const incrementPerDay = actualDays > 0 ? totalGap / actualDays : 0;

  // Plan start date = day after fromShift ends
  const planStartDate = new Date(fromShift.endDate);
  planStartDate.setDate(planStartDate.getDate() + 1);

  const days: GeneratedPlanDay[] = [];
  let totalDeficit = 0;

  for (let i = 1; i <= actualDays; i++) {
    let currentSleepMinutes: number;

    if (i === actualDays) {
      // Last day: land exactly on target
      currentSleepMinutes = targetSleepMinutes;
    } else {
      currentSleepMinutes = startSleepMinutes + Math.round(incrementPerDay * i);
    }

    // Wrap around
    currentSleepMinutes = ((currentSleepMinutes % 1440) + 1440) % 1440;

    // Calculate wake time preserving habitual duration
    const currentWakeMinutes = (currentSleepMinutes + habitualDuration) % 1440;

    // Determine which shift this day falls on
    const dayDate = new Date(planStartDate);
    dayDate.setDate(dayDate.getDate() + (i - 1));
    const dayDateStr = dayDate.toISOString().split("T")[0];

    const { dayShiftType, workStartTime, workEndTime } = getDayShiftContext(
      dayDateStr,
      fromShift,
      toShift
    );

    // Calculate deficit
    const deficit = calculateDeficit(habitualDuration, currentSleepMinutes, currentWakeMinutes);
    totalDeficit += deficit;

    // Caffeine cutoff (uses day's shift type for differentiation)
    const caffeineCutoff = calculateCaffeineCutoff(currentSleepMinutes, dayShiftType);

    // Light window based on day's shift type
    const { lightStart, lightEnd } = calculateLightWindow(dayShiftType, currentSleepMinutes);

    // Generate contextual notes
    const notes = generateNotes(i, actualDays, deficit, fromShift.type, toShift.type);

    days.push({
      dayNumber: i,
      targetSleepTime: minutesToTime(currentSleepMinutes),
      targetWakeTime: minutesToTime(currentWakeMinutes),
      caffeineCutoff,
      lightStart,
      lightEnd,
      deficitMinutes: deficit,
      notes,
      shiftType: dayShiftType,
      workStartTime,
      workEndTime,
    });
  }

  return {
    days,
    totalDeficitMinutes: totalDeficit,
    actualDaysCount: actualDays,
  };
}

/**
 * Determine which shift a given day falls on.
 * - If the day is within fromShift date range → fromShift
 * - If the day is within toShift date range → toShift
 * - Otherwise → repos (null)
 */
function getDayShiftContext(
  dayDateStr: string,
  fromShift: PlanningInput["fromShift"],
  toShift: PlanningInput["toShift"]
): {
  dayShiftType: ShiftType | null;
  workStartTime: string | null;
  workEndTime: string | null;
} {
  if (dayDateStr >= fromShift.startDate && dayDateStr <= fromShift.endDate) {
    return {
      dayShiftType: fromShift.type,
      workStartTime: fromShift.startTime,
      workEndTime: fromShift.endTime,
    };
  }

  if (dayDateStr >= toShift.startDate && dayDateStr <= toShift.endDate) {
    return {
      dayShiftType: toShift.type,
      workStartTime: toShift.startTime,
      workEndTime: toShift.endTime,
    };
  }

  return {
    dayShiftType: null,
    workStartTime: null,
    workEndTime: null,
  };
}

function generateNotes(
  dayNumber: number,
  totalDays: number,
  deficitMinutes: number,
  fromShiftType: ShiftType,
  toShiftType: ShiftType
): string {
  const parts: string[] = [];

  // Intro note: only for nuit→jour or nuit→soir transitions with deficit
  if (
    dayNumber === 1 &&
    fromShiftType === "nuit" &&
    (toShiftType === "jour" || toShiftType === "soir") &&
    deficitMinutes > 0
  ) {
    parts.push(
      "Debut de la transition. Decalez progressivement votre heure de coucher. " +
      "Evitez les ecrans 1h avant le coucher."
    );
  }

  if (dayNumber === totalDays) {
    parts.push(
      "Dernier jour de transition. Vous devriez etre adapte au nouveau rythme. " +
      "Maintenez ces horaires pour consolider l'adaptation."
    );
  }

  if (deficitMinutes > 60) {
    parts.push(
      `Deficit de sommeil prevu (${Math.round(deficitMinutes / 60 * 10) / 10}h). ` +
      "Si possible, faites une sieste courte de 20 min en debut d'apres-midi."
    );
  }

  return parts.join(" ");
}
