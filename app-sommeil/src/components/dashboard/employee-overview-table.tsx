"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 5;

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun employé. Ajoutez des employés et importez des shifts pour voir le tableau de bord.
        </CardContent>
      </Card>
    );
  }

  const displayedData = isExpanded ? data : data.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = data.length > INITIAL_DISPLAY_COUNT;

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
              {displayedData.map((row) => (
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
        {hasMore && (
          <div className="mt-4 flex justify-center pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Voir moins
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Voir tout ({data.length - INITIAL_DISPLAY_COUNT} de plus)
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
