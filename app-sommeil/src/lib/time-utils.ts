/** Convert "HH:MM" to minutes since midnight (0-1439) */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Calculate sleep duration in minutes from habitual times */
export function calculateSleepDuration(
  sleepMinutes: number,
  wakeMinutes: number
): number {
  let duration = wakeMinutes - sleepMinutes;
  if (duration <= 0) duration += 1440;
  return duration;
}
