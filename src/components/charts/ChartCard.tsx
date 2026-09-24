import * as React from "react";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from "@/hooks/useQuery";
import type { QueryDefinition, QueryResultRow } from "@/query/types";
import { cn } from "@/lib/utils";

export interface ChartCardProps {
  title?: string;
  description?: string;
  query: QueryDefinition;
  height?: number;
  className?: string;
  actions?: React.ReactNode;
  children: (rows: QueryResultRow[]) => React.ReactNode;
}

/**
 * Every chart component (BarChart, LineChart, AreaChart, PieChart) is a
 * thin wrapper around <ChartCard>: it runs the query, and hands you back
 * plain rows to render. Loading, error and empty states are handled once,
 * here, so every widget on a dashboard looks and behaves consistently.
 */
export function ChartCard({ title, description, query, height = 280, className, actions, children }: ChartCardProps) {
  const { data, error, isLoading } = useQuery(query);

  return (
    <Card className={cn("brk-flex brk-h-full brk-flex-col", className)}>
      {title && (
        <CardHeader className="brk-flex-row brk-items-start brk-justify-between brk-space-y-0">
          <div>
            <CardTitle className="brk-text-foreground brk-text-sm brk-font-semibold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent className="brk-flex-1">
        <div style={{ height }} className="brk-w-full">
          {isLoading && (
            <div className="brk-flex brk-h-full brk-items-center brk-justify-center brk-gap-2 brk-text-sm brk-text-muted-foreground">
              <Loader2 className="brk-h-4 brk-w-4 brk-animate-spin" />
              Loading\u2026
            </div>
          )}
          {error && !isLoading && (
            <div className="brk-flex brk-h-full brk-flex-col brk-items-center brk-justify-center brk-gap-2 brk-text-center brk-text-sm brk-text-destructive">
              <AlertTriangle className="brk-h-5 brk-w-5" />
              <span>{error.message || "Couldn\u2019t load this report."}</span>
            </div>
          )}
          {!isLoading && !error && (!data || data.rows.length === 0) && (
            <div className="brk-flex brk-h-full brk-flex-col brk-items-center brk-justify-center brk-gap-2 brk-text-sm brk-text-muted-foreground">
              <Inbox className="brk-h-5 brk-w-5" />
              <span>No data for this range.</span>
            </div>
          )}
          {!isLoading && !error && data && data.rows.length > 0 && children(data.rows)}
        </div>
      </CardContent>
    </Card>
  );
}
