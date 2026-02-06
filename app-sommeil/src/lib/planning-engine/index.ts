import type { PlanningInput, PlanResult, GeneratedPlanDay } from "./types";
import {
  timeToMinutes,
  minutesToTime,
  circularDifference,
  calculateCaffeineCutoff,
  calculateLightWindow,
  calculateSleepDuration,
  calculateDeficit,
  getReferenceSleepTime,
} from "./rules";

const MAX_SHIFT_PER_DAY = 90; // 1.5h in minutes
const MIN_DAYS = 2;
const MAX_DAYS = 6;

export function generateTransitionPlan(input: PlanningInput): PlanResult {
  const { habitualSleepTime, habitualWakeTime, fromShift, toShift, availableDays } = input;

  // Validate days
  if (availableDays < MIN_DAYS) {
    throw new Error(`Minimum ${MIN_DAYS} jours requis pour une transition`);
  }

  const clampedDays = Math.min(availableDays, MAX_DAYS);

  // Calculate habitual sleep duration
  const habitualSleepMinutes = timeToMinutes(habitualSleepTime);
  const habitualWakeMinutes = timeToMinutes(habitualWakeTime);
  const habitualDuration = calculateSleepDuration(habitualSleepMinutes, habitualWakeMinutes);

  // Determine start and target sleep times based on shift types
  const startSleepMinutes = getReferenceSleepTime(fromShift.type);
  const targetSleepMinutes = getReferenceSleepTime(toShift.type);

  // Calculate total gap (shortest circular path)
  const totalGap = circularDifference(startSleepMinutes, targetSleepMinutes);
  const absGap = Math.abs(totalGap);

  // Calculate minimum days needed
  const daysNeeded = absGap > 0 ? Math.ceil(absGap / MAX_SHIFT_PER_DAY) : clampedDays;
  const actualDays = Math.min(Math.max(daysNeeded, clampedDays), MAX_DAYS);

  // Calculate increment per day
  const incrementPerDay = actualDays > 0 ? totalGap / actualDays : 0;

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

    // Calculate deficit
    const deficit = calculateDeficit(habitualDuration, currentSleepMinutes, currentWakeMinutes);
    totalDeficit += deficit;

    // Caffeine cutoff
    const caffeineCutoff = calculateCaffeineCutoff(currentSleepMinutes);

    // Light window based on target shift type
    const { lightStart, lightEnd } = calculateLightWindow(
      toShift.type,
      currentSleepMinutes,
      currentWakeMinutes
    );

    // Generate contextual notes
    const notes = generateNotes(i, actualDays, deficit, toShift.type);

    days.push({
      dayNumber: i,
      targetSleepTime: minutesToTime(currentSleepMinutes),
      targetWakeTime: minutesToTime(currentWakeMinutes),
      caffeineCutoff,
      lightStart,
      lightEnd,
      deficitMinutes: deficit,
      notes,
    });
  }

  return {
    days,
    totalDeficitMinutes: totalDeficit,
    actualDaysCount: actualDays,
  };
}

function generateNotes(
  dayNumber: number,
  totalDays: number,
  deficitMinutes: number,
  targetShiftType: string
): string {
  const parts: string[] = [];

  if (dayNumber === 1) {
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

  if (targetShiftType === "nuit" && dayNumber <= 2) {
    parts.push(
      "Reduisez votre exposition a la lumiere vive 2h avant le coucher."
    );
  }

  if (targetShiftType === "jour" && dayNumber <= 2) {
    parts.push(
      "Exposez-vous a la lumiere naturelle des le reveil pour avancer votre horloge interne."
    );
  }

  return parts.join(" ");
}
