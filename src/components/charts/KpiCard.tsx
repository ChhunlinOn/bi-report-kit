import * as React from "react";
import { ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@/hooks/useQuery";
import { useBiContext } from "@/components/dashboard/BiProvider";
import type { QueryDefinition } from "@/query/types";
import { cn, formatCompact, formatPercent } from "@/lib/utils";

export interface KpiCardProps {
  title: string;
  /** query returning one row with the metric to headline */
  query: QueryDefinition;
  /** the metric field within that row to display */
  field: string;
  /** optional prior-period query, for a "+12% vs last period" delta */
  compareQuery?: QueryDefinition;
  className?: string;
  /** true if a rising value is bad (e.g. churn, error rate) \u2014 flips delta coloring */
  invertDeltaColor?: boolean;
}

export function KpiCard({ title, query, field, compareQuery, className, invertDeltaColor }: KpiCardProps) {
  const { semantic } = useBiContext();
  const current = useQuery(query);
  const previous = useQuery(compareQuery ?? null);

  const isLoading = current.isLoading || (!!compareQuery && previous.isLoading);
  const error = current.error ?? previous.error;

  const currentValue = current.data?.rows[0]?.[field];
  const previousValue = previous.data?.rows[0]?.[field];

  const format = semantic.formatFor(field);
  const display = (v: unknown) => {
    const n = Number(v ?? 0);
    if (format === "currency") return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    if (format === "percent") return formatPercent(n);
    return formatCompact(n);
  };

  let delta: number | null = null;
  if (typeof currentValue === "number" && typeof previousValue === "number" && previousValue !== 0) {
    delta = (currentValue - previousValue) / Math.abs(previousValue);
  }

  const isGoodDelta = delta !== null ? (invertDeltaColor ? delta < 0 : delta > 0) : null;

  return (
    <Card className={cn("brk-h-full", className)}>
      <CardContent className="brk-flex brk-h-full brk-flex-col brk-justify-between brk-gap-2 brk-p-4">
        <span className="brk-text-sm brk-font-medium brk-text-muted-foreground">{title}</span>

        {isLoading && <Loader2 className="brk-h-4 brk-w-4 brk-animate-spin brk-text-muted-foreground" />}
        {error && !isLoading && (
          <span className="brk-flex brk-items-center brk-gap-1 brk-text-xs brk-text-destructive">
            <AlertTriangle className="brk-h-3.5 brk-w-3.5" /> Failed to load
          </span>
        )}

        {!isLoading && !error && (
          <div className="brk-flex brk-items-end brk-justify-between">
            <span className="brk-text-2xl brk-font-semibold brk-tracking-tight">{display(currentValue)}</span>
            {delta !== null && (
              <span
                className={cn(
                  "brk-flex brk-items-center brk-gap-0.5 brk-text-xs brk-font-medium",
                  isGoodDelta ? "brk-text-emerald-600" : "brk-text-destructive"
                )}
              >
                {delta >= 0 ? <ArrowUpRight className="brk-h-3.5 brk-w-3.5" /> : <ArrowDownRight className="brk-h-3.5 brk-w-3.5" />}
                {formatPercent(Math.abs(delta), 0)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
