import { timeToMinutes } from "../planning-engine/rules";
import type { ShiftInput } from "../fatigue-engine/types";
import type { ComplianceViolation } from "./types";

/**
 * Regle 1 : Repos minimum entre 2 shifts (Art. L3131-1)
 * - violation si < 11h (660 min)
 * - critical si < 9h (540 min)
 */
export function checkQuickReturn(
  shifts: ShiftInput[],
  minRestMinutes: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const workShifts = shifts
    .filter((s) => s.shiftType !== "repos" && s.shiftType !== "absence" && s.endTime && s.startTime)
    .sort((a, b) => a.date.localeCompare(b.date));

  for (let i = 0; i < workShifts.length - 1; i++) {
    const current = workShifts[i];
    const next = workShifts[i + 1];
    if (!current.endTime || !next.startTime) continue;

    const endMin = timeToMinutes(current.endTime);
    const nextStartMin = timeToMinutes(next.startTime);

    // Calculer le gap en tenant compte du changement de jour
    const daysDiff = dateDiffDays(current.date, next.date);
    const gapMinutes = daysDiff * 1440 + nextStartMin - endMin;

    if (gapMinutes < minRestMinutes) {
      const gapHours = Math.round((gapMinutes / 60) * 10) / 10;
      const severity = gapMinutes < 540 ? "critical" : "violation";
      violations.push({
        type: "quick_return",
        severity,
        date: next.date,
        message: `Repos de ${gapHours}h entre 2 shifts (minimum ${Math.round(minRestMinutes / 60)}h requis - Art. L3131-1)`,
        details: { gapMinutes, requiredMinutes: minRestMinutes },
      });
    }
  }

  return violations;
}

/**
 * Regle 2 : Duree maximum journaliere
 * - violation si > seuil (10h standard ou 12h derogation hopital)
 */
export function checkDailyHours(
  shifts: ShiftInput[],
  maxMinutes: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  for (const shift of shifts) {
    if (shift.shiftType === "repos" || shift.shiftType === "absence") continue;
    if (!shift.startTime || !shift.endTime) continue;

    const startMin = timeToMinutes(shift.startTime);
    const endMin = timeToMinutes(shift.endTime);
    let durationMinutes = endMin - startMin;
    if (durationMinutes <= 0) durationMinutes += 1440; // passage minuit
    durationMinutes -= shift.breakMinutes || 0;

    if (durationMinutes > maxMinutes) {
      const durationHours = Math.round((durationMinutes / 60) * 10) / 10;
      const maxHours = Math.round(maxMinutes / 60);
      violations.push({
        type: "daily_hours",
        severity: "violation",
        date: shift.date,
        message: `Duree journaliere de ${durationHours}h (maximum ${maxHours}h autorisees)`,
        details: { durationMinutes, maxMinutes },
      });
    }
  }

  return violations;
}

/**
 * Regle 3 : Duree maximum hebdomadaire (Art. L3121-20)
 * - violation si > 48h (2880 min)
 * - critical si > 54h (3240 min)
 */
export function checkWeeklyHours(
  shifts: ShiftInput[],
  maxMinutes: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  // Grouper par semaine ISO (lundi-dimanche)
  const weeklyMinutes = new Map<string, { total: number; firstDate: string }>();

  for (const shift of shifts) {
    if (shift.shiftType === "repos" || shift.shiftType === "absence") continue;
    if (!shift.startTime || !shift.endTime) continue;

    const weekKey = getISOWeekKey(shift.date);
    const startMin = timeToMinutes(shift.startTime);
    const endMin = timeToMinutes(shift.endTime);
    let duration = endMin - startMin;
    if (duration <= 0) duration += 1440;
    duration -= shift.breakMinutes || 0;

    const existing = weeklyMinutes.get(weekKey) || { total: 0, firstDate: shift.date };
    existing.total += duration;
    if (shift.date < existing.firstDate) existing.firstDate = shift.date;
    weeklyMinutes.set(weekKey, existing);
  }

  for (const [, data] of weeklyMinutes) {
    if (data.total > maxMinutes) {
      const totalHours = Math.round((data.total / 60) * 10) / 10;
      const severity = data.total > 3240 ? "critical" : "violation"; // > 54h = critical
      violations.push({
        type: "weekly_hours",
        severity,
        date: data.firstDate,
        message: `Semaine de ${totalHours}h (maximum ${Math.round(maxMinutes / 60)}h - Art. L3121-20)`,
        details: { weeklyMinutes: data.total, maxMinutes },
      });
    }
  }

  return violations;
}

/**
 * Regle 4 : Nuits consecutives maximum (3 max)
 * - violation si 4 nuits consecutives
 * - critical si 5+ nuits consecutives
 */
