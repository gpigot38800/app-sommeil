import type { RiskLevel } from "@/types";

export interface ShiftInput {
  date: string; // YYYY-MM-DD
  shiftType: string; // jour | soir | nuit | repos | absence
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
  breakMinutes: number;
}

export interface DailyEstimate {
  date: string;
  shiftType: string;
  estimatedSleepMinutes: number;
  deficitMinutes: number;
  isRestDay: boolean;
  isNightShift: boolean;
  hasQuickReturn: boolean;
}

export interface FatigueResult {
  periodStart: string;
  periodEnd: string;
  windowDays: number;
  dailyEstimates: DailyEstimate[];
  cumulativeDeficitMinutes: number;
  recoveryScore: number; // 0-100
  riskLevel: RiskLevel;
  shiftCount: number;
  nightShiftCount: number;
  consecutiveNights: number;
  quickReturnCount: number;
}

export interface EmployeeSleepProfile {
  habitualSleepTime: string; // HH:MM - default "23:00"
  habitualWakeTime: string; // HH:MM - default "07:00"
  contractHoursPerWeek: number; // default 35
}
