"use client";

import { useState } from "react";
import { TransitionForm } from "@/components/forms/transition-form";
import { PlanList } from "@/components/forms/plan-list";
import { PlanDetail } from "@/components/forms/plan-detail";

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
}

interface TransitionPlanWithDays extends TransitionPlan {
  days: Array<{
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
  }>;
}

interface TransitionClientProps {
  shifts: Shift[];
  plans: TransitionPlan[];
}

export function TransitionClient({ shifts, plans }: TransitionClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] =
    useState<TransitionPlanWithDays | null>(null);

  function handlePlanGenerated(plan: TransitionPlanWithDays) {
    setGeneratedPlan(plan);
    setSelectedPlanId(null);
  }

  function handleSelectPlan(planId: string) {
    setSelectedPlanId(planId);
    setGeneratedPlan(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon plan de transition</h1>
        <p className="text-sm text-muted-foreground">
          Générez un plan personnalisé pour adapter votre sommeil entre deux
          shifts
        </p>
      </div>

      <TransitionForm shifts={shifts} onPlanGenerated={handlePlanGenerated} />

      {/* Show generated plan detail or selected plan detail */}
      {generatedPlan && (
        <PlanDetail planId={null} initialPlan={generatedPlan} />
      )}
      {selectedPlanId && !generatedPlan && (
        <PlanDetail planId={selectedPlanId} />
      )}

      <PlanList plans={plans} onSelectPlan={handleSelectPlan} />
    </div>
  );
}
