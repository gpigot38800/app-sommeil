"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FatigueTrendData {
  date: string;
  deficit: number;
}

interface FatigueTrendLineProps {
  data: FatigueTrendData[];
  title?: string;
}

export function FatigueTrendLine({
  data,
  title = "Tendance fatigue",
}: FatigueTrendLineProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`${value} min`, "Déficit"]}
              contentStyle={{ borderRadius: "8px" }}
            />
            <ReferenceLine y={120} stroke="#f97316" strokeDasharray="3 3" label="Vigilance" />
            <ReferenceLine y={240} stroke="#ef4444" strokeDasharray="3 3" label="Alerte" />
            <Line
              type="monotone"
              dataKey="deficit"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
