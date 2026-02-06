export type ShiftType = "jour" | "soir" | "nuit";

export interface PlanningInput {
  habitualSleepTime: string; // HH:MM
  habitualWakeTime: string; // HH:MM
  fromShift: {
    type: ShiftType;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
  toShift: {
    type: ShiftType;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
}

export interface GeneratedPlanDay {
  dayNumber: number;
  targetSleepTime: string; // HH:MM
  targetWakeTime: string; // HH:MM
  caffeineCutoff: string; // HH:MM
  lightStart: string | null; // HH:MM or null for night shifts
  lightEnd: string | null; // HH:MM or null for night shifts
  deficitMinutes: number;
  notes: string;
  shiftType: ShiftType | null; // null = jour de repos
  workStartTime: string | null; // HH:MM or null
  workEndTime: string | null; // HH:MM or null
}

export interface PlanResult {
  days: GeneratedPlanDay[];
  totalDeficitMinutes: number;
  actualDaysCount: number;
}
