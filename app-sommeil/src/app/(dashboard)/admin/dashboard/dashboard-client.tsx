"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { ComplianceSummary } from "@/components/dashboard/compliance-summary";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { EmployeeOverviewTable } from "@/components/dashboard/employee-overview-table";
import { DepartmentSummary } from "@/components/dashboard/department-summary";
import { FatigueBarChart } from "@/components/charts/fatigue-bar-chart";
import { ShiftDistributionPie } from "@/components/charts/shift-distribution-pie";
import { RefreshCw } from "lucide-react";
import type { RiskLevel } from "@/types";
import { useFetch, useComplianceViolations, useMutation } from "@/hooks";

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
  // Compliance URL: 7 derniers jours
  const complianceUrl = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];
    return `/api/admin/compliance?startDate=${startStr}&endDate=${endStr}`;
  }, []);

  const { data, loading } = useFetch<OverviewItem[]>("/api/admin/fatigue/overview");
  const { rawData: complianceData, refetch: refetchCompliance } = useComplianceViolations(complianceUrl);

  const recalculateMutation = useMutation<{ windowDays: number }>({
    url: "/api/admin/fatigue/calculate",
    successMessage: "Fatigue recalculée",
    errorMessage: "Erreur lors du recalcul",
  });

  async function handleRecalculate() {
    await recalculateMutation.mutate({ windowDays: 7 });
  }

  const overviewData = data ?? [];

  // Compute KPIs
  const totalEmployees = overviewData.length;
  const withFatigue = overviewData.filter((d) => d.fatigue);
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
      name: `${d.employee.firstName} ${d.employee.lastName}`,
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
  for (const d of overviewData) {
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
          disabled={recalculateMutation.loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${recalculateMutation.loading ? "animate-spin" : ""}`} />
          {recalculateMutation.loading ? "Recalcul..." : "Recalculer la fatigue"}
        </Button>
      </div>

      <AlertBanner criticalCount={criticalCount} highCount={highCount} />

      <ComplianceSummary data={complianceData} />

      <KpiCards
        totalEmployees={totalEmployees}
        averageFatigue={avgRecovery}
        alertCount={alertCount}
        nightShiftCount={nightShiftTotal}
        complianceViolationCount={complianceData.reduce((sum, d) => sum + d.violations.length, 0)}
      />

      <EmployeeOverviewTable data={overviewData} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FatigueBarChart data={barData} />
        <ShiftDistributionPie data={pieData} />
      </div>

      <DepartmentSummary data={deptData} />
    </div>
  );
}
