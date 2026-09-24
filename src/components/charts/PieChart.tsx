import * as React from "react";
import { PieChart as RPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

export interface PieChartProps extends Omit<ChartCardProps, "children"> {
  /** dimension field for slice labels, e.g. "channel" */
  nameField: string;
  /** metric field for slice size, e.g. "revenue" */
  valueField: string;
  donut?: boolean;
}

export function PieChart({ nameField, valueField, donut = true, ...cardProps }: PieChartProps) {
  const { semantic } = useBiContext();

  return (
    <ChartCard {...cardProps}>
      {(rows) => (
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <Pie
              data={rows}
              dataKey={valueField}
              nameKey={nameField}
              innerRadius={donut ? "55%" : 0}
              outerRadius="80%"
              paddingAngle={2}
              strokeWidth={1}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--brk-card))",
                border: "1px solid hsl(var(--brk-border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [formatCompact(value), semantic.labelFor(valueField)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RPieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
