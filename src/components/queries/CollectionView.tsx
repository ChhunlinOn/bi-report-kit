import * as React from "react";
import { Loader2, AlertTriangle, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from "@/hooks/useQuery";
import { exportRowsToCSV } from "@/export/exportCSV";
import { usePermission } from "@/permissions/usePermission";
import type { SavedQuery, QueryCollection } from "./types";
import { cn } from "@/lib/utils";

export interface CollectionViewProps {
  collection: QueryCollection;
  /** the full set of saved queries, used to resolve collection.queryIds */
  queries: SavedQuery[];
  className?: string;
}

/**
 * The page a collection's shareable link opens to: every query in the
 * collection, run and shown as a table, one after another \u2014 read-only,
 * no SQL editor. This is what "find many queries from one link" resolves
 * to; wire it up at whatever route reads the `collection` id (see
 * CollectionManager's `getShareUrl`).
 */
export function CollectionView({ collection, queries, className }: CollectionViewProps) {
  const members = collection.queryIds
    .map((id) => queries.find((q) => q.id === id))
    .filter((q): q is SavedQuery => !!q);

  return (
    <div className={cn("brk-flex brk-flex-col brk-gap-4", className)}>
      <div>
        <h2 className="brk-text-lg brk-font-semibold brk-tracking-tight">{collection.name}</h2>
        <p className="brk-text-sm brk-text-muted-foreground">
          {members.length} quer{members.length === 1 ? "y" : "ies"} \u00b7 created by {collection.createdBy}
        </p>
      </div>

      {members.length === 0 && (
        <p className="brk-text-sm brk-text-muted-foreground">This collection has no queries.</p>
      )}

      {members.map((query) => (
        <CollectionQueryResult key={query.id} query={query} />
      ))}
    </div>
  );
}

function CollectionQueryResult({ query }: { query: SavedQuery }) {
  const { data, error, isLoading } = useQuery({ metrics: [], sql: query.sql });
  const canExportCsv = usePermission("export:csv");
  const columns = data?.rows[0] ? Object.keys(data.rows[0]) : [];

  return (
    <Card>
      <CardHeader className="brk-flex-row brk-items-center brk-justify-between brk-space-y-0">
        <CardTitle className="brk-text-foreground brk-text-sm brk-font-semibold">{query.name}</CardTitle>
        {canExportCsv && data && (
          <Button variant="ghost" size="sm" className="brk-h-7 brk-px-2 brk-text-xs" onClick={() => exportRowsToCSV(data.rows, query.name)}>
            <Download className="brk-h-3.5 brk-w-3.5" /> CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="brk-flex brk-items-center brk-gap-2 brk-text-sm brk-text-muted-foreground">
            <Loader2 className="brk-h-4 brk-w-4 brk-animate-spin" /> Running\u2026
          </div>
        )}
        {error && !isLoading && (
          <div className="brk-flex brk-items-center brk-gap-2 brk-text-sm brk-text-destructive">
            <AlertTriangle className="brk-h-4 brk-w-4" /> {error.message}
          </div>
        )}
        {!isLoading && !error && data && (
          <div className="brk-max-h-80 brk-overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c}>{String(row[c] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
