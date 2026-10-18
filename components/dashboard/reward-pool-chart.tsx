"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RewardPoolPoint } from "@/lib/types";
import { formatUsdc } from "@/lib/format";

interface RewardPoolChartProps {
  data: RewardPoolPoint[];
}

export function RewardPoolChart({ data }: RewardPoolChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(143,174,235,0.08)" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#8ca3d8"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          stroke="#8ca3d8"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ fill: "rgba(99,239,171,0.08)" }}
          contentStyle={{
            background: "#0d1c42",
            border: "1px solid rgba(129,161,224,0.25)",
            borderRadius: "12px",
          }}
          labelStyle={{ color: "#c7d7fa" }}
          formatter={(value) => {
            const numericValue =
              typeof value === "number" ? value : Number(value ?? 0);

            return [`${formatUsdc(numericValue)} USDC`, "Penalty Pool"];
          }}
        />
        <Bar
          dataKey="value"
          fill="url(#rewardGradient)"
          radius={[8, 8, 0, 0]}
          maxBarSize={44}
        />
        <defs>
          <linearGradient id="rewardGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ff8b8" />
            <stop offset="100%" stopColor="#1e604d" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
