"use client";

import { useMemo } from "react";
import { getWeekDays, formatDateISO, formatDayHeader } from "@/lib/date-utils";
import { ShiftCategoryBadge } from "@/components/ui/shift-category-badge";
import { ComplianceIndicator } from "@/components/planning/compliance-indicator";
import type { Employee, ShiftCode, ShiftCategory } from "@/types";
import type { ComplianceViolation } from "@/lib/compliance-engine/types";

export interface ShiftRow {
  shift: {
    id: string;
    employeeId: string;
    startDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    shiftCode: string | null;
    breakMinutes: number;
  };
  employeeFirstName: string;
  employeeLastName: string;
  employeeDepartment: string | null;
}

interface CalendarGridProps {
  employees: Employee[];
  shiftRows: ShiftRow[];
  shiftCodes: ShiftCode[];
  weekStart: Date;
  onCellClick: (employeeId: string, date: string, existingShift?: ShiftRow) => void;
  /** Map cle = "employeeId:YYYY-MM-DD" -> violations */
  violations?: Map<string, ComplianceViolation[]>;
}

export function CalendarGrid({
  employees,
  shiftRows,
  shiftCodes,
  weekStart,
  onCellClick,
  violations,
}: CalendarGridProps) {
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const todayStr = formatDateISO(new Date());

  // Map shiftCode -> ShiftCode object
  const codeMap = useMemo(() => {
    const m = new Map<string, ShiftCode>();
    for (const sc of shiftCodes) m.set(sc.code, sc);
    return m;
  }, [shiftCodes]);

  // Lookup: employeeId -> dateStr -> ShiftRow
  const shiftLookup = useMemo(() => {
    const m = new Map<string, Map<string, ShiftRow>>();
    for (const row of shiftRows) {
      const empId = row.shift.employeeId;
      if (!m.has(empId)) m.set(empId, new Map());
      m.get(empId)!.set(row.shift.startDate, row);
    }
    return m;
  }, [shiftRows]);

  // Group employees by department
  const grouped = useMemo(() => {
    const map = new Map<string, Employee[]>();
    for (const emp of employees) {
      if (!emp.isActive) continue;
      const dept = emp.department || "Sans service";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(emp);
    }
    // Sort departments, then employees by lastName
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (const [, emps] of sorted) {
      emps.sort((a, b) => a.lastName.localeCompare(b.lastName));
    }
    return sorted;
  }, [employees]);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="sticky top-0 z-10 bg-background">
            <th className="sticky left-0 z-20 bg-background border-b border-r px-3 py-2 text-left text-sm font-medium text-muted-foreground min-w-[160px]">
              Employe
            </th>
            {days.map((day) => {
              const dateStr = formatDateISO(day);
              const { dayName, dayNum } = formatDayHeader(day);
              const isToday = dateStr === todayStr;
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              return (
                <th
                  key={dateStr}
                  className={`border-b px-2 py-2 text-center text-sm font-medium min-w-[90px] ${
                    isToday
                      ? "bg-primary/10"
                      : isWeekend
                        ? "bg-muted/30"
                        : "bg-background"
                  }`}
                >
                  <div className="text-muted-foreground">{dayName}</div>
                  <div className={isToday ? "text-primary font-bold" : ""}>{dayNum}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        {grouped.map(([dept, emps]) => (
          <tbody key={dept}>
            <tr>
              <td
                colSpan={8}
                className="bg-muted/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b"
              >
                {dept} ({emps.length})
              </td>
            </tr>
            {emps.map((emp) => (
              <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                <td className="sticky left-0 z-10 bg-background border-b border-r px-3 py-2 text-sm font-medium whitespace-nowrap">
                  {emp.lastName} {emp.firstName}
                </td>
                {days.map((day) => {
                  const dateStr = formatDateISO(day);
                  const isToday = dateStr === todayStr;
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const row = shiftLookup.get(emp.id)?.get(dateStr);

                  let shiftCode: ShiftCode | undefined;
                  if (row?.shift.shiftCode) {
                    shiftCode = codeMap.get(row.shift.shiftCode);
                  }

                  const category: ShiftCategory | undefined =
                    shiftCode?.shiftCategory ??
                    (row ? (row.shift.shiftType as ShiftCategory) : undefined);

                  const cellViolations = violations?.get(`${emp.id}:${dateStr}`) ?? [];
                  const hasCritical = cellViolations.some(
                    (v) => v.severity === "critical"
                  );
                  const hasViolation = cellViolations.length > 0;

                  return (
                    <td
                      key={dateStr}
                      onClick={() => onCellClick(emp.id, dateStr, row ?? undefined)}
                      className={`border-b px-1 py-1.5 text-center cursor-pointer hover:bg-primary/5 transition-colors relative ${
                        hasCritical
                          ? "ring-2 ring-inset ring-red-500/60"
                          : hasViolation
                            ? "ring-1 ring-inset ring-red-300/40"
                            : ""
                      } ${
                        isToday
                          ? "bg-primary/5"
                          : isWeekend
                            ? "bg-muted/20"
                            : ""
                      }`}
                    >
                      {cellViolations.length > 0 && (
                        <ComplianceIndicator violations={cellViolations} />
                      )}
                      {row && category ? (
                        <ShiftCategoryBadge
                          code={row.shift.shiftCode || row.shift.shiftType}
                          category={category}
                          onClick={() => onCellClick(emp.id, dateStr, row)}
                        />
                      ) : (
                        <span className="block h-6" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
        {grouped.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={8} className="py-8 text-center text-muted-foreground">
                Aucun employe actif.
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </div>
  );
}
