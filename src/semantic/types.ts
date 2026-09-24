import type { AggregationFn } from "../query/types";

export type FieldType = "string" | "number" | "boolean" | "date" | "datetime";

export interface DimensionDef {
  name: string;
  label: string;
  type: FieldType;
  /** column/field name in your underlying source, if different from `name` */
  source?: string;
  description?: string;
}

export interface MetricDef {
  name: string;
  label: string;
  agg: AggregationFn;
  /** column/field name being aggregated, if different from `name` */
  source?: string;
  format?: "number" | "currency" | "percent" | "compact";
  description?: string;
  /** a metric can be defined in terms of other metrics, e.g. "avg_order_value" = revenue / order_count */
  derivedFrom?: { metrics: string[]; compute: (values: Record<string, number>) => number };
}

export interface ModelDef {
  name: string;
  label: string;
  /** logical source identifier your backend understands, e.g. a table or API resource name */
  source: string;
  dimensions: DimensionDef[];
  metrics: MetricDef[];
}
