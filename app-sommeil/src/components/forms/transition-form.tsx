"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Shift {
  id: string;
  shiftType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface TransitionPlan {
  id: string;
  fromShift: string;
  toShift: string;
  startDate: string;
  daysCount: number;
  totalDeficitMinutes: number | null;
  createdAt: string;
  days: PlanDay[];
}

interface PlanDay {
  id: string;
  dayNumber: number;
  targetSleepTime: string;
  targetWakeTime: string;
  caffeineCutoff: string;
  lightStart: string | null;
  lightEnd: string | null;
  deficitMinutes: number | null;
  notes: string | null;
  shiftType: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
}

interface TransitionFormProps {
  shifts: Shift[];
  onPlanGenerated: (plan: TransitionPlan) => void;
}

const typeLabels: Record<string, string> = {
  jour: "Jour",
  soir: "Soir",
  nuit: "Nuit",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatShiftLabel(shift: Shift) {
  return `${typeLabels[shift.shiftType] ?? shift.shiftType} - ${formatDate(shift.startDate)} / ${formatDate(shift.endDate)}`;
}

export function TransitionForm({ shifts, onPlanGenerated }: TransitionFormProps) {
  const router = useRouter();
  const [fromShiftId, setFromShiftId] = useState("");
  const [toShiftId, setToShiftId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fromShiftId || !toShiftId) {
      setError("Veuillez sélectionner les deux shifts.");
      return;
    }

    if (fromShiftId === toShiftId) {
      setError("Les shifts de départ et d'arrivée doivent être différents.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/transition-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromShiftId, toShiftId }),
    });

    if (!response.ok) {
      const data = await response.json();
      toast.error(data.error || "Erreur lors de la génération du plan.");
      setLoading(false);
      return;
    }

    const plan = await response.json();
    toast.success("Plan de transition généré !");
    onPlanGenerated(plan);
    router.refresh();
    setLoading(false);
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p className="text-lg">Aucun shift enregistré</p>
          <p className="text-sm mt-1">
            Ajoutez des shifts dans la section Planning pour générer un plan de
            transition.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générer un plan de transition</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Shift de départ</Label>
              <Select value={fromShiftId} onValueChange={setFromShiftId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {formatShiftLabel(shift)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shift d&apos;arrivée</Label>
              <Select value={toShiftId} onValueChange={setToShiftId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {formatShiftLabel(shift)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Génération en cours..." : "Générer le plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
