import * as React from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TableSchema } from "@/query/schema";
import { cn } from "@/lib/utils";

export interface SchemaPageProps {
  schema: TableSchema[];
  /** page/data-source label shown in the heading, e.g. "Schema: main" */
  label?: string;
  onBack?: () => void;
  className?: string;
}

/**
 * A dedicated schema reference page \u2014 every table, every column, its
 * type, filterable by table or column name. Meant to fill the same role
 * as a Rails bi_report-style "Schema" page: something to check while
 * writing a query, not a summary dialog.
 */
export function SchemaPage({ schema, label = "Schema", onBack, className }: SchemaPageProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schema;
    return schema
      .map((table) => {
        const tableMatches = table.name.toLowerCase().includes(q);
        const columns = tableMatches ? table.columns : table.columns.filter((c) => c.name.toLowerCase().includes(q));
        return { ...table, columns };
      })
      .filter((table) => table.columns.length > 0);
  }, [schema, search]);

  return (
    <div className={cn("brk-flex brk-flex-col brk-gap-5", className)}>
      {onBack && (
        <button
          onClick={onBack}
          className="brk-flex brk-w-fit brk-items-center brk-gap-1 brk-text-sm brk-text-muted-foreground hover:brk-text-foreground"
        >
          <ArrowLeft className="brk-h-3.5 brk-w-3.5" /> Back
        </button>
      )}

      <h2 className="brk-text-xl brk-font-semibold brk-tracking-tight">{label}</h2>

      <div className="brk-relative brk-max-w-md">
        <Search className="brk-pointer-events-none brk-absolute brk-left-2.5 brk-top-1/2 brk-h-3.5 brk-w-3.5 brk--translate-y-1/2 brk-text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Start typing a table or column"
          className="brk-pl-8"
          autoFocus
        />
      </div>

      <div className="brk-flex brk-flex-col brk-gap-6">
        {filtered.map((table) => (
          <div key={table.name}>
            <h3 className="brk-mb-1 brk-border-b brk-border-border brk-pb-2 brk-text-base brk-font-semibold">
              {table.name}
            </h3>
            <div>
              {table.columns.map((col) => (
                <div
                  key={col.name}
                  className="brk-flex brk-items-center brk-justify-between brk-gap-4 brk-border-b brk-border-border/60 brk-py-2 brk-text-sm last:brk-border-b-0"
                >
                  <span>{col.name}</span>
                  <span className="brk-text-muted-foreground">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="brk-text-sm brk-text-muted-foreground">No matches.</p>}
      </div>
    </div>
  );
}
