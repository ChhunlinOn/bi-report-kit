import * as React from "react";
import { Search, Download, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/charts/DataTable";
import { BarChart } from "@/components/charts/BarChart";
import { useQuery } from "@/hooks/useQuery";
import { useBiContext } from "@/components/dashboard/BiProvider";
import { exportRowsToCSV } from "@/export/exportCSV";
import type { ReportDef, ReportGroup } from "./types";
import { cn } from "@/lib/utils";

export interface ReportBrowserProps {
  /** flat list, or grouped under headings (e.g. "Sales", "Support") */
  reports: ReportDef[] | ReportGroup[];
  /** name of the report to show first; defaults to the first one */
  defaultSelected?: string;
  className?: string;
}

function isGrouped(reports: ReportDef[] | ReportGroup[]): reports is ReportGroup[] {
  return reports.length > 0 && "reports" in reports[0];
}

function flatten(reports: ReportDef[] | ReportGroup[]): ReportDef[] {
  return isGrouped(reports) ? reports.flatMap((g) => g.reports) : reports;
}

/**
 * The bi_report-style view: a plain list of named, pre-built queries on
 * the left, results as a table on the right \u2014 no dashboard grid, no
 * widget editor, no chart-type decisions. Click a name, see the numbers.
 * A "chart" toggle is available per-report for when a trend genuinely
 * helps, but the table is the default so this stays a query browser
 * first and a BI dashboard second.
 */
export function ReportBrowser({ reports, defaultSelected, className }: ReportBrowserProps) {
  const { semantic, engine } = useBiContext();
  const all = React.useMemo(() => flatten(reports), [reports]);
  const groups = isGrouped(reports) ? reports : null;

  const [selectedName, setSelectedName] = React.useState(defaultSelected ?? all[0]?.name);
  const [search, setSearch] = React.useState("");
  const [asChart, setAsChart] = React.useState(false);

  const selected = all.find((r) => r.name === selectedName) ?? all[0];
  const { data } = useQuery(selected ? selected.query : null);

  const filteredGroups = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (r: ReportDef) => !q || r.label.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);

    if (groups) {
      return groups.map((g) => ({ ...g, reports: g.reports.filter(matches) })).filter((g) => g.reports.length > 0);
    }
    return [{ label: "", reports: all.filter(matches) }];
  }, [groups, all, search]);

  if (!selected) {
    return <div className="brk-text-sm brk-text-muted-foreground">No reports configured.</div>;
  }

  const canChart = !!selected.dimension && selected.query.metrics.length > 0;

  return (
    <div className={cn("brk-flex brk-h-full brk-min-h-[480px] brk-gap-0 brk-overflow-hidden brk-rounded-lg brk-border brk-border-border", className)}>
      {/* Report list */}
      <div className="brk-flex brk-w-64 brk-shrink-0 brk-flex-col brk-border-r brk-border-border brk-bg-card">
        <div className="brk-border-b brk-border-border brk-p-2">
          <div className="brk-relative">
            <Search className="brk-pointer-events-none brk-absolute brk-left-2 brk-top-1/2 brk-h-3.5 brk-w-3.5 brk--translate-y-1/2 brk-text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a report\u2026"
              className="brk-h-8 brk-pl-7 brk-text-sm"
            />
          </div>
        </div>
        <nav className="brk-flex-1 brk-overflow-y-auto brk-p-2">
          {filteredGroups.map((group) => (
            <div key={group.label || "_"} className="brk-mb-3">
              {group.label && (
                <div className="brk-px-2 brk-py-1 brk-text-xs brk-font-medium brk-text-muted-foreground">{group.label}</div>
              )}
              {group.reports.map((r) => (
                <button
                  key={r.name}
                  onClick={() => {
                    setSelectedName(r.name);
                    setAsChart(false);
                  }}
                  className={cn(
                    "brk-block brk-w-full brk-rounded-md brk-px-2 brk-py-1.5 brk-text-left brk-text-sm brk-transition-colors",
                    r.name === selected.name
                      ? "brk-bg-primary brk-text-primary-foreground"
                      : "hover:brk-bg-secondary brk-text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          ))}
          {filteredGroups.every((g) => g.reports.length === 0) && (
            <div className="brk-px-2 brk-py-4 brk-text-center brk-text-sm brk-text-muted-foreground">No matches.</div>
          )}
        </nav>
      </div>

      {/* Selected report */}
      <div className="brk-flex brk-flex-1 brk-flex-col brk-bg-background brk-p-4">
        <div className="brk-mb-3 brk-flex brk-items-start brk-justify-between brk-gap-2">
          <div>
            <h3 className="brk-text-base brk-font-semibold">{selected.label}</h3>
            {selected.description && <p className="brk-text-sm brk-text-muted-foreground">{selected.description}</p>}
          </div>
          <div className="brk-flex brk-shrink-0 brk-items-center brk-gap-2">
            {canChart && (
              <Button variant="outline" size="sm" onClick={() => setAsChart((v) => !v)}>
                <BarChart2 className="brk-h-4 brk-w-4" /> {asChart ? "View as table" : "View as chart"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => data && exportRowsToCSV(data.rows, selected.label, semantic)}
              disabled={!data}
            >
              <Download className="brk-h-4 brk-w-4" /> CSV
            </Button>
          </div>
        </div>

        <div className="brk-min-h-0 brk-flex-1">
          {asChart && canChart ? (
            <BarChart
              title=""
              query={selected.query}
              xField={selected.dimension!}
              series={selected.query.metrics}
              height={360}
              className="brk-border-none brk-shadow-none"
            />
          ) : (
            <DataTable title="" query={selected.query} className="brk-h-full brk-border-none brk-shadow-none" />
          )}
        </div>
      </div>
    </div>
  );
}
