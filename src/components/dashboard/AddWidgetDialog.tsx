import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBiContext } from "./BiProvider";
import type { WidgetConfig, WidgetType } from "./types";

const WIDGET_TYPES: { value: WidgetType; label: string; needsDimension: boolean }[] = [
  { value: "bar", label: "Bar chart", needsDimension: true },
  { value: "line", label: "Line chart", needsDimension: true },
  { value: "area", label: "Area chart", needsDimension: true },
  { value: "pie", label: "Pie chart", needsDimension: true },
  { value: "kpi", label: "KPI number", needsDimension: false },
  { value: "table", label: "Table", needsDimension: false },
];

export interface AddWidgetDialogProps {
  onAdd: (widget: WidgetConfig) => void;
}

export function AddWidgetDialog({ onAdd }: AddWidgetDialogProps) {
  const { semantic } = useBiContext();
  const metrics = semantic.listMetrics();
  const dimensions = semantic.listDimensions();

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<WidgetType>("bar");
  const [metric, setMetric] = React.useState(metrics[0]?.name ?? "");
  const [dimension, setDimension] = React.useState(dimensions[0]?.name ?? "");

  const needsDimension = WIDGET_TYPES.find((t) => t.value === type)?.needsDimension ?? false;

  function submit() {
    if (!title || !metric) return;
    onAdd({
      id: `widget_${Date.now()}`,
      type,
      title,
      metrics: [metric],
      dimension: needsDimension ? dimension : undefined,
      layout: { w: type === "kpi" ? 3 : 6, h: type === "kpi" ? 2 : 4 },
    });
    setTitle("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="brk-h-4 brk-w-4" /> Add widget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a widget</DialogTitle>
          <DialogDescription>Pick a chart type and the metric it should report on.</DialogDescription>
        </DialogHeader>

        <div className="brk-flex brk-flex-col brk-gap-3">
          <div className="brk-flex brk-flex-col brk-gap-1">
            <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Revenue by region" />
          </div>

          <div className="brk-flex brk-flex-col brk-gap-1">
            <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WIDGET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="brk-flex brk-flex-col brk-gap-1">
            <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Metric</label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsDimension && (
            <div className="brk-flex brk-flex-col brk-gap-1">
              <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Group by</label>
              <Select value={dimension} onValueChange={setDimension}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dimensions.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!title || !metric}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
