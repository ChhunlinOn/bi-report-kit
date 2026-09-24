import * as React from "react";
import { Pencil, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./FilterBar";
import { DashboardGrid } from "./DashboardGrid";
import { AddWidgetDialog } from "./AddWidgetDialog";
import type { DashboardConfig, GlobalFilterState } from "./types";
import { usePermission } from "@/permissions/usePermission";
import { exportDashboardToCSV } from "@/export/exportCSV";
import { useBiContext } from "./BiProvider";

export interface DashboardBuilderProps {
  dashboard: DashboardConfig;
  onSave?: (dashboard: DashboardConfig) => void | Promise<void>;
  dateField?: string;
  filterableDimensions?: string[];
  /** disables the edit/add/remove UI regardless of permissions \u2014 view-only embed */
  readOnly?: boolean;
}

/**
 * The full dashboard experience: filter bar, widget grid, add/edit/remove
 * (gated by the "dashboard:edit" permission \u2014 see src/permissions), and a
 * "Save layout" action that hands the updated DashboardConfig back to your
 * app to persist however you like (your own DB, an API call, etc).
 */
export function DashboardBuilder({ dashboard, onSave, dateField, filterableDimensions, readOnly }: DashboardBuilderProps) {
  const { semantic, engine } = useBiContext();
  const canEdit = usePermission("dashboard:edit") && !readOnly;

  const [widgets, setWidgets] = React.useState(dashboard.widgets);
  const [globalFilters, setGlobalFilters] = React.useState<GlobalFilterState>({ filters: [] });
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave?.({ ...dashboard, widgets });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="brk-flex brk-flex-col brk-gap-4">
      <div className="brk-flex brk-items-center brk-justify-between brk-gap-2">
        <h2 className="brk-text-lg brk-font-semibold brk-tracking-tight">{dashboard.title}</h2>
        <div className="brk-flex brk-items-center brk-gap-2">
          <Button variant="outline" size="sm" onClick={() => exportDashboardToCSV(dashboard.title, widgets, globalFilters, semantic, engine)}>
            <Download className="brk-h-4 brk-w-4" /> Export CSV
          </Button>
          {canEdit && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="brk-h-4 brk-w-4" /> Edit
            </Button>
          )}
          {canEdit && editing && (
            <>
              <AddWidgetDialog onAdd={(w) => setWidgets((prev) => [...prev, w])} />
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Check className="brk-h-4 brk-w-4" /> {saving ? "Saving\u2026" : "Save layout"}
              </Button>
            </>
          )}
        </div>
      </div>

      <FilterBar
        value={globalFilters}
        onChange={setGlobalFilters}
        dateField={dateField}
        filterableDimensions={filterableDimensions}
      />

      <DashboardGrid widgets={widgets} globalFilters={globalFilters} editable={editing} onChange={setWidgets} />
    </div>
  );
}
