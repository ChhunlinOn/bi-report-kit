import alasql from "alasql";
import type { DataSourceAdapter, QueryDefinition, QueryResult, QueryResultRow } from "../types";

export interface SqlAdapterOptions {
  name?: string;
}

/**
 * Like createStaticAdapter's raw-SQL path, but for more than one table at
 * once \u2014 register a whole in-memory schema (e.g. { orders, customers,
 * products }) and write SQL against any of them, joins included. Meant for
 * demos/prototyping: this executes client-side via alasql, same caveats as
 * createStaticAdapter's SQL mode apply (see its doc comment).
 *
 * Only QueryDefinition.sql is supported here \u2014 there's no single "rows"
 * array to run the metrics/dimensions/filters path against, so a query
 * without `sql` throws. Use createStaticAdapter for the structured path.
 */
export function createSqlAdapter(tables: Record<string, QueryResultRow[]>, options: SqlAdapterOptions = {}): DataSourceAdapter {
  const { name = "sql" } = options;

  return {
    name,
    async run(query: QueryDefinition): Promise<QueryResult> {
      if (!query.sql || !query.sql.trim()) {
        throw new Error("bi-report-kit: createSqlAdapter only supports raw-SQL queries (set QueryDefinition.sql)");
      }

      for (const [tableName, rows] of Object.entries(tables)) {
        alasql.tables[tableName] = { data: rows };
      }

      let result: unknown;
      try {
        result = alasql(query.sql);
      } catch (err) {
        throw new Error(`bi-report-kit: SQL error \u2014 ${(err as Error).message}`);
      }

      const resultRows = Array.isArray(result) ? (result as QueryResultRow[]) : [];
      return { rows: resultRows, totalRows: resultRows.length };
    },
  };
}
