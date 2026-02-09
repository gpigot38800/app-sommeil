export type ViolationType =
  | "quick_return" // repos < 11h entre shifts
  | "daily_hours" // duree journaliere > 10h/12h
  | "weekly_hours" // duree hebdomadaire > 48h
  | "consecutive_nights" // > 3 nuits consecutives
  | "weekly_rest" // repos hebdomadaire < 35h
  | "consecutive_days"; // > 6 jours consecutifs

export type ViolationSeverity = "warning" | "violation" | "critical";

export interface ComplianceViolation {
  type: ViolationType;
  severity: ViolationSeverity;
  date: string; // YYYY-MM-DD
  message: string; // Message en francais
  details: Record<string, number>;
}

export interface ComplianceResult {
  employeeId: string;
  violations: ComplianceViolation[];
  isCompliant: boolean;
}

export interface ComplianceThresholds {
  minRestBetweenShifts: number; // 660 min (11h) - Art. L3131-1
  maxDailyMinutes: number; // 600 min (10h) ou 720 (12h derogation hopital)
  maxWeeklyMinutes: number; // 2880 min (48h) - Art. L3121-20
  maxConsecutiveNights: number; // 3
  minWeeklyRestMinutes: number; // 2100 min (35h)
  maxConsecutiveDays: number; // 6 - Art. L3132-1
}

export const DEFAULT_THRESHOLDS: ComplianceThresholds = {
  minRestBetweenShifts: 660,
  maxDailyMinutes: 720, // 12h derogation hopital
  maxWeeklyMinutes: 2880,
  maxConsecutiveNights: 3,
  minWeeklyRestMinutes: 2100,
  maxConsecutiveDays: 6,
};
