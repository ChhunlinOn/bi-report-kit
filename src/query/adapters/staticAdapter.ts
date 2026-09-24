import alasql from "alasql";
import type { AggregationFn, DataSourceAdapter, QueryDefinition, QueryResult, QueryResultRow } from "../types";

function applyFilter(row: QueryResultRow, filter: QueryDefinition["filters"] extends (infer T)[] | undefined ? T : never): boolean {
  const value = row[filter.field];
  switch (filter.operator) {
    case "eq":
      return value === filter.value;
    case "neq":
      return value !== filter.value;
    case "gt":
      return Number(value) > Number(filter.value);
    case "gte":
      return Number(value) >= Number(filter.value);
    case "lt":
      return Number(value) < Number(filter.value);
    case "lte":
      return Number(value) <= Number(filter.value);
    case "in":
      return Array.isArray(filter.value) && filter.value.includes(value as never);
    case "not_in":
      return Array.isArray(filter.value) && !filter.value.includes(value as never);
    case "contains":
      return String(value ?? "").toLowerCase().includes(String(filter.value).toLowerCase());
    case "between": {
      const [min, max] = filter.value as [number, number];
      return Number(value) >= min && Number(value) <= max;
    }
    default:
      return true;
  }
}

function aggregate(values: number[], fn: AggregationFn): number {
  switch (fn) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case "count":
      return values.length;
    case "count_distinct":
      return new Set(values).size;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
  }
}

export interface StaticAdapterOptions {
  name?: string;
  /**
   * How to aggregate each metric field when a query groups by dimensions
   * (mirrors the `agg` you'd set on that metric in your SemanticLayer).
   * Defaults to "sum" for any metric not listed here.
   */
  aggregations?: Record<string, AggregationFn>;
  /**
   * Table name `query.sql` can reference (e.g. "orders" so a user can write
   * `SELECT region, SUM(revenue) FROM orders GROUP BY region`). Only
   * relevant if you use raw-SQL queries against this adapter \u2014 see
   * QueryDefinition.sql. Defaults to "data".
   */
  tableName?: string;
}

/**
 * Serves rows from an in-memory array. Useful for Storybook-style demos,
 * unit tests, or prototyping a dashboard before the real API exists \u2014
 * swap in createRestAdapter later with no changes to your components.
 *
 * Unlike a real backend, this has no database to GROUP BY in, so when a
 * query specifies `dimensions`, this adapter groups the raw rows by those
 * dimension values itself and aggregates each requested metric (sum by
 * default \u2014 pass `aggregations` to match your SemanticLayer's metric
 * `agg` settings, e.g. { order_count: "count" }).
 */
export function createStaticAdapter(rows: QueryResultRow[], options: StaticAdapterOptions | string = {}): DataSourceAdapter {
  const opts: StaticAdapterOptions = typeof options === "string" ? { name: options } : options;
  const { name = "static", aggregations = {}, tableName = "data" } = opts;

  return {
    name,
    async run(query: QueryDefinition): Promise<QueryResult> {
      // Raw-SQL path: run the user's own SQL against the in-memory table
      // via alasql, entirely client-side. This is meant for demos/prototyping
      // (see createRestAdapter for the production path, where your backend
      // executes SQL against the real database with proper access control).
      if (query.sql && query.sql.trim()) {
        alasql.tables[tableName] = { data: rows };
        let result: unknown;
        try {
          result = alasql(query.sql);
        } catch (err) {
          throw new Error(`bi-report-kit: SQL error \u2014 ${(err as Error).message}`);
        }
        const resultRows = Array.isArray(result) ? (result as QueryResultRow[]) : [];
        return { rows: resultRows, totalRows: resultRows.length };
      }

      let result = [...rows];

      for (const filter of query.filters ?? []) {
        result = result.filter((row) => applyFilter(row, filter));
      }

      if (query.dateRange) {
        const { field, start, end } = query.dateRange;
        result = result.filter((row) => {
          const v = String(row[field] ?? "");
          return v >= start && v <= end;
        });
      }

      const totalRows = result.length;

      if (query.dimensions && query.dimensions.length > 0) {
        const groups = new Map<string, QueryResultRow[]>();
        for (const row of result) {
          const key = query.dimensions.map((d) => String(row[d] ?? "")).join("\u0001");
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(row);
        }

        result = [...groups.values()].map((groupRows) => {
          const out: QueryResultRow = {};
          for (const dim of query.dimensions!) out[dim] = groupRows[0][dim];
          for (const metric of query.metrics) {
            const fn = aggregations[metric] ?? "sum";
            const values = groupRows.map((r) => Number(r[metric] ?? 0));
            out[metric] = aggregate(values, fn);
          }
          return out;
        });
      } else if (query.dimensions === undefined && query.metrics.length > 0) {
        // No grouping requested: collapse to a single summary row (e.g. for a KPI card).
        const out: QueryResultRow = {};
        for (const metric of query.metrics) {
          const fn = aggregations[metric] ?? "sum";
          const values = result.map((r) => Number(r[metric] ?? 0));
          out[metric] = aggregate(values, fn);
        }
        result = [out];
      }

      for (const sort of query.sort ?? []) {
        result.sort((a, b) => {
          const av = a[sort.field];
          const bv = b[sort.field];
          if (av === bv) return 0;
          const cmp = (av ?? "") > (bv ?? "") ? 1 : -1;
          return sort.direction === "asc" ? cmp : -cmp;
        });
      }

      if (query.limit) result = result.slice(0, query.limit);

      return { rows: result, totalRows };
    },
  };
}
