"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { ShiftCode } from "@/types";
import type { ShiftRow } from "./calendar-grid";
import { checkEmployeeCompliance } from "@/lib/compliance-engine";
import type { ShiftInput } from "@/lib/fatigue-engine/types";
import type { ComplianceViolation } from "@/lib/compliance-engine/types";

interface ShiftCellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  employeeId: string;
  date: string;
  existingShift?: ShiftRow;
  shiftCodes: ShiftCode[];
  onSaved: () => void;
  allShiftRows?: ShiftRow[];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ShiftCellDialog({
  open,
  onOpenChange,
  employeeName,
  employeeId,
  date,
  existingShift,
  shiftCodes,
  onSaved,
  allShiftRows,
}: ShiftCellDialogProps) {
  const isEdit = !!existingShift;

  const [code, setCode] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakMin, setBreakMin] = useState("0");
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (existingShift) {
        setCode(existingShift.shift.shiftCode || "");
        setStartTime(existingShift.shift.startTime || "");
        setEndTime(existingShift.shift.endTime || "");
        setBreakMin(String(existingShift.shift.breakMinutes || 0));
      } else {
        setCode("");
        setStartTime("");
        setEndTime("");
        setBreakMin("0");
      }
    }
  }, [open, existingShift]);

  function handleCodeChange(newCode: string) {
    setCode(newCode);
    const sc = shiftCodes.find((c) => c.code === newCode);
    if (sc) {
      if (sc.defaultStartTime) setStartTime(sc.defaultStartTime);
      if (sc.defaultEndTime) setEndTime(sc.defaultEndTime);
      if (sc.includesBreakMinutes) setBreakMin(String(sc.includesBreakMinutes));
      // Clear times for non-work shifts
      if (!sc.isWorkShift) {
        setStartTime("");
        setEndTime("");
      }
    }
  }

  const selectedCode = shiftCodes.find((c) => c.code === code);
  const isWorkShift = selectedCode ? selectedCode.isWorkShift : true;

  // Calcul local des violations pour preview
  const localViolations: ComplianceViolation[] = useMemo(() => {
    if (!allShiftRows || !code) return [];
    const sc = shiftCodes.find((c) => c.code === code);
    if (!sc) return [];

    // Convertir les shifts existants de l'employe en ShiftInput
    const empShifts: ShiftInput[] = allShiftRows
      .filter((r) => r.shift.employeeId === employeeId)
      .filter((r) => !(existingShift && r.shift.id === existingShift.shift.id))
      .map((r) => ({
        date: r.shift.startDate,
        shiftType: r.shift.shiftType,
        startTime: r.shift.startTime,
        endTime: r.shift.endTime,
        breakMinutes: r.shift.breakMinutes ?? 0,
      }));

    // Ajouter le shift en cours d'edition/creation
    if (isWorkShift && startTime && endTime) {
      empShifts.push({
        date,
        shiftType: sc.shiftCategory,
        startTime,
        endTime,
        breakMinutes: Number(breakMin) || 0,
      });
    } else if (!isWorkShift) {
      empShifts.push({
        date,
        shiftType: sc.shiftCategory,
        startTime: null,
        endTime: null,
        breakMinutes: 0,
      });
    }

    const result = checkEmployeeCompliance(employeeId, empShifts);
    // Ne garder que les violations liees a la date en cours
    return result.violations.filter((v) => v.date === date);
  }, [allShiftRows, employeeId, date, code, startTime, endTime, breakMin, existingShift, shiftCodes, isWorkShift]);

  async function handleSave() {
    if (!code) {
      toast.error("Veuillez selectionner un code vacation");
      return;
    }
    if (isWorkShift && (!startTime || !endTime)) {
      toast.error("Veuillez renseigner les horaires");
      return;
    }

    setSaving(true);
    try {
      const sc = shiftCodes.find((c) => c.code === code);
      const body = {
        employeeId,
        startDate: date,
        shiftType: sc?.shiftCategory ?? "jour",
        startTime: isWorkShift ? startTime : "00:00",
        endTime: isWorkShift ? endTime : "00:00",
        shiftCode: code,
        breakMinutes: Number(breakMin) || 0,
      };

      const url = isEdit
        ? `/api/admin/shifts/${existingShift.shift.id}`
        : "/api/admin/shifts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isEdit ? "Shift modifie" : "Shift ajoute");
        onOpenChange(false);
        onSaved();
      } else {
        toast.error("Erreur lors de l'enregistrement");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existingShift) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shifts/${existingShift.shift.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Shift supprime");
        onOpenChange(false);
        onSaved();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le shift" : "Nouveau shift"}</DialogTitle>
          <DialogDescription>
            {employeeName} — {formatDateDisplay(date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Code vacation *</label>
            <Select value={code} onValueChange={handleCodeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner..." />
              </SelectTrigger>
              <SelectContent>
                {shiftCodes.map((c) => (
                  <SelectItem key={c.id} value={c.code}>
                    {c.code} — {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isWorkShift && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Debut *</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Fin *</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {isWorkShift && (
            <div>
              <label className="text-sm font-medium">Pause (min)</label>
              <Input
                type="number"
                value={breakMin}
                onChange={(e) => setBreakMin(e.target.value)}
              />
            </div>
          )}
        </div>

        {localViolations.length > 0 && (
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/50">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Alertes reglementaires
              </span>
            </div>
            <ul className="space-y-1">
              {localViolations.map((v, i) => (
                <li key={i} className="text-xs text-orange-700 dark:text-orange-300">
                  {v.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          {isEdit && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              Supprimer
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
