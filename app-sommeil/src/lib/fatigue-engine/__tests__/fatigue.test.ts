import { describe, it, expect } from "vitest";
import { calculateEmployeeFatigue } from "../index";
import type { ShiftInput, EmployeeSleepProfile } from "../types";

const defaultProfile: EmployeeSleepProfile = {
  habitualSleepTime: "23:00",
  habitualWakeTime: "07:00",
  contractHoursPerWeek: 35,
};

function makeShift(date: string, type: string, start?: string, end?: string, breakMin = 0): ShiftInput {
  return { date, shiftType: type, startTime: start ?? null, endTime: end ?? null, breakMinutes: breakMin };
}

describe("calculateEmployeeFatigue", () => {
  it("returns low risk for rest-only week", () => {
    const shifts: ShiftInput[] = [
      makeShift("2026-03-09", "repos"),
      makeShift("2026-03-10", "repos"),
      makeShift("2026-03-11", "repos"),
      makeShift("2026-03-12", "repos"),
      makeShift("2026-03-13", "repos"),
      makeShift("2026-03-14", "repos"),
      makeShift("2026-03-15", "repos"),
    ];
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 7);
    expect(result.riskLevel).toBe("low");
    expect(result.cumulativeDeficitMinutes).toBe(0);
    expect(result.shiftCount).toBe(0);
  });

  it("returns low risk for normal day shifts", () => {
    const shifts: ShiftInput[] = [
      makeShift("2026-03-09", "jour", "07:00", "14:30"),
      makeShift("2026-03-10", "jour", "07:00", "14:30"),
      makeShift("2026-03-11", "jour", "07:00", "14:30"),
      makeShift("2026-03-12", "jour", "07:00", "14:30"),
      makeShift("2026-03-13", "jour", "07:00", "14:30"),
      makeShift("2026-03-14", "repos"),
      makeShift("2026-03-15", "repos"),
    ];
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 7);
    expect(result.riskLevel).toBe("low");
    expect(result.shiftCount).toBe(5);
    expect(result.nightShiftCount).toBe(0);
  });

  it("accumulates deficit for night shifts", () => {
    const shifts: ShiftInput[] = [
      makeShift("2026-03-09", "nuit", "21:00", "07:00"),
      makeShift("2026-03-10", "nuit", "21:00", "07:00"),
      makeShift("2026-03-11", "nuit", "21:00", "07:00"),
      makeShift("2026-03-12", "nuit", "21:00", "07:00"),
      makeShift("2026-03-13", "nuit", "21:00", "07:00"),
      makeShift("2026-03-14", "repos"),
      makeShift("2026-03-15", "repos"),
    ];
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 7);
    expect(result.nightShiftCount).toBe(5);
    expect(result.cumulativeDeficitMinutes).toBeGreaterThan(0);
    expect(result.consecutiveNights).toBe(5);
  });

  it("applies 1.5x multiplier for 3+ consecutive nights", () => {
    // 3 nights then repos
    const shiftsA: ShiftInput[] = [
      makeShift("2026-03-09", "nuit", "21:00", "07:00"),
      makeShift("2026-03-10", "nuit", "21:00", "07:00"),
      makeShift("2026-03-11", "nuit", "21:00", "07:00"),
      makeShift("2026-03-12", "repos"),
    ];
    // 2 nights then repos (no multiplier)
    const shiftsB: ShiftInput[] = [
      makeShift("2026-03-09", "nuit", "21:00", "07:00"),
      makeShift("2026-03-10", "nuit", "21:00", "07:00"),
      makeShift("2026-03-11", "repos"),
      makeShift("2026-03-12", "repos"),
    ];
    const resultA = calculateEmployeeFatigue(shiftsA, defaultProfile, 4);
    const resultB = calculateEmployeeFatigue(shiftsB, defaultProfile, 4);
    // A should have higher deficit due to multiplier
    expect(resultA.cumulativeDeficitMinutes).toBeGreaterThan(resultB.cumulativeDeficitMinutes);
  });

  it("detects quick returns", () => {
    const shifts: ShiftInput[] = [
      makeShift("2026-03-09", "soir", "14:00", "22:00"),
      makeShift("2026-03-10", "jour", "06:00", "14:00"), // 8h gap = quick return
    ];
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 2);
    expect(result.quickReturnCount).toBe(1);
  });

  it("recovery on rest days reduces deficit by ~50%", () => {
    const shifts: ShiftInput[] = [
      makeShift("2026-03-09", "nuit", "21:00", "07:00"),
      makeShift("2026-03-10", "nuit", "21:00", "07:00"),
      makeShift("2026-03-11", "repos"),
    ];
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 3);
    // After 2 nights of deficit, the rest day should halve it
    // 2 nights deficit ~= 2 * 150min, rest halves to ~150
    expect(result.cumulativeDeficitMinutes).toBeLessThan(300);
    expect(result.cumulativeDeficitMinutes).toBeGreaterThan(0);
  });

  it("returns critical for extreme deficit", () => {
    // 7 consecutive night shifts, no rest
    const shifts: ShiftInput[] = Array.from({ length: 7 }, (_, i) =>
      makeShift(`2026-03-${String(9 + i).padStart(2, "0")}`, "nuit", "21:00", "07:00")
    );
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 7);
    expect(result.riskLevel).toBe("critical");
  });

  it("handles empty shifts array", () => {
    const result = calculateEmployeeFatigue([], defaultProfile, 7);
    expect(result.riskLevel).toBe("low");
    expect(result.cumulativeDeficitMinutes).toBe(0);
    expect(result.shiftCount).toBe(0);
  });

  it("recoveryScore is between 0 and 100", () => {
    const shifts: ShiftInput[] = [
      makeShift("2026-03-09", "nuit", "21:00", "07:00"),
      makeShift("2026-03-10", "jour", "07:00", "14:30"),
    ];
    const result = calculateEmployeeFatigue(shifts, defaultProfile, 2);
    expect(result.recoveryScore).toBeGreaterThanOrEqual(0);
    expect(result.recoveryScore).toBeLessThanOrEqual(100);
  });
});
