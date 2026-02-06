"use client";

import { useEffect, useState } from "react";
import {
  Moon,
  Sun,
  Coffee,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

interface PlanDetailProps {
  planId: string | null;
  initialPlan?: TransitionPlan | null;
}

const typeLabels: Record<string, string> = {
  jour: "Jour",
  soir: "Soir",
  nuit: "Nuit",
};

const shiftBadgeStyles: Record<string, string> = {
  jour: "bg-green-500/20 text-green-400 border-green-500/30",
  soir: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  nuit: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

function formatDeficit(minutes: number | null): string {
  if (!minutes || minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function formatTime(time: string | null): string {
  if (!time) return "";
  return time.substring(0, 5);
}

export function PlanDetail({ planId, initialPlan }: PlanDetailProps) {
  const [plan, setPlan] = useState<TransitionPlan | null>(initialPlan ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      return;
    }

    if (!planId) {
      setPlan(null);
      return;
    }

    setLoading(true);
    fetch(`/api/transition-plans/${planId}`)
      .then((res) => res.json())
      .then((data) => setPlan(data))
      .finally(() => setLoading(false));
  }, [planId, initialPlan]);

  if (!planId && !initialPlan) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement du plan...
        </CardContent>
      </Card>
    );
  }

  if (!plan) return null;

  const totalDeficit = plan.totalDeficitMinutes ?? 0;
  const deficitSeverity =
    totalDeficit === 0 ? "none" : totalDeficit <= 240 ? "moderate" : "high";

  return (
    <div className="space-y-4">
      {/* Deficit summary banner */}
      <Card
        className={
          deficitSeverity === "none"
            ? "border-green-500/30 bg-green-500/5"
            : deficitSeverity === "moderate"
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-red-500/30 bg-red-500/5"
        }
      >
        <CardContent className="flex items-center gap-3 py-4">
          {deficitSeverity === "none" ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <AlertTriangle
              className={`h-5 w-5 shrink-0 ${deficitSeverity === "high" ? "text-red-500" : "text-amber-500"}`}
            />
          )}
          <div>
            <p className="font-medium">
              {deficitSeverity === "none"
                ? "Aucun déficit de sommeil prévu"
                : `Déficit estimé : ${formatDeficit(totalDeficit)} sur ${plan.daysCount} jours`}
            </p>
            {deficitSeverity === "high" && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Deficit important. Privilegiez des siestes courtes (20 min) et
                evitez les activites a risque pendant la transition.
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {typeLabels[plan.fromShift] ?? plan.fromShift} →{" "}
              {typeLabels[plan.toShift] ?? plan.toShift}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Daily cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plan.days
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map((day) => {
            const dayDeficit = day.deficitMinutes ?? 0;
            const hasLight = day.lightStart && day.lightEnd;
            return (
              <Card key={day.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        Jour {day.dayNumber}
                      </CardTitle>
                      {day.shiftType ? (
                        <Badge
                          variant="outline"
                          className={shiftBadgeStyles[day.shiftType] ?? ""}
                        >
                          {typeLabels[day.shiftType] ?? day.shiftType}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                          Repos
                        </Badge>
                      )}
                    </div>
                    {dayDeficit > 0 && (
                      <Badge
                        variant="outline"
                        className={
                          dayDeficit > 60
                            ? "border-red-500/30 text-red-400"
                            : "border-amber-500/30 text-amber-400"
                        }
                      >
                        -{formatDeficit(dayDeficit)}
                      </Badge>
                    )}
                  </div>
                  {day.shiftType && day.workStartTime && day.workEndTime && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span>
                        {formatTime(day.workStartTime)} - {formatTime(day.workEndTime)}
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Moon className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="text-muted-foreground">Coucher</span>
                    <span className="ml-auto font-medium">
                      {formatTime(day.targetSleepTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                    <span className="text-muted-foreground">Lever</span>
                    <span className="ml-auto font-medium">
                      {formatTime(day.targetWakeTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Coffee className="h-4 w-4 text-orange-400 shrink-0" />
                    <span className="text-muted-foreground">Stop caféine</span>
                    <span className="ml-auto font-medium">
                      {formatTime(day.caffeineCutoff)}
                    </span>
                  </div>
                  {hasLight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-yellow-400 shrink-0" />
                      <span className="text-muted-foreground">Lumière tamisée</span>
                      <span className="ml-auto font-medium">
                        {formatTime(day.lightStart)} -{" "}
                        {formatTime(day.lightEnd)}
                      </span>
                    </div>
                  )}
                  {day.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      {day.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
