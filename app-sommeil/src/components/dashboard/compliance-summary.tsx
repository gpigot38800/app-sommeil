"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComplianceViolation } from "@/lib/compliance-engine/types";

interface ComplianceEntry {
  employeeId: string;
  employeeName: string;
  department: string | null;
  violations: ComplianceViolation[];
}

interface ComplianceSummaryProps {
  data: ComplianceEntry[];
}

const VIOLATION_TYPE_LABELS: Record<string, string> = {
  quick_return: "Repos insuffisant",
  daily_hours: "Depassement horaire",
  weekly_hours: "Heures hebdo.",
  consecutive_nights: "Nuits consecutives",
  weekly_rest: "Repos hebdo.",
  consecutive_days: "Jours consecutifs",
};

const SEVERITY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  critical: {
    label: "Critique",
    className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
  violation: {
    label: "Violation",
    className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  warning: {
    label: "Attention",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

export function ComplianceSummary({ data }: ComplianceSummaryProps) {
  const totalViolations = data.reduce((sum, d) => sum + d.violations.length, 0);
  const criticalCount = data.reduce(
    (sum, d) => sum + d.violations.filter((v) => v.severity === "critical").length,
    0
  );

  if (totalViolations === 0) return null;

  // Aplatir pour le tableau, trier par severite
  const severityOrder = { critical: 0, violation: 1, warning: 2 };
  const rows = data
    .flatMap((entry) =>
      entry.violations.map((v) => ({
        employeeName: entry.employeeName,
        department: entry.department,
        ...v,
      }))
    )
    .sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2) ||
        a.date.localeCompare(b.date)
    );

  return (
    <div className="space-y-4">
      {/* Banniere */}
      <div
        className={
          criticalCount > 0
            ? "rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50"
            : "rounded-lg border border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/50"
        }
      >
        <div className="flex items-center gap-3">
          <ShieldAlert
            className={
              criticalCount > 0
                ? "h-5 w-5 text-red-600 dark:text-red-400"
                : "h-5 w-5 text-orange-600 dark:text-orange-400"
            }
          />
          <div>
            <p
              className={
                criticalCount > 0
                  ? "font-semibold text-red-800 dark:text-red-300"
                  : "font-semibold text-orange-800 dark:text-orange-300"
              }
            >
              {totalViolations} violation{totalViolations > 1 ? "s" : ""} reglementaire{totalViolations > 1 ? "s" : ""} cette semaine
            </p>
            <p className="text-sm text-muted-foreground">
              {data.length} employe{data.length > 1 ? "s" : ""} concerne{data.length > 1 ? "s" : ""} — Code du Travail
            </p>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Detail des violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Employe</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Service</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground">Type</th>
                  <th className="pb-2 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="pb-2 font-medium text-muted-foreground">Severite</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.employeeName}</td>
                    <td className="py-2 pr-4 text-muted-foreground hidden sm:table-cell">
                      {row.department || "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {VIOLATION_TYPE_LABELS[row.type] || row.type}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground hidden sm:table-cell">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-2">
                      <Badge
                        variant="secondary"
                        className={SEVERITY_CONFIG[row.severity]?.className ?? ""}
                      >
                        {SEVERITY_CONFIG[row.severity]?.label ?? row.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="mt-2 text-xs text-muted-foreground">
                + {rows.length - 20} autres violations...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
