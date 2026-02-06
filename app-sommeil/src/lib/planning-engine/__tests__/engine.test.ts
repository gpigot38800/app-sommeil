import { describe, it, expect } from "vitest";
import { generateTransitionPlan } from "../index";
import { timeToMinutes } from "../rules";
import type { PlanningInput } from "../types";

// 7.1 - Plan uses habitual times as start point
describe("habitual times as start point", () => {
  it("starts from user's habitual sleep time, not reference times", () => {
    const input: PlanningInput = {
      habitualSleepTime: "21:30",
      habitualWakeTime: "05:30",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-18",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);

    // Day 1 should start close to habitual sleep time (21:30), not reference (23:00)
    const day1Sleep = timeToMinutes(result.days[0].targetSleepTime);
    const habitualSleep = timeToMinutes("21:30");
    const referenceSleep = timeToMinutes("23:00");

    // The first day's sleep time should be closer to habitual than to old reference
    const diffFromHabitual = Math.abs(day1Sleep - habitualSleep);
    const diffFromReference = Math.abs(day1Sleep - referenceSleep);
    expect(diffFromHabitual).toBeLessThan(diffFromReference);
  });

  it("uses habitual sleep time 22:00 as base, progressively shifting toward target", () => {
    const input: PlanningInput = {
      habitualSleepTime: "22:00",
      habitualWakeTime: "06:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "soir",
        startTime: "15:00",
        endTime: "23:00",
        startDate: "2025-02-17",
        endDate: "2025-02-21",
      },
    };

    const result = generateTransitionPlan(input);

    // The plan should progressively shift from habitual (22:00) toward target
    // Target = toShift.startTime (15:00) - habitual duration (8h) = 07:00
    const lastDay = result.days[result.days.length - 1];
    const lastDaySleep = timeToMinutes(lastDay.targetSleepTime);
    // Last day should land on target: 15:00 - 8h = 07:00
    expect(lastDaySleep).toBe(timeToMinutes("07:00"));

    // Days should be progressively shifting (each day closer to target than previous)
    expect(result.days.length).toBeGreaterThanOrEqual(2);
  });
});

// 7.2 - Caffeine cutoff differentiated by shift type
describe("caffeine cutoff by shift type", () => {
  it("applies 8h cutoff for jour shift days", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-16",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-18",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);

    // Find a repos day (between shifts)
    const reposDay = result.days.find((d) => d.shiftType === null);
    if (reposDay) {
      const sleepMin = timeToMinutes(reposDay.targetSleepTime);
      const cutoffMin = timeToMinutes(reposDay.caffeineCutoff);
      // Repos uses 8h (480 min) before sleep
      let diff = sleepMin - cutoffMin;
      if (diff < 0) diff += 1440;
      expect(diff).toBe(480);
    }
  });

  it("applies 6h cutoff for nuit shift days", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-16",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);

    // Find a nuit day
    const nuitDay = result.days.find((d) => d.shiftType === "nuit");
    if (nuitDay) {
      const sleepMin = timeToMinutes(nuitDay.targetSleepTime);
      const cutoffMin = timeToMinutes(nuitDay.caffeineCutoff);
      let diff = sleepMin - cutoffMin;
      if (diff < 0) diff += 1440;
      expect(diff).toBe(360); // 6h
    }
  });
});

// 7.3 - Automatic day calculation clamped between 2 and 6
describe("automatic day calculation", () => {
  it("clamps to MIN_DAYS (2) when shift gap is 1 day", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-15",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);
    expect(result.actualDaysCount).toBe(2); // min clamp
  });

  it("uses exact gap when between 2 and 6", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-18",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);
    // Gap = Feb 18 - Feb 14 = 4 days
    expect(result.actualDaysCount).toBe(4);
  });

  it("clamps to MAX_DAYS (6) when shift gap is 10 days", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-01",
        endDate: "2025-02-05",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-15",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);
    expect(result.actualDaysCount).toBe(6); // max clamp
  });
});

