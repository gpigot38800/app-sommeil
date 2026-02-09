import type { ShiftInput, FatigueResult, DailyEstimate, EmployeeSleepProfile } from "./types";
import type { RiskLevel } from "@/types";
import { RISK_THRESHOLDS } from "@/types";
import {
  estimateSleepOpportunity,
  countConsecutiveNights,
  getHabitualDuration,
} from "./estimators";

/**
 * Calculate fatigue for one employee over a window of shifts.
 *
 * Algorithm:
 * 1. Estimate daily sleep opportunity per shift type
 * 2. Calculate deficit = max(0, habitual - estimated)
 * 3. Recovery: rest days reduce cumulative deficit by ~50%
 * 4. Aggravating factors: consecutive nights (3+ = x1.5), quick returns
 * 5. Determine risk level from cumulative deficit
 */
export function calculateEmployeeFatigue(
  shifts: ShiftInput[],
  profile: EmployeeSleepProfile,
  windowDays: number
): FatigueResult {
  const habitualDuration = getHabitualDuration(
    profile.habitualSleepTime,
    profile.habitualWakeTime
  );

  // Sort shifts by date
  const sorted = [...shifts].sort((a, b) => a.date.localeCompare(b.date));

  const dailyEstimates: DailyEstimate[] = [];
  let cumulativeDeficit = 0;
  let shiftCount = 0;
  let nightShiftCount = 0;
  let quickReturnCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const shift = sorted[i];
    const nextShift = i + 1 < sorted.length ? sorted[i + 1] : null;
    const isRestDay = shift.shiftType === "repos" || shift.shiftType === "absence";
    const isNight = shift.shiftType === "nuit";

    if (!isRestDay) shiftCount++;
    if (isNight) nightShiftCount++;

    const { sleepMinutes, hasQuickReturn } = estimateSleepOpportunity(
      shift,
      nextShift,
      habitualDuration
    );

    if (hasQuickReturn) quickReturnCount++;

    const deficit = Math.max(0, habitualDuration - sleepMinutes);

    if (isRestDay) {
      // Recovery: rest day reduces accumulated deficit by 50%
      cumulativeDeficit = Math.max(0, cumulativeDeficit * 0.5);
    } else {
      cumulativeDeficit += deficit;
    }

    dailyEstimates.push({
      date: shift.date,
      shiftType: shift.shiftType,
      estimatedSleepMinutes: sleepMinutes,
      deficitMinutes: deficit,
      isRestDay,
      isNightShift: isNight,
      hasQuickReturn,
    });
  }

  // Aggravating factors
  const consecutiveNights = countConsecutiveNights(sorted);

  // 3+ consecutive nights: multiply deficit by 1.5
  if (consecutiveNights >= 3) {
    cumulativeDeficit = Math.round(cumulativeDeficit * 1.5);
  }

  // Quick returns add extra deficit
  cumulativeDeficit += quickReturnCount * 30; // 30 min penalty per quick return

  // Clamp to non-negative integer
  cumulativeDeficit = Math.max(0, Math.round(cumulativeDeficit));

  // Recovery score: 100 = no deficit, 0 = catastrophic
  const maxExpectedDeficit = habitualDuration * windowDays * 0.5; // 50% would be extreme
  const recoveryScore = Math.max(
    0,
    Math.min(100, Math.round(100 * (1 - cumulativeDeficit / maxExpectedDeficit)))
  );

  // Risk level
  const riskLevel = determineRiskLevel(cumulativeDeficit, consecutiveNights);

  // Period bounds
  const periodStart = sorted.length > 0 ? sorted[0].date : "";
  const periodEnd = sorted.length > 0 ? sorted[sorted.length - 1].date : "";

  return {
    periodStart,
    periodEnd,
    windowDays,
    dailyEstimates,
    cumulativeDeficitMinutes: cumulativeDeficit,
    recoveryScore,
    riskLevel,
    shiftCount,
    nightShiftCount,
    consecutiveNights,
    quickReturnCount,
  };
}

function determineRiskLevel(
  cumulativeDeficitMinutes: number,
  consecutiveNights: number
): RiskLevel {
  // Critical: > 8h deficit OR 3+ consecutive nights without adequate rest
  if (cumulativeDeficitMinutes > RISK_THRESHOLDS.high || consecutiveNights >= 5) {
    return "critical";
  }
  if (cumulativeDeficitMinutes > RISK_THRESHOLDS.medium) {
    return "high";
  }
  if (cumulativeDeficitMinutes > RISK_THRESHOLDS.low) {
    return "medium";
  }
  return "low";
}
