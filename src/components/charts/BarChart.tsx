import * as React from "react";
import {
  BarChart as RBarChart,
  Bar,
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

export interface BarChartProps extends Omit<ChartCardProps, "children"> {
  /** dimension field to use as the x-axis, e.g. "date" or "region" */
  xField: string;
  /** metric fields to render as bars \u2014 one bar series per metric */
  series: string[];
  stacked?: boolean;
}

export function BarChart({ xField, series, stacked, ...cardProps }: BarChartProps) {
  const { semantic } = useBiContext();

  return (
    <ChartCard {...cardProps}>
      {(rows) => (
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
              <Bar
                key={field}
                dataKey={field}
                name={field}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </RBarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
