"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FatigueBadge } from "@/components/ui/fatigue-badge";
import type { RiskLevel } from "@/types";

interface DepartmentData {
  department: string;
  employeeCount: number;
  worstRisk: RiskLevel;
  avgDeficitMinutes: number;
}

interface DepartmentSummaryProps {
  data: DepartmentData[];
}

export function DepartmentSummary({ data }: DepartmentSummaryProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Résumé par service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((dept) => (
          <div
            key={dept.department}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{dept.department}</p>
              <p className="text-xs text-muted-foreground">
                {dept.employeeCount} employé{dept.employeeCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Moy. {Math.round(dept.avgDeficitMinutes / 60)}h déficit
              </span>
              <FatigueBadge riskLevel={dept.worstRisk} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
