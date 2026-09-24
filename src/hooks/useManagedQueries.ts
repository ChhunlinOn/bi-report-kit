import * as React from "react";
import type { SavedQuery, NewSavedQuery } from "@/components/queries/types";

export interface UseManagedQueriesOptions {
  /** base endpoint for saved-query CRUD; defaults to "/api/bi/saved-queries" */
  endpoint?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
}

export interface UseManagedQueriesResult {
  queries: SavedQuery[];
  isLoading: boolean;
  error: Error | undefined;
  onCreate: (query: NewSavedQuery) => Promise<void>;
  onUpdate: (id: string, patch: NewSavedQuery) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  refetch: () => void;
}

interface RawRow {
  id: string;
  name: string;
  sql: string;
  created_by?: string;
  createdBy?: string;
  created_at?: string;
  createdAt?: string;
}

function resolveHeaders(headers?: Record<string, string> | (() => Record<string, string>)) {
  return typeof headers === "function" ? headers() : headers ?? {};
}

function mapRow(r: RawRow): SavedQuery {
  return {
    id: r.id,
    name: r.name,
    sql: r.sql,
    createdBy: r.created_by ?? r.createdBy ?? "",
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
}

/**
 * Fetch-backed CRUD for saved queries, talking to the routes
 * createNextRouteHandlers mounts on the server. Spread the result
 * straight into <QueryManager {...useManagedQueries()} /> \u2014 there's no
 * CRUD code left to write in your app.
 */
export function useManagedQueries(options: UseManagedQueriesOptions = {}): UseManagedQueriesResult {
  const { endpoint = "/api/bi/saved-queries", headers } = options;
  const [queries, setQueries] = React.useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | undefined>();
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(endpoint, { headers: resolveHeaders(headers) })
      .then((res) => {
        if (!res.ok) throw new Error(`bi-report-kit: failed to load queries (${res.status})`);
        return res.json();
      })
      .then((rows: RawRow[]) => {
        if (!cancelled) {
          setQueries(rows.map(mapRow));
          setError(undefined);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, reloadToken]);

  async function onCreate(query: NewSavedQuery) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...resolveHeaders(headers) },
      body: JSON.stringify({ name: query.name, sql: query.sql, createdBy: query.createdBy }),
    });
    if (!res.ok) throw new Error(`bi-report-kit: failed to create query (${res.status})`);
    const saved = mapRow(await res.json());
    setQueries((prev) => [...prev, saved]);
  }

  async function onUpdate(id: string, patch: NewSavedQuery) {
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...resolveHeaders(headers) },
      body: JSON.stringify({ name: patch.name, sql: patch.sql }),
    });
    if (!res.ok) throw new Error(`bi-report-kit: failed to update query (${res.status})`);
    const updated = mapRow(await res.json());
    setQueries((prev) => prev.map((q) => (q.id === id ? updated : q)));
  }

  async function onDelete(id: string) {
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE", headers: resolveHeaders(headers) });
    if (!res.ok && res.status !== 204) throw new Error(`bi-report-kit: failed to delete query (${res.status})`);
    setQueries((prev) => prev.filter((q) => q.id !== id));
  }

  return { queries, isLoading, error, onCreate, onUpdate, onDelete, refetch: () => setReloadToken((t) => t + 1) };
}
