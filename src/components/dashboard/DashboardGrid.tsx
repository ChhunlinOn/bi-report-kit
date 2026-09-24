import * as React from "react";
import { X, ChevronUp, ChevronDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { AreaChart } from "@/components/charts/AreaChart";
import { PieChart } from "@/components/charts/PieChart";
import { KpiCard } from "@/components/charts/KpiCard";
import { DataTable } from "@/components/charts/DataTable";
import type { WidgetConfig, GlobalFilterState } from "./types";
import type { QueryDefinition } from "@/query/types";
import { cn } from "@/lib/utils";

export interface DashboardGridProps {
  widgets: WidgetConfig[];
  globalFilters: GlobalFilterState;
  editable?: boolean;
  onChange?: (widgets: WidgetConfig[]) => void;
}

function buildQuery(widget: WidgetConfig, global: GlobalFilterState): QueryDefinition {
  return {
    metrics: widget.metrics,
    dimensions: widget.dimension ? [widget.dimension] : undefined,
    filters: [...(global.filters ?? []), ...(widget.filters ?? [])],
    dateRange: global.dateRange,
  };
}

function renderWidget(widget: WidgetConfig, query: QueryDefinition) {
  switch (widget.type) {
    case "bar":
      return <BarChart title={widget.title} description={widget.description} query={query} xField={widget.dimension!} series={widget.metrics} />;
    case "line":
      return <LineChart title={widget.title} description={widget.description} query={query} xField={widget.dimension!} series={widget.metrics} />;
    case "area":
      return <AreaChart title={widget.title} description={widget.description} query={query} xField={widget.dimension!} series={widget.metrics} />;
    case "pie":
      return (
        <PieChart
          title={widget.title}
          description={widget.description}
          query={query}
          nameField={widget.dimension!}
          valueField={widget.metrics[0]}
        />
      );
    case "kpi":
      return <KpiCard title={widget.title} query={query} field={widget.metrics[0]} />;
    case "table":
      return <DataTable title={widget.title} description={widget.description} query={query} />;
  }
}

/**
 * A 12-column CSS grid of widgets, driven entirely by data (WidgetConfig[])
 * so a dashboard layout can be persisted as JSON \u2014 stored in your own DB,
 * loaded per-user/per-team, versioned, whatever your app needs. In edit
 * mode, widgets get inline controls to resize, reorder and remove; there is
 * no drag-and-drop dependency by design, to keep the package's own bundle
 * small \u2014 wire in a DnD library at the app level if you want that.
 */
export function DashboardGrid({ widgets, globalFilters, editable, onChange }: DashboardGridProps) {
  function updateWidget(id: string, patch: Partial<WidgetConfig>) {
    onChange?.(widgets.map((w) => (w.id === id ? { ...w, ...patch, layout: { ...w.layout, ...patch.layout } } : w)));
  }

  function removeWidget(id: string) {
    onChange?.(widgets.filter((w) => w.id !== id));
  }

  function moveWidget(id: string, dir: -1 | 1) {
    const idx = widgets.findIndex((w) => w.id === id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= widgets.length) return;
    const next = [...widgets];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    onChange?.(next);
  }

  return (
    <div className="brk-grid brk-grid-cols-12 brk-gap-4">
      {widgets.map((widget, i) => (
        <div
          key={widget.id}
          className="brk-relative"
          style={{
            gridColumn: `span ${Math.min(12, widget.layout.w)} / span ${Math.min(12, widget.layout.w)}`,
            minHeight: widget.layout.h * 80,
          }}
        >
          {editable && (
            <div className="brk-absolute brk-right-2 brk-top-2 brk-z-10 brk-flex brk-items-center brk-gap-1 brk-rounded-md brk-border brk-border-border brk-bg-card/90 brk-p-0.5 brk-shadow-sm brk-backdrop-blur">
              <Button size="icon" variant="ghost" className="brk-h-6 brk-w-6" onClick={() => moveWidget(widget.id, -1)} disabled={i === 0} title="Move left/up">
                <ChevronUp className="brk-h-3.5 brk-w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="brk-h-6 brk-w-6" onClick={() => moveWidget(widget.id, 1)} disabled={i === widgets.length - 1} title="Move right/down">
                <ChevronDown className="brk-h-3.5 brk-w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="brk-h-6 brk-w-6" onClick={() => updateWidget(widget.id, { layout: { w: Math.max(3, widget.layout.w - 3), h: widget.layout.h } })} title="Narrower">
                <Minus className="brk-h-3.5 brk-w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="brk-h-6 brk-w-6" onClick={() => updateWidget(widget.id, { layout: { w: Math.min(12, widget.layout.w + 3), h: widget.layout.h } })} title="Wider">
                <Plus className="brk-h-3.5 brk-w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="brk-h-6 brk-w-6 brk-text-destructive" onClick={() => removeWidget(widget.id)} title="Remove">
                <X className="brk-h-3.5 brk-w-3.5" />
              </Button>
            </div>
          )}
          <div className={cn("brk-h-full", editable && "brk-ring-1 brk-ring-transparent hover:brk-ring-border brk-rounded-lg")}>
            {renderWidget(widget, buildQuery(widget, globalFilters))}
          </div>
        </div>
      ))}
      {widgets.length === 0 && (
        <div className="brk-col-span-12 brk-flex brk-h-40 brk-items-center brk-justify-center brk-rounded-lg brk-border brk-border-dashed brk-border-border brk-text-sm brk-text-muted-foreground">
          No widgets yet. Add one to get started.
        </div>
      )}
    </div>
  );
}
