"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EmployeeOverviewTable } from "@/components/dashboard/employee-overview-table";
import { DepartmentSummary } from "@/components/dashboard/department-summary";
import { FatigueBarChart } from "@/components/charts/fatigue-bar-chart";
import { ShiftDistributionPie } from "@/components/charts/shift-distribution-pie";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { RiskLevel } from "@/types";

interface OverviewItem {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    department: string | null;
    position: string | null;
  };
  fatigue: {
    riskLevel: string;
    cumulativeDeficitMinutes: number;
    recoveryScore: number;
    nightShiftCount: number;
    shiftCount: number;
  } | null;
}

export function DashboardClient() {
  const [data, setData] = useState<OverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/fatigue/overview");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch("/api/admin/fatigue/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windowDays: 7 }),
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`Fatigue recalculée pour ${result.calculated} employé(s)`);
        fetchOverview();
      } else {
        toast.error("Erreur lors du recalcul");
      }
    } finally {
      setRecalculating(false);
    }
  }

  // Compute KPIs
  const totalEmployees = data.length;
  const withFatigue = data.filter((d) => d.fatigue);
  const avgRecovery = withFatigue.length > 0
    ? Math.round(withFatigue.reduce((sum, d) => sum + (d.fatigue?.recoveryScore ?? 100), 0) / withFatigue.length)
    : 100;
  const criticalCount = withFatigue.filter((d) => d.fatigue?.riskLevel === "critical").length;
  const highCount = withFatigue.filter((d) => d.fatigue?.riskLevel === "high").length;
  const alertCount = criticalCount + highCount;
  const nightShiftTotal = withFatigue.reduce((sum, d) => sum + (d.fatigue?.nightShiftCount ?? 0), 0);

  // Bar chart data
  const barData = withFatigue
    .filter((d) => d.fatigue && d.fatigue.cumulativeDeficitMinutes > 0)
    .map((d) => ({
      name: `${d.employee.firstName} ${d.employee.lastName.charAt(0)}.`,
      deficit: Math.round((d.fatigue?.cumulativeDeficitMinutes ?? 0) / 60),
      riskLevel: (d.fatigue?.riskLevel ?? "low") as RiskLevel,
    }))
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 15);

  // Pie chart data (shift type distribution from all fatigue scores)
  const shiftTypes: Record<string, number> = {};
  for (const d of withFatigue) {
    if (d.fatigue) {
      const nights = d.fatigue.nightShiftCount;
      const total = d.fatigue.shiftCount;
      const dayOrEvening = total - nights;
      shiftTypes["Nuit"] = (shiftTypes["Nuit"] ?? 0) + nights;
      shiftTypes["Jour/Soir"] = (shiftTypes["Jour/Soir"] ?? 0) + dayOrEvening;
    }
  }
  const pieData = Object.entries(shiftTypes).map(([name, value]) => ({ name, value }));

  // Department summary
  const deptMap = new Map<string, { employees: number; totalDeficit: number; worstRisk: RiskLevel }>();
  for (const d of data) {
    const dept = d.employee.department || "Non assigné";
    const existing = deptMap.get(dept) || { employees: 0, totalDeficit: 0, worstRisk: "low" as RiskLevel };
    existing.employees++;
    if (d.fatigue) {
      existing.totalDeficit += d.fatigue.cumulativeDeficitMinutes;
      const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
      if ((riskOrder[d.fatigue.riskLevel] ?? 0) > (riskOrder[existing.worstRisk] ?? 0)) {
        existing.worstRisk = d.fatigue.riskLevel as RiskLevel;
      }
    }
    deptMap.set(dept, existing);
  }
  const deptData = Array.from(deptMap.entries()).map(([department, info]) => ({
    department,
    employeeCount: info.employees,
    worstRisk: info.worstRisk,
    avgDeficitMinutes: info.employees > 0 ? Math.round(info.totalDeficit / info.employees) : 0,
  }));

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Chargement du tableau de bord...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <Button
          variant="outline"
          onClick={handleRecalculate}
          disabled={recalculating}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalcul..." : "Recalculer la fatigue"}
        </Button>
      </div>

      <AlertBanner criticalCount={criticalCount} highCount={highCount} />

      <KpiCards
        totalEmployees={totalEmployees}
        averageFatigue={avgRecovery}
        alertCount={alertCount}
        nightShiftCount={nightShiftTotal}
      />

      <EmployeeOverviewTable data={data} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FatigueBarChart data={barData} />
        <ShiftDistributionPie data={pieData} />
      </div>

      <DepartmentSummary data={deptData} />
    </div>
  );
}
