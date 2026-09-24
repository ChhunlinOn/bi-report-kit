import * as React from "react";
import { Plus, Play, Trash2, ArrowLeft, Loader2, AlertTriangle, Download, Image as ImageIcon, FileText, Copy, Database, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SqlEditor } from "@/components/ui/sql-editor";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from "@/hooks/useQuery";
import { usePermission } from "@/permissions/usePermission";
import { exportRowsToCSV } from "@/export/exportCSV";
import { exportNodeToPNG } from "@/export/exportPNG";
import { exportNodeToPDF } from "@/export/exportPDF";
import { SchemaPage } from "./SchemaPage";
import type { SavedQuery, NewSavedQuery } from "./types";
import type { TableSchema } from "@/query/schema";
import { cn } from "@/lib/utils";

export interface QueryManagerProps {
  /** saved queries to list on the index page */
  queries: SavedQuery[];
  /** called when the user saves a brand-new query (from the "New query" screen only) */
  onCreate: (query: NewSavedQuery) => void | Promise<void>;
  /** called when saving edits to an existing, already-saved query */
  onUpdate?: (id: string, query: NewSavedQuery) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  /** pre-fills "Created by" on new queries; defaults to "you" */
  currentUser?: string;
  /**
   * If set (matching an id in `queries`), opens straight to that query's
   * editor instead of the index \u2014 read once at mount, so pass a fresh
   * value (or remount via `key`) each time you navigate here, e.g. from a
   * query link inside a CollectionManager's detail view.
   */
  initialOpenQueryId?: string;
  /**
   * Table/column reference shown via the editor's Schema button and used
   * to populate the "preview a table" picker. Omit to hide both \u2014 see
   * inferTableSchema for a best-effort version against in-memory demo data.
   */
  schema?: TableSchema[];
  className?: string;
}

type View = { mode: "list" } | { mode: "editor"; query: SavedQuery | null; forkFrom?: SavedQuery };

/**
 * The bi_report-style flow: an index page listing saved queries by name
 * and who created them, and a "New query" form where the user just types
 * SQL \u2014 no metric picker, no chart type, no layout. Click a row to
 * re-run and edit it.
 */
