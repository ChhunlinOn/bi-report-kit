import * as React from "react";
import { QueryEngine } from "@/query/QueryEngine";
import type { DataSourceAdapter } from "@/query/types";
import { SemanticLayer } from "@/semantic/SemanticLayer";
import { cn } from "@/lib/utils";

export interface BiContextValue {
  engine: QueryEngine;
  semantic: SemanticLayer;
  adapter: DataSourceAdapter;
}

const BiContext = React.createContext<BiContextValue | null>(null);

export interface BiProviderProps {
  adapter: DataSourceAdapter;
  semantic?: SemanticLayer;
  /** dark mode \u2014 toggles the .brk-dark class within this provider's scope */
  dark?: boolean;
  staleTimeMs?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrap your app (or just the reporting section of it) in <BiProvider>. It
 * owns the query cache and semantic-layer registry so every chart, table
 * and dashboard widget underneath shares one adapter and one cache \u2014
 * exactly like mounting a bi_report engine once in a Rails app.
 */
export function BiProvider({ adapter, semantic, dark, staleTimeMs, children, className }: BiProviderProps) {
  const engineRef = React.useRef<QueryEngine>();
  if (!engineRef.current) engineRef.current = new QueryEngine(adapter, { staleTimeMs });

  React.useEffect(() => {
    engineRef.current!.setAdapter(adapter);
  }, [adapter]);

  const semanticRef = React.useRef<SemanticLayer>(semantic ?? new SemanticLayer());

  const value = React.useMemo<BiContextValue>(
    () => ({ engine: engineRef.current!, semantic: semanticRef.current, adapter }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adapter]
  );

  return (
    <BiContext.Provider value={value}>
      <div className={cn("brk-scope", dark && "brk-dark", className)}>{children}</div>
    </BiContext.Provider>
  );
}

export function useBiContext(): BiContextValue {
  const ctx = React.useContext(BiContext);
  if (!ctx) throw new Error("bi-report-kit: this component must be rendered inside <BiProvider>");
  return ctx;
}
