import { describe, it, expect } from "vitest";
import {
  timeToMinutes,
  minutesToTime,
  circularDifference,
  calculateCaffeineCutoff,
  calculateLightWindow,
  calculateSleepDuration,
  calculateDeficit,
  differenceInCalendarDays,
} from "../rules";

describe("timeToMinutes", () => {
  it("converts 00:00 to 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts 23:30 to 1410", () => {
    expect(timeToMinutes("23:30")).toBe(23 * 60 + 30);
  });

  it("converts 07:00 to 420", () => {
    expect(timeToMinutes("07:00")).toBe(420);
  });
});

describe("minutesToTime", () => {
  it("converts 0 to 00:00", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("converts 1410 to 23:30", () => {
    expect(minutesToTime(1410)).toBe("23:30");
  });

  it("handles wrap-around (negative values)", () => {
    expect(minutesToTime(-60)).toBe("23:00");
  });

  it("handles wrap-around (values > 1440)", () => {
    expect(minutesToTime(1500)).toBe("01:00");
  });
});

describe("circularDifference", () => {
  it("returns positive for forward movement", () => {
    expect(circularDifference(timeToMinutes("22:00"), timeToMinutes("23:00"))).toBe(60);
  });

  it("returns negative for backward movement", () => {
    expect(circularDifference(timeToMinutes("23:00"), timeToMinutes("22:00"))).toBe(-60);
  });

  it("handles midnight wrap-around (forward)", () => {
    // 23:00 → 01:00 = +2h forward
    expect(circularDifference(timeToMinutes("23:00"), timeToMinutes("01:00"))).toBe(120);
  });
});

describe("calculateCaffeineCutoff", () => {
  it("applies 8h (480 min) before sleep for shift jour", () => {
    // Sleep at 23:00 (1380 min), cutoff = 23:00 - 8h = 15:00
    const result = calculateCaffeineCutoff(timeToMinutes("23:00"), "jour");
    expect(result).toBe("15:00");
  });

  it("applies 8h (480 min) before sleep for repos (null)", () => {
    // Sleep at 22:00 (1320 min), cutoff = 22:00 - 8h = 14:00
    const result = calculateCaffeineCutoff(timeToMinutes("22:00"), null);
    expect(result).toBe("14:00");
  });

  it("applies 6h (360 min) before sleep for shift soir", () => {
    // Sleep at 01:00 (60 min), cutoff = 01:00 - 6h = 19:00
    const result = calculateCaffeineCutoff(timeToMinutes("01:00"), "soir");
    expect(result).toBe("19:00");
  });

  it("applies 6h (360 min) before sleep for shift nuit", () => {
    // Sleep at 08:00 (480 min), cutoff = 08:00 - 6h = 02:00
    const result = calculateCaffeineCutoff(timeToMinutes("08:00"), "nuit");
    expect(result).toBe("02:00");
  });

  it("handles midnight wrap-around for jour shift", () => {
    // Sleep at 00:00 (0 min), cutoff = 00:00 - 8h = 16:00
    const result = calculateCaffeineCutoff(timeToMinutes("00:00"), "jour");
    expect(result).toBe("16:00");
  });
});

describe("calculateLightWindow", () => {
  it("returns 2h window before sleep for shift jour", () => {
    // Sleep at 23:00, light window = 21:00 - 23:00
    const result = calculateLightWindow("jour", timeToMinutes("23:00"));
    expect(result.lightStart).toBe("21:00");
    expect(result.lightEnd).toBe("23:00");
  });

  it("returns 2h window before sleep for shift soir", () => {
    // Sleep at 01:00, light window = 23:00 - 01:00
    const result = calculateLightWindow("soir", timeToMinutes("01:00"));
    expect(result.lightStart).toBe("23:00");
    expect(result.lightEnd).toBe("01:00");
  });

  it("returns 2h window before sleep for repos (null)", () => {
    // Sleep at 22:00, light window = 20:00 - 22:00
    const result = calculateLightWindow(null, timeToMinutes("22:00"));
    expect(result.lightStart).toBe("20:00");
    expect(result.lightEnd).toBe("22:00");
  });

  it("returns null for shift nuit", () => {
    const result = calculateLightWindow("nuit", timeToMinutes("08:00"));
    expect(result.lightStart).toBeNull();
    expect(result.lightEnd).toBeNull();
  });
});

describe("calculateSleepDuration", () => {
  it("calculates duration within same day", () => {
    // 22:00 → 06:00 = 8h = 480 min
    expect(calculateSleepDuration(timeToMinutes("22:00"), timeToMinutes("06:00"))).toBe(480);
  });

  it("calculates duration crossing midnight", () => {
    // 23:00 → 07:00 = 8h = 480 min
    expect(calculateSleepDuration(timeToMinutes("23:00"), timeToMinutes("07:00"))).toBe(480);
  });

  it("calculates short duration", () => {
    // 01:00 → 06:00 = 5h = 300 min
    expect(calculateSleepDuration(timeToMinutes("01:00"), timeToMinutes("06:00"))).toBe(300);
  });
});

describe("differenceInCalendarDays", () => {
  it("returns positive days when A is after B", () => {
    expect(differenceInCalendarDays("2025-02-20", "2025-02-15")).toBe(5);
  });

  it("returns 0 for same date", () => {
    expect(differenceInCalendarDays("2025-02-15", "2025-02-15")).toBe(0);
  });

  it("returns negative for reversed dates", () => {
    expect(differenceInCalendarDays("2025-02-10", "2025-02-15")).toBe(-5);
  });

  it("handles month boundary", () => {
    expect(differenceInCalendarDays("2025-03-02", "2025-02-27")).toBe(3);
  });
});

describe("calculateDeficit", () => {
  it("returns 0 when available sleep matches habitual duration", () => {
    // Habitual: 8h, sleep 23:00 → wake 07:00 = 8h
    expect(calculateDeficit(480, timeToMinutes("23:00"), timeToMinutes("07:00"))).toBe(0);
  });

  it("returns positive deficit when sleep is shortened", () => {
    // Habitual: 8h = 480min, sleep 01:00 → wake 06:00 = 5h = 300min
    // Deficit = 480 - 300 = 180 min
    expect(calculateDeficit(480, timeToMinutes("01:00"), timeToMinutes("06:00"))).toBe(180);
  });

  it("returns 0 when available sleep exceeds habitual duration", () => {
    // Habitual: 7h, sleep 22:00 → wake 07:00 = 9h
    expect(calculateDeficit(420, timeToMinutes("22:00"), timeToMinutes("07:00"))).toBe(0);
  });
});
