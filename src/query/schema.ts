import type { QueryResultRow } from "./types";

export interface ColumnSchema {
  name: string;
  /** free-form type label (e.g. "integer", "text", "date", "boolean") \u2014 sources vary, this is descriptive only */
  type: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

/**
 * Best-effort schema from a sample of in-memory rows \u2014 handy for the
 * static/demo adapter, where there's no real database to introspect. For
 * createRestAdapter-backed apps, supply real schema (from your DB's
 * information_schema, an ORM's model definitions, etc.) instead of this.
 */
export function inferTableSchema(rows: QueryResultRow[], tableName: string): TableSchema {
  const sample = rows[0] ?? {};
  const columns: ColumnSchema[] = Object.keys(sample).map((key) => {
    const value = sample[key];
    let type = "text";
    if (typeof value === "number") type = Number.isInteger(value) ? "integer" : "numeric";
    else if (typeof value === "boolean") type = "boolean";
    else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) type = "date";
    return { name: key, type };
  });
  return { name: tableName, columns };
}
