import { describe, it, expect } from "vitest";
import { estimateSleepOpportunity, countConsecutiveNights, getHabitualDuration } from "../estimators";
import type { ShiftInput } from "../types";

function makeShift(type: string, start?: string, end?: string, breakMin = 0): ShiftInput {
  return { date: "2026-03-09", shiftType: type, startTime: start ?? null, endTime: end ?? null, breakMinutes: breakMin };
}

describe("estimateSleepOpportunity", () => {
  const habitualDuration = 480; // 8h

  it("returns full duration for rest day", () => {
    const result = estimateSleepOpportunity(makeShift("repos"), null, habitualDuration);
    expect(result.sleepMinutes).toBe(480);
    expect(result.hasQuickReturn).toBe(false);
  });

  it("returns full duration for absence", () => {
    const result = estimateSleepOpportunity(makeShift("absence"), null, habitualDuration);
    expect(result.sleepMinutes).toBe(480);
  });

  it("estimates ~5.5h for night shift", () => {
    const result = estimateSleepOpportunity(
      makeShift("nuit", "21:00", "07:00"),
      null,
      habitualDuration
    );
    expect(result.sleepMinutes).toBeLessThanOrEqual(480);
    expect(result.sleepMinutes).toBeGreaterThanOrEqual(300);
  });

  it("returns full duration for day shift without next shift", () => {
    const result = estimateSleepOpportunity(
      makeShift("jour", "07:00", "14:30"),
      null,
      habitualDuration
    );
    expect(result.sleepMinutes).toBe(480);
  });

  it("detects quick return (< 11h gap)", () => {
    const current = makeShift("soir", "14:00", "22:00");
    const next = makeShift("jour", "06:00", "14:00");
    const result = estimateSleepOpportunity(current, next, habitualDuration);
    expect(result.hasQuickReturn).toBe(true);
    expect(result.sleepMinutes).toBeLessThan(480);
  });

  it("no quick return with sufficient gap", () => {
    const current = makeShift("jour", "07:00", "15:00");
    const next = makeShift("jour", "07:00", "15:00");
    const result = estimateSleepOpportunity(current, next, habitualDuration);
    expect(result.hasQuickReturn).toBe(false);
  });

  it("handles shift without times (category-based estimate)", () => {
    const result = estimateSleepOpportunity(makeShift("nuit"), null, habitualDuration);
    expect(result.sleepMinutes).toBe(330);
  });
});

describe("countConsecutiveNights", () => {
  it("counts 3 consecutive nights", () => {
    const shifts: ShiftInput[] = [
      makeShift("nuit"), makeShift("nuit"), makeShift("nuit"), makeShift("repos"),
    ];
    expect(countConsecutiveNights(shifts)).toBe(3);
  });

  it("returns 0 for no nights", () => {
    const shifts: ShiftInput[] = [makeShift("jour"), makeShift("jour")];
    expect(countConsecutiveNights(shifts)).toBe(0);
  });

  it("returns max of multiple sequences", () => {
    const shifts: ShiftInput[] = [
      makeShift("nuit"), makeShift("nuit"), makeShift("repos"),
      makeShift("nuit"), makeShift("nuit"), makeShift("nuit"), makeShift("nuit"),
    ];
    expect(countConsecutiveNights(shifts)).toBe(4);
  });
});

describe("getHabitualDuration", () => {
  it("calculates 8h for 23:00-07:00", () => {
    expect(getHabitualDuration("23:00", "07:00")).toBe(480);
  });

  it("calculates 7h for 00:00-07:00", () => {
    expect(getHabitualDuration("00:00", "07:00")).toBe(420);
  });

  it("handles same-day sleep (nap)", () => {
    expect(getHabitualDuration("14:00", "16:00")).toBe(120);
  });
});
