import * as React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useBiContext } from "./BiProvider";
import type { GlobalFilterState } from "./types";

export interface FilterBarProps {
  value: GlobalFilterState;
  onChange: (next: GlobalFilterState) => void;
  /** the date field used by dateRange, e.g. "date" \u2014 required to show the date picker */
  dateField?: string;
  /** dimension names offered as quick-filter dropdowns, e.g. ["region", "channel"] */
  filterableDimensions?: string[];
}

/**
 * A date range plus a row of dimension-value dropdowns. Values here are
 * merged into every widget's query by <DashboardGrid>, so changing the
 * date range or picking "region = APAC" re-filters the whole dashboard
 * at once \u2014 the same UX as the filter panel in bi_report or Blazer.
 */
export function FilterBar({ value, onChange, dateField, filterableDimensions = [] }: FilterBarProps) {
  const { semantic } = useBiContext();

  function setDate(part: "start" | "end", v: string) {
    if (!dateField) return;
    onChange({
      ...value,
      dateRange: { field: dateField, start: value.dateRange?.start ?? "", end: value.dateRange?.end ?? "", [part]: v },
    });
  }

  function setDimensionFilter(field: string, val: string) {
    const rest = value.filters.filter((f) => f.field !== field);
    onChange({
      ...value,
      filters: val ? [...rest, { field, operator: "eq", value: val }] : rest,
    });
  }

  const hasActiveFilters = value.filters.length > 0 || !!value.dateRange?.start || !!value.dateRange?.end;

  return (
    <div className="brk-flex brk-flex-wrap brk-items-center brk-gap-3 brk-rounded-lg brk-border brk-border-border brk-bg-card brk-p-3">
      {dateField && (
        <div className="brk-flex brk-items-center brk-gap-2">
          <Input type="date" value={value.dateRange?.start ?? ""} onChange={(e) => setDate("start", e.target.value)} className="brk-w-36" />
          <span className="brk-text-xs brk-text-muted-foreground">to</span>
          <Input type="date" value={value.dateRange?.end ?? ""} onChange={(e) => setDate("end", e.target.value)} className="brk-w-36" />
        </div>
      )}

      {filterableDimensions.map((field) => (
        <Select key={field} onValueChange={(v) => setDimensionFilter(field, v === "__all__" ? "" : v)}>
          <SelectTrigger className="brk-w-40">
            <SelectValue placeholder={semantic.labelFor(field)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All {semantic.labelFor(field)}</SelectItem>
            {/* Host app supplies real option values via children override, or wire this
                to your own metadata endpoint \u2014 left generic here since valid values
                depend entirely on your data. */}
          </SelectContent>
        </Select>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ filters: [] })}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
