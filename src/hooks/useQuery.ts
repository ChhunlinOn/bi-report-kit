import * as React from "react";
import { useBiContext } from "@/components/dashboard/BiProvider";
import type { QueryDefinition, QueryResult } from "@/query/types";

export interface UseQueryResult {
  data: QueryResult | undefined;
  error: Error | undefined;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Subscribes to a query through the shared QueryEngine. Multiple widgets
 * asking for the same metrics/dimensions/filters share one network request
 * and one cache entry \u2014 e.g. two charts on the same dashboard filtered to
 * the same date range only hit your API once.
 */
export function useQuery(query: QueryDefinition | null): UseQueryResult {
  const { engine, semantic } = useBiContext();
  const [, forceRender] = React.useReducer((c) => c + 1, 0);

  React.useEffect(() => {
    if (!query) return;
    const unsubscribe = engine.subscribe(query, forceRender);
    engine.fetch(query).catch(() => {
      /* surfaced via snapshot.error below */
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)]);

  if (!query) {
    return { data: undefined, error: undefined, isLoading: false, refetch: () => {} };
  }

  const snapshot = engine.getSnapshot(query);
  const hydrated = snapshot.result
    ? semantic.hydrateDerivedMetrics(snapshot.result, query.metrics)
    : undefined;

  return {
    data: hydrated,
    error: snapshot.error,
    isLoading: !snapshot.result && !snapshot.error,
    refetch: () => {
      engine.fetch(query, { force: true }).catch(() => {});
    },
  };
}