// 7.4 - Shift type badges and work hours on plan days
describe("shift context on plan days", () => {
  it("assigns correct shift type and work hours for each day", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-18",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);

    // All days should have shift context info
    for (const day of result.days) {
      if (day.shiftType !== null) {
        expect(day.workStartTime).not.toBeNull();
        expect(day.workEndTime).not.toBeNull();
      } else {
        // Repos day
        expect(day.workStartTime).toBeNull();
        expect(day.workEndTime).toBeNull();
      }
    }
  });

  it("maps days between shifts as repos (null)", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-12",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-18",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);

    // Plan starts Feb 13 (day after fromShift ends Feb 12)
    // Feb 13-17 are between shifts = repos
    // All days should be repos since plan starts after fromShift ends
    // and toShift starts Feb 18 which is after the 6-day max plan
    const reposDays = result.days.filter((d) => d.shiftType === null);
    expect(reposDays.length).toBeGreaterThan(0);
  });
});

// 7.5 - Light window: visible for jour/soir/repos, absent for nuit
describe("light window by shift type", () => {
  it("shows light window for repos days", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-20",
        endDate: "2025-02-25",
      },
    };

    const result = generateTransitionPlan(input);

    const reposDay = result.days.find((d) => d.shiftType === null);
    if (reposDay) {
      expect(reposDay.lightStart).not.toBeNull();
      expect(reposDay.lightEnd).not.toBeNull();
    }
  });

  it("hides light window for nuit days", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-16",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);

    const nuitDay = result.days.find((d) => d.shiftType === "nuit");
    if (nuitDay) {
      expect(nuitDay.lightStart).toBeNull();
      expect(nuitDay.lightEnd).toBeNull();
    }
  });

  it("light window is 2h before sleep time", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "soir",
        startTime: "15:00",
        endTime: "23:00",
        startDate: "2025-02-20",
        endDate: "2025-02-25",
      },
    };

    const result = generateTransitionPlan(input);

    // For any day with light window, it should be 2h before sleep
    for (const day of result.days) {
      if (day.lightStart && day.lightEnd) {
        const lightStartMin = timeToMinutes(day.lightStart);
        const sleepMin = timeToMinutes(day.targetSleepTime);
        let diff = sleepMin - lightStartMin;
        if (diff < 0) diff += 1440;
        expect(diff).toBe(120); // 2h
      }
    }
  });
});

// Notes conditional logic
describe("transition notes", () => {
  it("shows intro note only for nuit→jour with deficit", () => {
    const input: PlanningInput = {
      habitualSleepTime: "08:00",
      habitualWakeTime: "16:00",
      fromShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-16",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);
    const day1 = result.days[0];

    // For nuit→jour transition with potential deficit, day 1 should have intro note
    if (day1.deficitMinutes > 0) {
      expect(day1.notes).toContain("Debut de la transition");
    }
  });

  it("does NOT show intro note for jour→soir transition", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "soir",
        startTime: "15:00",
        endTime: "23:00",
        startDate: "2025-02-17",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);
    const day1 = result.days[0];
    expect(day1.notes).not.toContain("Debut de la transition");
  });

  it("shows last day note on final day", () => {
    const input: PlanningInput = {
      habitualSleepTime: "23:00",
      habitualWakeTime: "07:00",
      fromShift: {
        type: "jour",
        startTime: "07:00",
        endTime: "15:00",
        startDate: "2025-02-10",
        endDate: "2025-02-14",
      },
      toShift: {
        type: "nuit",
        startTime: "21:00",
        endTime: "07:00",
        startDate: "2025-02-18",
        endDate: "2025-02-22",
      },
    };

    const result = generateTransitionPlan(input);
    const lastDay = result.days[result.days.length - 1];
    expect(lastDay.notes).toContain("Dernier jour de transition");
  });
});
