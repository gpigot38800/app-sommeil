"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskLevel } from "@/types";

interface FatigueBarData {
  name: string;
  deficit: number;
  riskLevel: RiskLevel;
}

interface FatigueBarChartProps {
  data: FatigueBarData[];
}

const riskColors: Record<RiskLevel, string> = {
  low: "#22c55e",
  medium: "#f97316",
  high: "#ef4444",
  critical: "#dc2626",
};

export function FatigueBarChart({ data }: FatigueBarChartProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Déficit de sommeil par employé (heures)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value}h`, "Déficit"]}
              contentStyle={{ borderRadius: "8px" }}
            />
            <Bar dataKey="deficit" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={riskColors[entry.riskLevel]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
