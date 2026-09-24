import * as React from "react";
import {
  AreaChart as RAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard, type ChartCardProps } from "./ChartCard";
import { useBiContext } from "@/components/dashboard/BiProvider";
import { formatCompact } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(var(--brk-chart-1))",
  "hsl(var(--brk-chart-2))",
  "hsl(var(--brk-chart-3))",
  "hsl(var(--brk-chart-4))",
  "hsl(var(--brk-chart-5))",
];

export interface AreaChartProps extends Omit<ChartCardProps, "children"> {
  xField: string;
  series: string[];
  stacked?: boolean;
}

export function AreaChart({ xField, series, stacked, ...cardProps }: AreaChartProps) {
  const { semantic } = useBiContext();

  return (
    <ChartCard {...cardProps}>
      {(rows) => (
        <ResponsiveContainer width="100%" height="100%">
          <RAreaChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series.map((field, i) => (
                <linearGradient key={field} id={`brk-area-${field}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--brk-border))" vertical={false} />
            <XAxis
              dataKey={xField}
              tick={{ fontSize: 12, fill: "hsl(var(--brk-muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--brk-border))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "hsl(var(--brk-muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompact(Number(v))}
              width={44}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--brk-card))",
                border: "1px solid hsl(var(--brk-border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [formatCompact(value), semantic.labelFor(name)]}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => semantic.labelFor(v)} />}
            {series.map((field, i) => (
              <Area
                key={field}
                type="monotone"
                dataKey={field}
                name={field}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                fill={`url(#brk-area-${field})`}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </RAreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
