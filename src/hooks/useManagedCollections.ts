import * as React from "react";
import type { QueryCollection, NewQueryCollection } from "@/components/queries/types";

export interface UseManagedCollectionsOptions {
  /** base endpoint for collection CRUD; defaults to "/api/bi/collections" */
  endpoint?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
}

export interface UseManagedCollectionsResult {
  collections: QueryCollection[];
  isLoading: boolean;
  error: Error | undefined;
  onCreate: (collection: NewQueryCollection) => Promise<void>;
  onUpdate: (id: string, patch: NewQueryCollection) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  refetch: () => void;
}

interface RawRow {
  id: string;
  name: string;
  created_by?: string;
  createdBy?: string;
  query_ids?: string[];
  queryIds?: string[];
  created_at?: string;
  createdAt?: string;
}

function resolveHeaders(headers?: Record<string, string> | (() => Record<string, string>)) {
  return typeof headers === "function" ? headers() : headers ?? {};
}

function mapRow(r: RawRow): QueryCollection {
  return {
    id: r.id,
    name: r.name,
    createdBy: r.created_by ?? r.createdBy ?? "",
    queryIds: r.query_ids ?? r.queryIds ?? [],
    createdAt: r.created_at ?? r.createdAt ?? "",
  };
}

/**
 * Fetch-backed CRUD for collections, talking to the routes
 * createNextRouteHandlers mounts on the server. Spread the result
 * straight into <CollectionManager {...useManagedCollections()} /> \u2014
 * there's no CRUD code left to write in your app.
 */
export function useManagedCollections(options: UseManagedCollectionsOptions = {}): UseManagedCollectionsResult {
  const { endpoint = "/api/bi/collections", headers } = options;
  const [collections, setCollections] = React.useState<QueryCollection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | undefined>();
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(endpoint, { headers: resolveHeaders(headers) })
      .then((res) => {
        if (!res.ok) throw new Error(`bi-report-kit: failed to load collections (${res.status})`);
        return res.json();
      })
      .then((rows: RawRow[]) => {
        if (!cancelled) {
          setCollections(rows.map(mapRow));
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

  async function onCreate(collection: NewQueryCollection) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...resolveHeaders(headers) },
      body: JSON.stringify({ name: collection.name, createdBy: collection.createdBy, queryIds: collection.queryIds }),
    });
    if (!res.ok) throw new Error(`bi-report-kit: failed to create collection (${res.status})`);
    const saved = mapRow(await res.json());
    setCollections((prev) => [...prev, saved]);
  }

  async function onUpdate(id: string, patch: NewQueryCollection) {
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...resolveHeaders(headers) },
      body: JSON.stringify({ name: patch.name, queryIds: patch.queryIds }),
    });
    if (!res.ok) throw new Error(`bi-report-kit: failed to update collection (${res.status})`);
    const updated = mapRow(await res.json());
    setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }

  async function onDelete(id: string) {
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE", headers: resolveHeaders(headers) });
    if (!res.ok && res.status !== 204) throw new Error(`bi-report-kit: failed to delete collection (${res.status})`);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }

  return { collections, isLoading, error, onCreate, onUpdate, onDelete, refetch: () => setReloadToken((t) => t + 1) };
}
