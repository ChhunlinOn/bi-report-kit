import type { ScheduleConfig, NewScheduleConfig } from "./types";

export interface ScheduleManagerOptions {
  /** e.g. "/api/bi/schedules" \u2014 your own backend handles storage + actually sending reports */
  endpoint: string;
  headers?: Record<string, string> | (() => Record<string, string>);
  fetchImpl?: typeof fetch;
}

/**
 * bi-report-kit cannot run cron jobs or send email from the browser, so
 * "scheduling" here is a client for managing schedule *configuration*
 * against your own backend. Your server is responsible for a worker that
 * reads these configs and actually renders + delivers reports on a timer
 * (e.g. a Rails ActiveJob recurring task, a Next.js cron route, Sidekiq,
 * whatever you already run). This mirrors how bi_report-style gems hand
 * scheduled delivery off to the host app's own job runner.
 */
export function createScheduleManager(options: ScheduleManagerOptions) {
  const { endpoint, headers, fetchImpl = fetch } = options;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const resolvedHeaders = typeof headers === "function" ? headers() : headers ?? {};
    const res = await fetchImpl(`${endpoint}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...resolvedHeaders, ...init?.headers },
    });
    if (!res.ok) throw new Error(`bi-report-kit: schedule request failed (${res.status})`);
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    list(dashboardId: string): Promise<ScheduleConfig[]> {
      return request(`?dashboardId=${encodeURIComponent(dashboardId)}`);
    },
    create(config: NewScheduleConfig): Promise<ScheduleConfig> {
      return request("", { method: "POST", body: JSON.stringify(config) });
    },
    update(id: string, patch: Partial<NewScheduleConfig> & { active?: boolean }): Promise<ScheduleConfig> {
      return request(`/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    },
    remove(id: string): Promise<void> {
      return request(`/${id}`, { method: "DELETE" });
    },
  };
}

export type ScheduleManager = ReturnType<typeof createScheduleManager>;
