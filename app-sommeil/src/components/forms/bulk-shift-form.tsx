"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Eye } from "lucide-react";
import type { Employee, ShiftCode } from "@/types";

interface BulkShiftData {
  employeeIds: string[];
  startDate: string;
  pattern: string[]; // Array of shift code IDs
}

interface BulkShiftFormProps {
  employees: Employee[];
  shiftCodes: ShiftCode[];
  onSubmit: (data: BulkShiftData) => Promise<void>;
  loading?: boolean;
}

interface PreviewRow {
  employeeName: string;
  date: string;
  code: string;
  category: string;
  startTime: string;
  endTime: string;
}

export function BulkShiftForm({
  employees,
  shiftCodes,
  onSubmit,
  loading = false,
}: BulkShiftFormProps) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [pattern, setPattern] = useState<string[]>([""]);
  const [showPreview, setShowPreview] = useState(false);

  // Sort employees
  const sortedEmployees = [...employees].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  function toggleEmployee(empId: string) {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  }

  function selectAllEmployees() {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map((e) => e.id));
    }
  }

  function addPatternSlot() {
    setPattern((prev) => [...prev, ""]);
  }

  function removePatternSlot(index: number) {
    setPattern((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePatternSlot(index: number, value: string) {
    setPattern((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  // Generate preview rows
  const preview = useMemo<PreviewRow[]>(() => {
    if (!startDate || pattern.length === 0) return [];

    const rows: PreviewRow[] = [];
    const selectedEmps = sortedEmployees.filter((e) =>
      selectedEmployeeIds.includes(e.id)
    );

    for (const emp of selectedEmps) {
      for (let dayOffset = 0; dayOffset < pattern.length; dayOffset++) {
        const codeId = pattern[dayOffset];
        if (!codeId) continue;

        const code = shiftCodes.find((c) => c.id === codeId);
        if (!code) continue;

        const d = new Date(startDate);
        d.setDate(d.getDate() + dayOffset);
        const dateStr = d.toISOString().split("T")[0];

        rows.push({
          employeeName: `${emp.lastName} ${emp.firstName}`,
          date: dateStr,
          code: code.code,
          category: code.shiftCategory,
          startTime: code.defaultStartTime ?? "-",
          endTime: code.defaultEndTime ?? "-",
        });
      }
    }

    return rows;
  }, [startDate, pattern, selectedEmployeeIds, shiftCodes, sortedEmployees]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0 || !startDate || pattern.every((p) => !p))
      return;

    await onSubmit({
      employeeIds: selectedEmployeeIds,
      startDate,
      pattern: pattern.filter(Boolean),
    });
  }

  const isValid =
    selectedEmployeeIds.length > 0 && startDate && pattern.some((p) => !!p);

  const categoryColors: Record<string, string> = {
    jour: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    soir: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    nuit: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    repos: "bg-green-500/20 text-green-400 border-green-500/30",
    absence: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pattern definition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rotation des shifts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {pattern.map((codeId, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16 shrink-0">
                  Jour {index + 1}
                </span>
                <Select
                  value={codeId || undefined}
                  onValueChange={(v) => updatePatternSlot(index, v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Code vacation" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftCodes.map((code) => (
                      <SelectItem key={code.id} value={code.id}>
                        {code.code} — {code.label ?? code.shiftCategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pattern.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePatternSlot(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPatternSlot}
          >
            <Plus className="mr-1 h-3 w-3" />
            Ajouter un jour
          </Button>
        </CardContent>
      </Card>

      {/* Start date */}
      <div className="grid gap-2">
        <Label htmlFor="bulk-start-date">Date de debut *</Label>
        <Input
          id="bulk-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      {/* Employee multi-select */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Employes ({selectedEmployeeIds.length}/{employees.length})
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllEmployees}
            >
              {selectedEmployeeIds.length === employees.length
                ? "Deselectionner tout"
                : "Tout selectionner"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 max-h-60 overflow-y-auto">
            {sortedEmployees.map((emp) => {
              const isSelected = selectedEmployeeIds.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleEmployee(emp.id)}
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input"
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span>
                    {emp.lastName} {emp.firstName}
                  </span>
                  {emp.department && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {emp.department}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview toggle */}
      {isValid && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="mr-1 h-4 w-4" />
            {showPreview ? "Masquer l'apercu" : "Voir l'apercu"} ({preview.length} shifts)
          </Button>

          {showPreview && preview.length > 0 && (
            <Card className="mt-3">
              <CardContent className="pt-4">
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-2 py-1.5 font-medium">Employe</th>
                        <th className="px-2 py-1.5 font-medium">Date</th>
                        <th className="px-2 py-1.5 font-medium">Code</th>
                        <th className="px-2 py-1.5 font-medium">Horaires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1.5">{row.employeeName}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {new Date(row.date + "T00:00:00").toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                          <td className="px-2 py-1.5">
                            <Badge
                              variant="outline"
                              className={categoryColors[row.category] ?? ""}
                            >
                              {row.code}
                            </Badge>
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {row.startTime} - {row.endTime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !isValid}>
        {loading
          ? "Creation en cours..."
          : `Creer ${preview.length} shift${preview.length !== 1 ? "s" : ""}`}
      </Button>
    </form>
  );
}
