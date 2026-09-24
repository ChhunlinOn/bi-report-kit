/**
 * The query layer is deliberately backend-agnostic. bi-report-kit never
 * talks to a database directly (that would mean shipping DB credentials to
 * the browser). Instead, you implement a DataSourceAdapter that knows how
 * to turn a QueryDefinition into rows \u2014 by calling your own API, an
 * analytics service, a warehouse query endpoint, whatever you have.
 */

export type AggregationFn = "sum" | "avg" | "count" | "count_distinct" | "min" | "max";

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "between"
  | "contains";

export interface QueryFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface QuerySort {
  field: string;
  direction: "asc" | "desc";
}

/**
 * A QueryDefinition is a declarative description of "what data do I want" \u2014
 * it references semantic-layer metrics/dimensions by name (see src/semantic)
 * rather than raw table/column names, so dashboards stay portable across
 * whatever the underlying schema actually is.
 */
export interface QueryDefinition {
  /** metric names, e.g. ["revenue", "order_count"] \u2014 can be [] when `sql` is set */
  metrics: string[];
  /** dimension names to group by, e.g. ["date", "region"] */
  dimensions?: string[];
  filters?: QueryFilter[];
  sort?: QuerySort[];
  limit?: number;
  /** ISO date range shorthand, translated by the adapter/semantic layer */
  dateRange?: { field: string; start: string; end: string };
  /**
   * Raw SQL for ad-hoc queries a user typed themselves (the bi_report-style
   * "just let me write SQL" flow). When set, adapters execute this directly
   * and ignore metrics/dimensions/filters/sort/limit/dateRange. Adapters
   * that don't support raw SQL should throw a clear error.
   */
  sql?: string;
}

export interface QueryResultRow {
  [key: string]: string | number | boolean | null;
}

export interface QueryResult {
  rows: QueryResultRow[];
  /** total rows available server-side, for pagination \u2014 optional */
  totalRows?: number;
  /** how long the query took server-side, ms \u2014 optional, shown in dev/debug UI */
  durationMs?: number;
}

/**
 * Implement this against your own backend. Two are provided out of the box:
 * `createRestAdapter` (calls a JSON HTTP endpoint) and `staticAdapter`
 * (serves in-memory data, useful for demos/tests).
 */
export interface DataSourceAdapter {
  name: string;
  run(query: QueryDefinition): Promise<QueryResult>;
}
