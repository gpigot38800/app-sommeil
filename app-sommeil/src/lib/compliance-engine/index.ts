import type { ShiftInput } from "../fatigue-engine/types";
import type { ComplianceResult, ComplianceThresholds } from "./types";
import { DEFAULT_THRESHOLDS } from "./types";
import {
  checkQuickReturn,
  checkDailyHours,
  checkWeeklyHours,
  checkConsecutiveNights,
  checkWeeklyRest,
  checkConsecutiveDays,
} from "./rules";

/**
 * Verifie la conformite d'un employe au Code du Travail.
 * Appelle les 6 regles et retourne toutes les violations detectees.
 */
export function checkEmployeeCompliance(
  employeeId: string,
  shifts: ShiftInput[],
  thresholds?: Partial<ComplianceThresholds>
): ComplianceResult {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };

  const violations = [
    ...checkQuickReturn(shifts, t.minRestBetweenShifts),
    ...checkDailyHours(shifts, t.maxDailyMinutes),
    ...checkWeeklyHours(shifts, t.maxWeeklyMinutes),
    ...checkConsecutiveNights(shifts, t.maxConsecutiveNights),
    ...checkWeeklyRest(shifts, t.minWeeklyRestMinutes),
    ...checkConsecutiveDays(shifts, t.maxConsecutiveDays),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    employeeId,
    violations,
    isCompliant: violations.length === 0,
  };
}
