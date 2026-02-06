export type ShiftType = "jour" | "soir" | "nuit";

export interface PlanningInput {
  habitualSleepTime: string; // HH:MM
  habitualWakeTime: string; // HH:MM
  fromShift: {
    type: ShiftType;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
  toShift: {
    type: ShiftType;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
  availableDays: number; // 2-6
}

export interface GeneratedPlanDay {
  dayNumber: number;
  targetSleepTime: string; // HH:MM
  targetWakeTime: string; // HH:MM
  caffeineCutoff: string; // HH:MM
  lightStart: string; // HH:MM
  lightEnd: string; // HH:MM
  deficitMinutes: number;
  notes: string;
}

export interface PlanResult {
  days: GeneratedPlanDay[];
  totalDeficitMinutes: number;
  actualDaysCount: number;
}
