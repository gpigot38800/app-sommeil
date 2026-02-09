// ─── Risk levels ──────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export const RISK_THRESHOLDS = {
  low: 120, // < 2h deficit
  medium: 240, // 2-4h deficit
  high: 480, // 4-8h deficit
  // > 480 = critical
} as const;

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "green",
  medium: "orange",
  high: "red",
  critical: "red",
};

// ─── Shift categories ─────────────────────────────────────────────────

export type ShiftCategory = "jour" | "soir" | "nuit" | "repos" | "absence";

export type EmploymentType = "temps_plein" | "temps_partiel" | "interimaire";

// ─── Organization ─────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Admin profile ────────────────────────────────────────────────────

export interface AdminProfile {
  id: string;
  organizationId: string;
  displayName: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

// ─── Employee ─────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  organizationId: string;
  matricule: string | null;
  firstName: string;
  lastName: string;
  department: string | null;
  position: string | null;
  employmentType: string | null;
  contractHoursPerWeek: string | null;
  habitualSleepTime: string | null;
  habitualWakeTime: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Shift code ───────────────────────────────────────────────────────

export interface ShiftCode {
  id: string;
  organizationId: string;
  code: string;
  label: string | null;
  shiftCategory: ShiftCategory;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  defaultDurationMinutes: number | null;
  includesBreakMinutes: number | null;
  isWorkShift: boolean;
}

// ─── Fatigue score ────────────────────────────────────────────────────

export interface FatigueScore {
  id: string;
  employeeId: string;
  organizationId: string;
  calculatedAt: string;
  periodStart: string;
  periodEnd: string;
  windowDays: number;
  cumulativeDeficitMinutes: number;
  recoveryScore: number;
  riskLevel: RiskLevel;
  shiftCount: number;
  nightShiftCount: number;
}

// ─── Default shift codes (pre-remplis a la creation d'une org) ───────

export const DEFAULT_SHIFT_CODES: Omit<ShiftCode, "id" | "organizationId">[] = [
  { code: "M", label: "Matin", shiftCategory: "jour", defaultStartTime: "07:00", defaultEndTime: "14:30", defaultDurationMinutes: 450, includesBreakMinutes: 30, isWorkShift: true },
  { code: "S", label: "Soir", shiftCategory: "soir", defaultStartTime: "13:30", defaultEndTime: "21:00", defaultDurationMinutes: 450, includesBreakMinutes: 30, isWorkShift: true },
  { code: "N", label: "Nuit", shiftCategory: "nuit", defaultStartTime: "21:00", defaultEndTime: "07:00", defaultDurationMinutes: 600, includesBreakMinutes: 0, isWorkShift: true },
  { code: "J", label: "Journee", shiftCategory: "jour", defaultStartTime: "07:00", defaultEndTime: "19:00", defaultDurationMinutes: 720, includesBreakMinutes: 60, isWorkShift: true },
  { code: "JL", label: "Jour Long (12h)", shiftCategory: "jour", defaultStartTime: "07:00", defaultEndTime: "19:00", defaultDurationMinutes: 720, includesBreakMinutes: 60, isWorkShift: true },
  { code: "NL", label: "Nuit Longue (12h)", shiftCategory: "nuit", defaultStartTime: "19:00", defaultEndTime: "07:00", defaultDurationMinutes: 720, includesBreakMinutes: 30, isWorkShift: true },
  { code: "AM", label: "Apres-midi", shiftCategory: "soir", defaultStartTime: "12:00", defaultEndTime: "20:00", defaultDurationMinutes: 480, includesBreakMinutes: 30, isWorkShift: true },
  { code: "R", label: "Repos", shiftCategory: "repos", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "RH", label: "Repos Hebdomadaire", shiftCategory: "repos", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "RC", label: "Repos Compensateur", shiftCategory: "repos", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "CA", label: "Conge Annuel", shiftCategory: "absence", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "RTT", label: "RTT", shiftCategory: "absence", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "JF", label: "Jour Ferie", shiftCategory: "absence", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "MAL", label: "Maladie", shiftCategory: "absence", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "FM", label: "Formation", shiftCategory: "absence", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: false },
  { code: "AST", label: "Astreinte", shiftCategory: "nuit", defaultStartTime: null, defaultEndTime: null, defaultDurationMinutes: null, includesBreakMinutes: 0, isWorkShift: true },
];
