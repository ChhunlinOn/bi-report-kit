import type { DataSourceAdapter, QueryDefinition, QueryResult } from "../types";

export interface RestAdapterOptions {
  /** e.g. "/api/bi/query" \u2014 your Next.js/Rails/whatever endpoint */
  endpoint: string;
  /** merged into fetch() headers on every request */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** override fetch, e.g. to inject auth, retries, or use a custom client */
  fetchImpl?: typeof fetch;
  name?: string;
}

/**
 * The simplest, most common adapter: POSTs the QueryDefinition as JSON to a
 * single endpoint on your own server, and expects back `{ rows: [...] }`.
 * Your server resolves metric/dimension names against your semantic layer
 * (or just against a SQL query builder) and returns rows \u2014 the client
 * never sees a connection string or credentials.
 */
export function createRestAdapter(options: RestAdapterOptions): DataSourceAdapter {
  const { endpoint, headers, fetchImpl = fetch, name = "rest" } = options;

  return {
    name,
    async run(query: QueryDefinition): Promise<QueryResult> {
      const resolvedHeaders = typeof headers === "function" ? headers() : headers ?? {};

      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...resolvedHeaders },
        body: JSON.stringify(query),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`bi-report-kit: query failed (${res.status}) ${text}`.trim());
      }

      const data = (await res.json()) as QueryResult;
      if (!Array.isArray(data.rows)) {
        throw new Error("bi-report-kit: adapter response missing `rows` array");
      }
      return data;
    },
  };
}
