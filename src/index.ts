// bi-report-kit \u2014 embeddable BI reporting toolkit for React / Next.js
// -----------------------------------------------------------------------
// Import the stylesheet once in your app, e.g. in your root layout:
//   import "bi-report-kit/style.css";

// Providers
export { BiProvider, useBiContext } from "@/components/dashboard/BiProvider";
export { PermissionProvider, usePermissionContext } from "@/permissions/PermissionProvider";

// Query layer
export type {
  QueryDefinition,
  QueryResult,
  QueryResultRow,
  QueryFilter,
  QuerySort,
  FilterOperator,
  AggregationFn,
  DataSourceAdapter,
} from "@/query/types";
export { QueryEngine } from "@/query/QueryEngine";
export { createRestAdapter } from "@/query/adapters/restAdapter";
export type { RestAdapterOptions } from "@/query/adapters/restAdapter";
export { createStaticAdapter } from "@/query/adapters/staticAdapter";
export { createSqlAdapter } from "@/query/adapters/sqlAdapter";
export type { SqlAdapterOptions } from "@/query/adapters/sqlAdapter";
export { inferTableSchema } from "@/query/schema";
export type { TableSchema, ColumnSchema } from "@/query/schema";
export { SchemaPage } from "@/components/queries/SchemaPage";

// Semantic layer
export { SemanticLayer, defineModel } from "@/semantic/SemanticLayer";
export type { ModelDef, MetricDef, DimensionDef, FieldType } from "@/semantic/types";

// Hooks
export { useQuery } from "@/hooks/useQuery";
export type { UseQueryResult } from "@/hooks/useQuery";
export { useManagedQueries } from "@/hooks/useManagedQueries";
export type { UseManagedQueriesOptions, UseManagedQueriesResult } from "@/hooks/useManagedQueries";
export { useManagedCollections } from "@/hooks/useManagedCollections";
export type { UseManagedCollectionsOptions, UseManagedCollectionsResult } from "@/hooks/useManagedCollections";

// Charts
export { ChartCard } from "@/components/charts/ChartCard";
export { BarChart } from "@/components/charts/BarChart";
export { LineChart } from "@/components/charts/LineChart";
export { AreaChart } from "@/components/charts/AreaChart";
export { PieChart } from "@/components/charts/PieChart";
export { KpiCard } from "@/components/charts/KpiCard";
export { DataTable } from "@/components/charts/DataTable";

// Dashboard builder
export { DashboardBuilder } from "@/components/dashboard/DashboardBuilder";
export { DashboardGrid } from "@/components/dashboard/DashboardGrid";
export { FilterBar } from "@/components/dashboard/FilterBar";
export { AddWidgetDialog } from "@/components/dashboard/AddWidgetDialog";
export type {
  DashboardConfig,
  WidgetConfig,
  WidgetType,
  WidgetLayout,
  GlobalFilterState,
} from "@/components/dashboard/types";

// Report browser \u2014 the simpler, bi_report-style "list of named queries" view
export { ReportBrowser } from "@/components/reports/ReportBrowser";
export type { ReportDef, ReportGroup } from "@/components/reports/types";

// Query manager \u2014 index of saved queries (name / created by) + a raw-SQL
// editor for creating new ones. The closest match to bi_report's own UI.
export { QueryManager } from "@/components/queries/QueryManager";
export type { SavedQuery, NewSavedQuery } from "@/components/queries/types";

// Collections \u2014 bundle several saved queries under one shareable link.
export { CollectionManager } from "@/components/queries/CollectionManager";
export { CollectionView } from "@/components/queries/CollectionView";
export type { QueryCollection, NewQueryCollection } from "@/components/queries/types";

// Export
export { exportRowsToCSV, exportDashboardToCSV } from "@/export/exportCSV";
export { exportNodeToPNG } from "@/export/exportPNG";
export { exportNodeToPDF } from "@/export/exportPDF";

// Permissions
export { usePermission, Can } from "@/permissions/usePermission";
export type { Permission, PermissionContextValue } from "@/permissions/types";

// Scheduling
export { createScheduleManager } from "@/scheduling/ScheduleManager";
export type { ScheduleManager } from "@/scheduling/ScheduleManager";
export { ScheduleDialog } from "@/scheduling/ScheduleDialog";
export type { ScheduleConfig, NewScheduleConfig, ScheduleFrequency } from "@/scheduling/types";

// UI primitives (re-exported in case host apps want to build custom widgets
// with the same look as the built-in ones)
export { Button } from "@/components/ui/button";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
export { Badge } from "@/components/ui/badge";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";
export { SqlEditor } from "@/components/ui/sql-editor";
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/ui/select";
export { SearchableSelect } from "@/components/ui/searchable-select";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Utils
export { cn, formatNumber, formatCompact, formatPercent } from "@/lib/utils";

import "./styles/globals.css";
