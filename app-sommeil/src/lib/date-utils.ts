/** Utilitaires de dates pour la navigation semaine du planning */

/** Retourne le lundi de la semaine contenant `date` */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // getDay(): 0=dimanche, 1=lundi... On veut lundi=0
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Retourne le dimanche de la semaine commencant a `weekStart` */
export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

/** Retourne un tableau de 7 dates (lundi a dimanche) */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Avance ou recule de `n` semaines */
export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/** Format YYYY-MM-DD */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Retourne { dayName: "Lun", dayNum: 3 } */
export function formatDayHeader(date: Date): { dayName: string; dayNum: number } {
  const dayName = date.toLocaleDateString("fr-FR", { weekday: "short" });
  // Capitalize first letter
  const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace(".", "");
  return { dayName: capitalized, dayNum: date.getDate() };
}

/** Retourne "3 - 9 fev. 2026" */
export function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString("fr-FR", { month: "short" });
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay} ${endMonth} ${endYear}`;
  }

  const startMonth = start.toLocaleDateString("fr-FR", { month: "short" });
  if (start.getFullYear() === end.getFullYear()) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} ${startMonth} ${start.getFullYear()} - ${endDay} ${endMonth} ${endYear}`;
}
