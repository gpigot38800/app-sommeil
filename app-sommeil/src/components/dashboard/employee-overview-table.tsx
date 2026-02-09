"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FatigueBadge } from "@/components/ui/fatigue-badge";
import type { RiskLevel } from "@/types";

interface EmployeeOverview {
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
  } | null;
}

interface EmployeeOverviewTableProps {
  data: EmployeeOverview[];
}

export function EmployeeOverviewTable({ data }: EmployeeOverviewTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun employé. Ajoutez des employés et importez des shifts pour voir le tableau de bord.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vue d&apos;ensemble des employés</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Employé</th>
                <th className="px-4 py-2 text-left font-medium">Service</th>
                <th className="px-4 py-2 text-left font-medium">Statut</th>
                <th className="px-4 py-2 text-right font-medium">Déficit</th>
                <th className="px-4 py-2 text-right font-medium">Récupération</th>
                <th className="px-4 py-2 text-right font-medium">Nuits</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.employee.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/employees/${row.employee.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.employee.firstName} {row.employee.lastName}
                    </Link>
                    {row.employee.position && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {row.employee.position}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {row.employee.department ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {row.fatigue ? (
                      <FatigueBadge riskLevel={row.fatigue.riskLevel as RiskLevel} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Non calculé</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.fatigue
                      ? `${Math.round(row.fatigue.cumulativeDeficitMinutes / 60)}h`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.fatigue ? `${row.fatigue.recoveryScore}%` : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.fatigue?.nightShiftCount ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
