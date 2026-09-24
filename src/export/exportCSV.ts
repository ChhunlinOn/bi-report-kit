import type { QueryResultRow } from "@/query/types";
import type { WidgetConfig, GlobalFilterState } from "@/components/dashboard/types";
import type { SemanticLayer } from "@/semantic/SemanticLayer";
import type { QueryEngine } from "@/query/QueryEngine";
import { saveFile } from "@/lib/download";

function toCSV(rows: QueryResultRow[], semantic?: SemanticLayer): string {
  if (rows.length === 0) return "";
  const fields = Object.keys(rows[0]);
  const header = fields.map((f) => escapeCsvCell(semantic?.labelFor(f) ?? f));
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(fields.map((f) => escapeCsvCell(String(row[f] ?? ""))).join(","));
  }
  return lines.join("\n");
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Export a single query's rows (e.g. from one chart or table) as a CSV download. */
export function exportRowsToCSV(rows: QueryResultRow[], filename: string, semantic?: SemanticLayer) {
  const csv = toCSV(rows, semantic);
  const finalName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  void saveFile(finalName, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}

/**
 * Export every widget on a dashboard as one CSV per widget, packaged as
 * separate downloads in quick succession. (A single multi-sheet file would
 * need a spreadsheet dependency this package intentionally doesn't ship \u2014
 * if you need one .xlsx with multiple tabs, fetch each widget's rows via
 * useQuery/QueryEngine yourself and hand them to a library like SheetJS.)
 */
export async function exportDashboardToCSV(
  dashboardTitle: string,
  widgets: WidgetConfig[],
  globalFilters: GlobalFilterState,
  semantic: SemanticLayer,
  engine?: QueryEngine
) {
  if (!engine) {
    console.warn("bi-report-kit: exportDashboardToCSV called without a QueryEngine \u2014 nothing to export.");
    return;
  }
  for (const widget of widgets) {
    const query = {
      metrics: widget.metrics,
      dimensions: widget.dimension ? [widget.dimension] : undefined,
      filters: [...(globalFilters.filters ?? []), ...(widget.filters ?? [])],
      dateRange: globalFilters.dateRange,
    };
    const result = await engine.fetch(query);
    exportRowsToCSV(result.rows, `${dashboardTitle} - ${widget.title}`, semantic);
  }
}
