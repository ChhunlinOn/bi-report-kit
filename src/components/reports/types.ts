import type { QueryDefinition } from "@/query/types";

/**
 * A ReportDef is exactly what a bi_report-style Rails gem calls a
 * "report": a name, and a query behind it. No layout, no chart type
 * decisions \u2014 just "here's a saved query, give it a name."
 */
export interface ReportDef {
  /** unique, used as the list key and URL-safe id */
  name: string;
  /** shown in the list */
  label: string;
  /** shown under the label in the list and above the results */
  description?: string;
  query: QueryDefinition;
  /** optional grouping field for the results table's row order/labels */
  dimension?: string;
}

export interface ReportGroup {
  label: string;
  reports: ReportDef[];
}
