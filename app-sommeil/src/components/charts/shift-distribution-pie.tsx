"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ShiftDistributionData {
  name: string;
  value: number;
}

interface ShiftDistributionPieProps {
  data: ShiftDistributionData[];
}

const COLORS = ["#3b82f6", "#f97316", "#6366f1", "#22c55e", "#94a3b8"];

export function ShiftDistributionPie({ data }: ShiftDistributionPieProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Répartition des shifts</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
