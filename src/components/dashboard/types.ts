import type { QueryFilter } from "@/query/types";

export type WidgetType = "bar" | "line" | "area" | "pie" | "kpi" | "table";

export interface WidgetLayout {
  /** grid columns spanned, out of a 12-column grid */
  w: number;
  /** grid rows spanned, in row-height units */
  h: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  layout: WidgetLayout;
  /** metric field(s) this widget visualizes */
  metrics: string[];
  /** dimension field used for x-axis / grouping / table columns, where applicable */
  dimension?: string;
  /** per-widget filters, merged with dashboard-level global filters */
  filters?: QueryFilter[];
}

export interface DashboardConfig {
  id: string;
  title: string;
  widgets: WidgetConfig[];
}

export interface GlobalFilterState {
  dateRange?: { field: string; start: string; end: string };
  filters: QueryFilter[];
}
