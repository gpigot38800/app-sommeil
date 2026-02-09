"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, AlertTriangle, Moon, Activity } from "lucide-react";

interface KpiCardsProps {
  totalEmployees: number;
  averageFatigue: number;
  alertCount: number;
  nightShiftCount: number;
}

export function KpiCards({
  totalEmployees,
  averageFatigue,
  alertCount,
  nightShiftCount,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Total employés",
      value: totalEmployees,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Score fatigue moyen",
      value: `${averageFatigue}%`,
      icon: Activity,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Alertes actives",
      value: alertCount,
      icon: AlertTriangle,
      color: alertCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
    },
    {
      title: "En shift de nuit",
      value: nightShiftCount,
      icon: Moon,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="flex items-center gap-3 py-4">
            <card.icon className={`h-8 w-8 ${card.color}`} />
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
