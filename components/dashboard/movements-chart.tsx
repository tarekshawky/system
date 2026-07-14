"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MovementsChart({
  data,
  inLabel,
  outLabel,
}: {
  data: { date: string; in: number; out: number }[];
  inLabel: string;
  outLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="in" name={inLabel} fill="var(--chart-1)" radius={4} />
        <Bar dataKey="out" name={outLabel} fill="var(--chart-2)" radius={4} />
      </BarChart>
    </ResponsiveContainer>
  );
}
