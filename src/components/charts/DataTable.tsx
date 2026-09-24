import * as React from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from "@/hooks/useQuery";
import { useBiContext } from "@/components/dashboard/BiProvider";
import type { QueryDefinition, QueryResultRow } from "@/query/types";
import { cn, formatCompact } from "@/lib/utils";

export interface DataTableProps {
  title?: string;
  description?: string;
  query: QueryDefinition;
  /** which fields to show as columns, in order; defaults to all fields in the first row */
  columns?: string[];
  className?: string;
  pageSize?: number;
}

export function DataTable({ title, description, query, columns, className, pageSize = 10 }: DataTableProps) {
  const { semantic } = useBiContext();
  const { data, error, isLoading } = useQuery(query);
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = React.useState(0);

  const rows = data?.rows ?? [];
  const cols = columns ?? (rows[0] ? Object.keys(rows[0]) : []);

  const sortedRows = React.useMemo(() => {
    if (!sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.field];
      const bv = b[sort.field];
      const cmp = (av ?? 0) > (bv ?? 0) ? 1 : (av ?? 0) < (bv ?? 0) ? -1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pageRows = sortedRows.slice(page * pageSize, page * pageSize + pageSize);

  function toggleSort(field: string) {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, dir: "asc" };
      if (prev.dir === "asc") return { field, dir: "desc" };
      return null;
    });
  }

  function cellValue(row: QueryResultRow, field: string) {
    const v = row[field];
    if (typeof v === "number") return formatCompact(v);
    return String(v ?? "\u2014");
  }

  return (
    <Card className={cn("brk-flex brk-h-full brk-flex-col", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="brk-text-foreground brk-text-sm brk-font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="brk-flex-1">
        {isLoading && <div className="brk-text-sm brk-text-muted-foreground">Loading\u2026</div>}
        {error && !isLoading && <div className="brk-text-sm brk-text-destructive">{error.message}</div>}
        {!isLoading && !error && rows.length === 0 && (
          <div className="brk-text-sm brk-text-muted-foreground">No rows.</div>
        )}
        {!isLoading && !error && rows.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {cols.map((field) => (
                    <TableHead
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="brk-cursor-pointer brk-select-none"
                    >
                      <span className="brk-inline-flex brk-items-center brk-gap-1">
                        {semantic.labelFor(field)}
                        {sort?.field === field ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="brk-h-3 brk-w-3" />
                          ) : (
                            <ArrowDown className="brk-h-3 brk-w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="brk-h-3 brk-w-3 brk-opacity-40" />
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row, i) => (
                  <TableRow key={i}>
                    {cols.map((field) => (
                      <TableCell key={field}>{cellValue(row, field)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pageCount > 1 && (
              <div className="brk-mt-2 brk-flex brk-items-center brk-justify-between brk-text-xs brk-text-muted-foreground">
                <span>
                  Page {page + 1} of {pageCount}
                </span>
                <div className="brk-flex brk-gap-2">
                  <button
                    className="brk-underline disabled:brk-opacity-40"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="brk-underline disabled:brk-opacity-40"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