export function checkConsecutiveNights(
  shifts: ShiftInput[],
  maxNights: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const sorted = [...shifts].sort((a, b) => a.date.localeCompare(b.date));

  let consecutiveCount = 0;
  let streakStartDate = "";

  for (let i = 0; i < sorted.length; i++) {
    const shift = sorted[i];
    const isNight = shift.shiftType === "nuit";
    const isConsecutive = i > 0 && dateDiffDays(sorted[i - 1].date, shift.date) === 1;

    if (isNight && (consecutiveCount === 0 || isConsecutive)) {
      if (consecutiveCount === 0) streakStartDate = shift.date;
      consecutiveCount++;
    } else {
      if (consecutiveCount > maxNights) {
        emitConsecutiveNightViolation(violations, consecutiveCount, maxNights, streakStartDate);
      }
      consecutiveCount = isNight ? 1 : 0;
      streakStartDate = shift.date;
    }
  }

  // Verifier la derniere serie
  if (consecutiveCount > maxNights) {
    emitConsecutiveNightViolation(violations, consecutiveCount, maxNights, streakStartDate);
  }

  return violations;
}

function emitConsecutiveNightViolation(
  violations: ComplianceViolation[],
  count: number,
  maxNights: number,
  date: string
) {
  violations.push({
    type: "consecutive_nights",
    severity: count >= maxNights + 2 ? "critical" : "violation", // 5+ = critical
    date,
    message: `${count} nuits consecutives (maximum ${maxNights} recommandees)`,
    details: { consecutiveNights: count, maxNights },
  });
}

/**
 * Regle 5 : Repos hebdomadaire minimum (35h consecutives)
 * On verifie pour chaque semaine le plus long repos consecutif.
 */
export function checkWeeklyRest(
  shifts: ShiftInput[],
  minRestMinutes: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const sorted = [...shifts]
    .filter((s) => s.startTime && s.endTime)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) return violations;

  // Grouper les shifts par semaine ISO
  const weekShifts = new Map<string, ShiftInput[]>();
  for (const shift of sorted) {
    const weekKey = getISOWeekKey(shift.date);
    if (!weekShifts.has(weekKey)) weekShifts.set(weekKey, []);
    weekShifts.get(weekKey)!.push(shift);
  }

  for (const [, weekData] of weekShifts) {
    const workShifts = weekData
      .filter((s) => s.shiftType !== "repos" && s.shiftType !== "absence" && s.startTime && s.endTime)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (workShifts.length < 2) continue;

    let maxRestGap = 0;

    for (let i = 0; i < workShifts.length - 1; i++) {
      const current = workShifts[i];
      const next = workShifts[i + 1];
      if (!current.endTime || !next.startTime) continue;

      const endMin = timeToMinutes(current.endTime);
      const nextStartMin = timeToMinutes(next.startTime);
      const daysDiff = dateDiffDays(current.date, next.date);
      const gap = daysDiff * 1440 + nextStartMin - endMin;
      maxRestGap = Math.max(maxRestGap, gap);
    }

    if (maxRestGap > 0 && maxRestGap < minRestMinutes) {
      const gapHours = Math.round((maxRestGap / 60) * 10) / 10;
      const requiredHours = Math.round(minRestMinutes / 60);
      violations.push({
        type: "weekly_rest",
        severity: "violation",
        date: workShifts[0].date,
        message: `Repos hebdomadaire de ${gapHours}h (minimum ${requiredHours}h consecutives requises)`,
        details: { maxRestMinutes: maxRestGap, requiredMinutes: minRestMinutes },
      });
    }
  }

  return violations;
}

/**
 * Regle 6 : Jours consecutifs travailles (Art. L3132-1)
 * - violation si 7+ jours consecutifs
 */
export function checkConsecutiveDays(
  shifts: ShiftInput[],
  maxDays: number
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];

  // Extraire les dates de travail uniques
  const workDates = new Set<string>();
  for (const shift of shifts) {
    if (shift.shiftType !== "repos" && shift.shiftType !== "absence") {
      workDates.add(shift.date);
    }
  }

  const sortedDates = [...workDates].sort();
  if (sortedDates.length === 0) return violations;

  let consecutiveCount = 1;
  let streakStartDate = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = dateDiffDays(sortedDates[i - 1], sortedDates[i]);
    if (diff === 1) {
      consecutiveCount++;
    } else {
      if (consecutiveCount > maxDays) {
        violations.push({
          type: "consecutive_days",
          severity: "violation",
          date: streakStartDate,
          message: `${consecutiveCount} jours travailles consecutifs (maximum ${maxDays} - Art. L3132-1)`,
          details: { consecutiveDays: consecutiveCount, maxDays },
        });
      }
      consecutiveCount = 1;
      streakStartDate = sortedDates[i];
    }
  }

  // Verifier la derniere serie
  if (consecutiveCount > maxDays) {
    violations.push({
      type: "consecutive_days",
      severity: "violation",
      date: streakStartDate,
      message: `${consecutiveCount} jours travailles consecutifs (maximum ${maxDays} - Art. L3132-1)`,
      details: { consecutiveDays: consecutiveCount, maxDays },
    });
  }

  return violations;
}

// ─── Utilitaires ──────────────────────────────────────────────────────

/** Difference en jours entre deux dates YYYY-MM-DD */
function dateDiffDays(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** Retourne la cle de semaine ISO (ex: "2026-W06") */
function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  // Trouver le jeudi de la semaine (ISO 8601)
  const day = d.getDay() || 7; // dimanche = 7
  d.setDate(d.getDate() + 4 - day);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
