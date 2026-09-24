export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export interface ScheduleConfig {
  id: string;
  dashboardId: string;
  recipients: string[];
  frequency: ScheduleFrequency;
  /** hour of day in 24h format, in `timezone` */
  hour: number;
  /** 0=Sunday..6=Saturday, required when frequency is "weekly" */
  dayOfWeek?: number;
  /** 1..28, required when frequency is "monthly" */
  dayOfMonth?: number;
  timezone: string;
  format: "pdf" | "csv" | "png";
  active: boolean;
}

export type NewScheduleConfig = Omit<ScheduleConfig, "id" | "active">;
