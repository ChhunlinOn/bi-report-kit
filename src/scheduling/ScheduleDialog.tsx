import * as React from "react";
import { CalendarClock, Trash2, Loader2 } from "lucide-react";
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
import type { ScheduleManager } from "./ScheduleManager";
import type { ScheduleConfig, ScheduleFrequency } from "./types";

export interface ScheduleDialogProps {
  dashboardId: string;
  manager: ScheduleManager;
}

/**
 * Lets an end user set up "email me this dashboard every Monday at 9am as
 * a PDF" \u2014 writes the config via ScheduleManager. Your backend job runner
 * is what actually renders and sends it on schedule (see ScheduleManager's
 * doc comment).
 */
export function ScheduleDialog({ dashboardId, manager }: ScheduleDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [schedules, setSchedules] = React.useState<ScheduleConfig[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [recipients, setRecipients] = React.useState("");
  const [frequency, setFrequency] = React.useState<ScheduleFrequency>("weekly");
  const [hour, setHour] = React.useState(9);
  const [dayOfWeek, setDayOfWeek] = React.useState(1);
  const [format, setFormat] = React.useState<ScheduleConfig["format"]>("pdf");

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    manager
      .list(dashboardId)
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  }, [open, dashboardId, manager]);

  async function create() {
    const recipientList = recipients
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (recipientList.length === 0) return;

    setSaving(true);
    try {
      const created = await manager.create({
        dashboardId,
        recipients: recipientList,
        frequency,
        hour,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        format,
      });
      setSchedules((prev) => [...prev, created]);
      setRecipients("");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await manager.remove(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="brk-h-4 brk-w-4" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scheduled delivery</DialogTitle>
          <DialogDescription>Send this dashboard by email on a recurring schedule.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="brk-flex brk-items-center brk-gap-2 brk-text-sm brk-text-muted-foreground">
            <Loader2 className="brk-h-4 brk-w-4 brk-animate-spin" /> Loading schedules\u2026
          </div>
        ) : (
          <div className="brk-flex brk-flex-col brk-gap-2">
            {schedules.length === 0 && (
              <p className="brk-text-sm brk-text-muted-foreground">No schedules yet.</p>
            )}
            {schedules.map((s) => (
              <div key={s.id} className="brk-flex brk-items-center brk-justify-between brk-rounded-md brk-border brk-border-border brk-px-3 brk-py-2 brk-text-sm">
                <div>
                  <div className="brk-font-medium">{s.recipients.join(", ")}</div>
                  <div className="brk-text-xs brk-text-muted-foreground">
                    {s.frequency} at {String(s.hour).padStart(2, "0")}:00 \u00b7 {s.format.toUpperCase()}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="brk-h-7 brk-w-7 brk-text-destructive" onClick={() => remove(s.id)}>
                  <Trash2 className="brk-h-3.5 brk-w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="brk-mt-4 brk-flex brk-flex-col brk-gap-3 brk-border-t brk-border-border brk-pt-4">
          <div className="brk-flex brk-flex-col brk-gap-1">
            <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Recipients (comma-separated emails)</label>
            <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="alice@company.com, bob@company.com" />
          </div>

          <div className="brk-grid brk-grid-cols-3 brk-gap-2">
            <div className="brk-flex brk-flex-col brk-gap-1">
              <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Frequency</label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as ScheduleFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === "weekly" && (
              <div className="brk-flex brk-flex-col brk-gap-1">
                <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Day</label>
                <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="brk-flex brk-flex-col brk-gap-1">
              <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Format</label>
              <Select value={format} onValueChange={(v) => setFormat(v as ScheduleConfig["format"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={create} disabled={saving || !recipients.trim()}>
            {saving ? "Adding\u2026" : "Add schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
