import type { DataSourceAdapter, QueryDefinition, QueryResult } from "./types";

type Listener = () => void;

interface CacheEntry {
  result?: QueryResult;
  error?: Error;
  promise?: Promise<QueryResult>;
  updatedAt?: number;
}

export interface QueryEngineOptions {
  /** how long a cached result is served before being refetched in the background, ms */
  staleTimeMs?: number;
}

function keyFor(query: QueryDefinition): string {
  return JSON.stringify(query, Object.keys(query).sort());
}

/**
 * A small dependency-free cache/dedupe layer, similar in spirit to
 * react-query but scoped to this package so it has zero peer deps beyond
 * React itself. One QueryEngine is normally shared across a whole dashboard
 * via <DashboardProvider adapter={...} />.
 */
export class QueryEngine {
  private adapter: DataSourceAdapter;
  private cache = new Map<string, CacheEntry>();
  private listeners = new Map<string, Set<Listener>>();
  private staleTimeMs: number;

  constructor(adapter: DataSourceAdapter, options: QueryEngineOptions = {}) {
    this.adapter = adapter;
    this.staleTimeMs = options.staleTimeMs ?? 30_000;
  }

  setAdapter(adapter: DataSourceAdapter) {
    this.adapter = adapter;
    this.cache.clear();
    this.notifyAll();
  }

  getSnapshot(query: QueryDefinition): CacheEntry {
    return this.cache.get(keyFor(query)) ?? {};
  }

  subscribe(query: QueryDefinition, listener: Listener): () => void {
    const key = keyFor(query);
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(listener);
    return () => this.listeners.get(key)?.delete(listener);
  }

  private notify(key: string) {
    this.listeners.get(key)?.forEach((l) => l());
  }

  private notifyAll() {
    this.listeners.forEach((set) => set.forEach((l) => l()));
  }

  invalidate(query?: QueryDefinition) {
    if (query) {
      this.cache.delete(keyFor(query));
      this.notify(keyFor(query));
    } else {
      this.cache.clear();
      this.notifyAll();
    }
  }

  async fetch(query: QueryDefinition, opts: { force?: boolean } = {}): Promise<QueryResult> {
    const key = keyFor(query);
    const existing = this.cache.get(key);

    const isFresh = existing?.updatedAt && Date.now() - existing.updatedAt < this.staleTimeMs;
    if (!opts.force && isFresh && existing?.result) return existing.result;
    if (!opts.force && existing?.promise) return existing.promise;

    const promise = this.adapter
      .run(query)
      .then((result) => {
        this.cache.set(key, { result, updatedAt: Date.now() });
        this.notify(key);
        return result;
      })
      .catch((error: Error) => {
        this.cache.set(key, { error, updatedAt: Date.now() });
        this.notify(key);
        throw error;
      });

    this.cache.set(key, { ...existing, promise });
    return promise;
  }
}
