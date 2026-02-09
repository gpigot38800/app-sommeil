"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee, ShiftCode } from "@/types";

interface AdminShiftFormValues {
  employeeId: string;
  date: string;
  shiftCode: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

interface AdminShiftFormProps {
  employees: Employee[];
  shiftCodes: ShiftCode[];
  onSubmit: (values: AdminShiftFormValues) => Promise<void>;
  loading?: boolean;
}

export function AdminShiftForm({
  employees,
  shiftCodes,
  onSubmit,
  loading = false,
}: AdminShiftFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [shiftCodeId, setShiftCodeId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);

  function handleShiftCodeChange(codeId: string) {
    setShiftCodeId(codeId);
    const code = shiftCodes.find((c) => c.id === codeId);
    if (code) {
      if (code.defaultStartTime) setStartTime(code.defaultStartTime);
      if (code.defaultEndTime) setEndTime(code.defaultEndTime);
      if (code.includesBreakMinutes !== null) {
        setBreakMinutes(code.includesBreakMinutes);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !date || !shiftCodeId || !startTime || !endTime) return;

    const selectedCode = shiftCodes.find((c) => c.id === shiftCodeId);
    await onSubmit({
      employeeId,
      date,
      shiftCode: selectedCode?.code ?? "",
      startTime,
      endTime,
      breakMinutes,
    });

    // Reset form
    setEmployeeId("");
    setDate("");
    setShiftCodeId("");
    setStartTime("");
    setEndTime("");
    setBreakMinutes(0);
  }

  // Sort employees by last name
  const sortedEmployees = [...employees].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  // Group shift codes by category
  const groupedCodes = shiftCodes.reduce<Record<string, ShiftCode[]>>((acc, code) => {
    const cat = code.shiftCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(code);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    jour: "Jour",
    soir: "Soir",
    nuit: "Nuit",
    repos: "Repos",
    absence: "Absence",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Employee selector */}
      <div className="grid gap-2">
        <Label htmlFor="employee">Employe *</Label>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger id="employee" className="w-full">
            <SelectValue placeholder="Selectionner un employe" />
          </SelectTrigger>
          <SelectContent>
            {sortedEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.lastName} {emp.firstName}
                {emp.matricule ? ` (${emp.matricule})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date picker */}
      <div className="grid gap-2">
        <Label htmlFor="shift-date">Date *</Label>
        <Input
          id="shift-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Shift code selector */}
      <div className="grid gap-2">
        <Label htmlFor="shift-code">Code vacation *</Label>
        <Select value={shiftCodeId} onValueChange={handleShiftCodeChange}>
          <SelectTrigger id="shift-code" className="w-full">
            <SelectValue placeholder="Selectionner un code" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedCodes).map(([category, codes]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {categoryLabels[category] ?? category}
                </div>
                {codes.map((code) => (
                  <SelectItem key={code.id} value={code.id}>
                    {code.code} — {code.label ?? code.shiftCategory}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Start / End time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start-time">Heure debut *</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end-time">Heure fin *</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Break minutes */}
      <div className="grid gap-2">
        <Label htmlFor="break-minutes">Pause (minutes)</Label>
        <Input
          id="break-minutes"
          type="number"
          min={0}
          max={120}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(Number(e.target.value))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !employeeId || !date || !shiftCodeId}>
        {loading ? "Ajout en cours..." : "Ajouter le shift"}
      </Button>
    </form>
  );
}