export function QueryManager({
  queries,
  onCreate,
  onUpdate,
  onDelete,
  currentUser = "you",
  initialOpenQueryId,
  schema,
  className,
}: QueryManagerProps) {
  const [view, setView] = React.useState<View>(() => {
    const match = initialOpenQueryId ? queries.find((q) => q.id === initialOpenQueryId) : undefined;
    return match ? { mode: "editor", query: match } : { mode: "list" };
  });
  const [search, setSearch] = React.useState("");
  const canCreate = usePermission("query:create");

  const filteredQueries = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queries;
    return queries.filter((query) => query.name.toLowerCase().includes(q));
  }, [queries, search]);

  if (view.mode === "editor") {
    return (
      <QueryEditor
        initial={view.query}
        forkFrom={view.forkFrom}
        currentUser={currentUser}
        readOnly={!canCreate}
        schema={schema}
        onBack={() => setView({ mode: "list" })}
        onFork={(source) => setView({ mode: "editor", query: null, forkFrom: source })}
        onSave={async (q) => {
          if (view.query) {
            await onUpdate?.(view.query.id, q);
          } else {
            await onCreate(q);
          }
          setView({ mode: "list" });
        }}
      />
    );
  }

  return (
    <div className={cn("brk-flex brk-flex-col brk-gap-3", className)}>
      <div className="brk-flex brk-items-center brk-justify-between brk-gap-2">
        <h2 className="brk-text-lg brk-font-semibold brk-tracking-tight">Queries</h2>
        {canCreate && (
          <Button size="sm" onClick={() => setView({ mode: "editor", query: null })}>
            <Plus className="brk-h-4 brk-w-4" /> New query
          </Button>
        )}
      </div>

      <div className="brk-relative brk-max-w-sm">
        <Search className="brk-pointer-events-none brk-absolute brk-left-2.5 brk-top-1/2 brk-h-3.5 brk-w-3.5 brk--translate-y-1/2 brk-text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search queries\u2026"
          className="brk-pl-8"
        />
      </div>

      <div className="brk-overflow-hidden brk-rounded-lg brk-border brk-border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created by</TableHead>
              {onDelete && canCreate && <TableHead className="brk-w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueries.map((q) => (
              <TableRow key={q.id} className="brk-cursor-pointer" onClick={() => setView({ mode: "editor", query: q })}>
                <TableCell className="brk-font-medium">{q.name}</TableCell>
                <TableCell className="brk-text-muted-foreground">{q.createdBy}</TableCell>
                {onDelete && canCreate && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="brk-h-7 brk-w-7 brk-text-destructive"
                      onClick={() => onDelete(q.id)}
                    >
                      <Trash2 className="brk-h-3.5 brk-w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredQueries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="brk-py-8 brk-text-center brk-text-muted-foreground">
                  {queries.length === 0 ? "No queries yet." : "No queries match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface QueryEditorProps {
  initial: SavedQuery | null;
  /** when set, this is a brand-new (unsaved) query pre-filled from an existing one via Fork */
  forkFrom?: SavedQuery;
  currentUser: string;
  readOnly: boolean;
  schema?: TableSchema[];
  onBack: () => void;
  onFork: (source: SavedQuery) => void;
  onSave: (query: NewSavedQuery) => Promise<void>;
}

function QueryEditor({ initial, forkFrom, currentUser, readOnly, schema, onBack, onFork, onSave }: QueryEditorProps) {
  const source = initial ?? forkFrom;
  const [name, setName] = React.useState(forkFrom ? `Copy of ${forkFrom.name}` : initial?.name ?? "");
  const [sql, setSql] = React.useState(source?.sql ?? "");
  const [ranSql, setRanSql] = React.useState<string | null>(source?.sql ?? null);
  const [saving, setSaving] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const [showSchema, setShowSchema] = React.useState(false);

  const canCreate = usePermission("query:create");
  const canExportCsv = usePermission("export:csv");
  const canExportPng = usePermission("export:png");
  const canExportPdf = usePermission("export:pdf");

  const { data, error, isLoading } = useQuery(ranSql ? { metrics: [], sql: ranSql } : null);
  const columns = data?.rows[0] ? Object.keys(data.rows[0]) : [];
  const exportName = name.trim() || "query-result";

  function previewTable(tableName: string) {
    const previewSql = `SELECT * FROM "${tableName}" LIMIT 10`;
    setSql(previewSql);
    setRanSql(previewSql);
  }

  async function handleSave() {
    if (!name.trim() || !sql.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), sql: sql.trim(), createdBy: initial?.createdBy ?? currentUser });
    } finally {
      setSaving(false);
    }
  }

  if (showSchema) {
    return <SchemaPage schema={schema ?? []} onBack={() => setShowSchema(false)} />;
  }

  return (
    <div className="brk-flex brk-flex-col brk-gap-4">
      <button
        onClick={onBack}
        className="brk-flex brk-w-fit brk-items-center brk-gap-1 brk-text-sm brk-text-muted-foreground hover:brk-text-foreground"
      >
        <ArrowLeft className="brk-h-3.5 brk-w-3.5" /> Back to queries
      </button>

      {forkFrom && (
        <p className="brk-text-xs brk-text-muted-foreground">
          Forked from <span className="brk-font-medium brk-text-foreground">{forkFrom.name}</span> \u2014 saving this won\u2019t change the original.
        </p>
      )}

      <div className="brk-flex brk-flex-col brk-gap-1">
        <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Revenue by region"
          disabled={readOnly}
          className="brk-max-w-md"
        />
      </div>

      <div className="brk-flex brk-flex-col brk-gap-1">
        <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">SQL</label>
        <SqlEditor
          value={sql}
          onChange={setSql}
          disabled={readOnly}
          placeholder="SELECT region, SUM(revenue) AS revenue FROM orders GROUP BY region"
        />
      </div>

      <div className="brk-flex brk-items-center brk-justify-between brk-gap-2">
        {schema && schema.length > 0 ? (
          <SearchableSelect
            options={schema.map((t) => t.name)}
            onSelect={previewTable}
            placeholder="Preview table"
            searchPlaceholder="Search tables\u2026"
            className="brk-w-48"
          />
        ) : (
          <span />
        )}

        <div className="brk-flex brk-items-center brk-gap-2">
          <Button size="sm" onClick={() => setRanSql(sql)} disabled={!sql.trim()}>
            <Play className="brk-h-4 brk-w-4" /> Run
          </Button>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving || !name.trim() || !sql.trim()}>
              {saving ? "Saving\u2026" : initial ? "Save changes" : "Save query"}
            </Button>
          )}
          {!readOnly && canCreate && initial && (
            <Button size="sm" variant="ghost" onClick={() => onFork(initial)}>
              <Copy className="brk-h-4 brk-w-4" /> Fork
            </Button>
          )}
          {schema && schema.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setShowSchema(true)}>
              <Database className="brk-h-4 brk-w-4" /> Schema
            </Button>
          )}
        </div>
      </div>

      {ranSql && (
        <div className="brk-rounded-lg brk-border brk-border-border brk-p-3">
          {isLoading && (
            <div className="brk-flex brk-items-center brk-gap-2 brk-text-sm brk-text-muted-foreground">
              <Loader2 className="brk-h-4 brk-w-4 brk-animate-spin" /> Running\u2026
            </div>
          )}
          {error && !isLoading && (
            <div className="brk-flex brk-items-start brk-gap-2 brk-text-sm brk-text-destructive">
              <AlertTriangle className="brk-mt-0.5 brk-h-4 brk-w-4 brk-shrink-0" />
              <span className="brk-font-mono">{error.message}</span>
            </div>
          )}
          {!isLoading && !error && data && (
            <>
              <div className="brk-mb-2 brk-flex brk-items-center brk-justify-between brk-gap-2">
                <span className="brk-text-xs brk-text-muted-foreground">
                  {data.rows.length} row{data.rows.length === 1 ? "" : "s"}
                </span>
                <div className="brk-flex brk-items-center brk-gap-1">
                  {canExportCsv && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="brk-h-7 brk-px-2 brk-text-xs"
                      onClick={() => exportRowsToCSV(data.rows, exportName)}
                    >
                      <Download className="brk-h-3.5 brk-w-3.5" /> CSV
                    </Button>
                  )}
                  {canExportPng && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="brk-h-7 brk-px-2 brk-text-xs"
                      onClick={() => resultsRef.current && exportNodeToPNG(resultsRef.current, exportName)}
                    >
                      <ImageIcon className="brk-h-3.5 brk-w-3.5" /> PNG
                    </Button>
                  )}
                  {canExportPdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="brk-h-7 brk-px-2 brk-text-xs"
                      onClick={() => resultsRef.current && exportNodeToPDF(resultsRef.current, exportName)}
                    >
                      <FileText className="brk-h-3.5 brk-w-3.5" /> PDF
                    </Button>
                  )}
                </div>
              </div>
              <div ref={resultsRef} className="brk-max-h-96 brk-overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c}>{c}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((c) => (
                          <TableCell key={c}>{String(row[c] ?? "")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
