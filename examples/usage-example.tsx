/**
 * examples/usage-example.tsx
 * -----------------------------------------------------------------------
 * A complete, copy-pasteable example of wiring up bi-report-kit in a
 * Next.js (or plain React) app: define your semantic layer once, point it
 * at your API, then render a dashboard.
 */
"use client";

import {
  BiProvider,
  PermissionProvider,
  SemanticLayer,
  defineModel,
  createRestAdapter,
  DashboardBuilder,
  KpiCard,
  BarChart,
  type DashboardConfig,
} from "bi-report-kit";
import "bi-report-kit/style.css";

// 1. Define your semantic layer: the metrics and dimensions your reports
//    are allowed to ask for, once, in one place \u2014 exactly the role
//    config/reports.yml plays in a Rails bi_report-style gem.
const semantic = new SemanticLayer().register(
  defineModel({
    name: "orders",
    label: "Orders",
    source: "orders", // whatever your backend calls this resource/table
    dimensions: [
      { name: "date", label: "Date", type: "date" },
      { name: "region", label: "Region", type: "string" },
      { name: "channel", label: "Channel", type: "string" },
    ],
    metrics: [
      { name: "revenue", label: "Revenue", agg: "sum", format: "currency" },
      { name: "order_count", label: "Orders", agg: "count" },
      {
        name: "avg_order_value",
        label: "Avg. order value",
        agg: "avg",
        format: "currency",
        derivedFrom: {
          metrics: ["revenue", "order_count"],
          compute: ({ revenue, order_count }) => (order_count ? revenue / order_count : 0),
        },
      },
    ],
  })
);

// 2. Point the query layer at your own API endpoint. Your server resolves
//    { metrics, dimensions, filters, dateRange } against the semantic
//    layer/your DB and returns { rows: [...] } \u2014 see
//    examples/rails_query_controller.rb for a Rails-side implementation of
//    this exact contract.
const adapter = createRestAdapter({
  endpoint: "/api/bi/query",
  headers: () => ({ Authorization: `Bearer ${getCurrentUserToken()}` }),
});

// 3. Describe a starting dashboard layout. In a real app this JSON is
//    normally loaded from your DB per-user/per-team and passed in as a prop.
const dashboard: DashboardConfig = {
  id: "sales-overview",
  title: "Sales overview",
  widgets: [
    { id: "w1", type: "kpi", title: "Revenue", metrics: ["revenue"], layout: { w: 3, h: 2 } },
    { id: "w2", type: "kpi", title: "Orders", metrics: ["order_count"], layout: { w: 3, h: 2 } },
    { id: "w3", type: "kpi", title: "Avg. order value", metrics: ["avg_order_value"], layout: { w: 3, h: 2 } },
    {
      id: "w4",
      type: "bar",
      title: "Revenue by region",
      metrics: ["revenue"],
      dimension: "region",
      layout: { w: 9, h: 4 },
    },
    {
      id: "w5",
      type: "line",
      title: "Revenue over time",
      metrics: ["revenue"],
      dimension: "date",
      layout: { w: 12, h: 4 },
    },
  ],
};

export default function ReportsPage() {
  return (
    // PermissionProvider is optional \u2014 omit it and everything is allowed.
    <PermissionProvider permissions={["dashboard:edit", "export:csv", "export:pdf"]}>
      <BiProvider adapter={adapter} semantic={semantic}>
        <DashboardBuilder
          dashboard={dashboard}
          dateField="date"
          filterableDimensions={["region", "channel"]}
          onSave={async (updated) => {
            await fetch(`/api/bi/dashboards/${updated.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
          }}
        />
      </BiProvider>
    </PermissionProvider>
  );
}

// A single chart/KPI can also be used standalone, outside a full dashboard
// builder \u2014 e.g. embedded in an existing page:
export function RevenueThisMonth() {
  return (
    <BiProvider adapter={adapter} semantic={semantic}>
      <KpiCard
        title="Revenue (this month)"
        field="revenue"
        query={{ metrics: ["revenue"], dateRange: { field: "date", start: "2026-09-01", end: "2026-09-30" } }}
        compareQuery={{ metrics: ["revenue"], dateRange: { field: "date", start: "2026-08-01", end: "2026-08-31" } }}
      />
    </BiProvider>
  );
}

function getCurrentUserToken(): string {
  // wire this to your own auth (NextAuth session, cookie, etc.)
  return "";
}
