import * as React from "react";
import { Plus, Trash2, ArrowLeft, Link as LinkIcon, Check, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { usePermission } from "@/permissions/usePermission";
import type { SavedQuery, QueryCollection, NewQueryCollection } from "./types";
import { cn } from "@/lib/utils";

export interface CollectionManagerProps {
  collections: QueryCollection[];
  /** the full set of saved queries a collection can be built from */
  queries: SavedQuery[];
  onCreate: (collection: NewQueryCollection) => void | Promise<void>;
  /** called when saving edits to an existing collection */
  onUpdate?: (id: string, collection: NewQueryCollection) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  currentUser?: string;
  /**
   * Builds the shareable URL for a collection id. Defaults to appending
   * `?collection=<id>` to the current page \u2014 pass your own if your app
   * has real routes (e.g. `(id) => \`/reports/collections/${id}\``). Whatever
   * this returns is what CollectionView's host route should read.
   */
  getShareUrl?: (collectionId: string) => string;
  /**
   * Called when the user clicks a query listed inside a collection's
   * detail view \u2014 wire this to navigate to / open that query on its own
   * (e.g. switch your app to the Queries tab and select it there).
   */
  onOpenQuery?: (query: SavedQuery) => void;
  className?: string;
}

type View = { mode: "list" } | { mode: "detail"; collection: QueryCollection } | { mode: "editor"; collection: QueryCollection | null };

function defaultShareUrl(id: string): string {
  if (typeof window === "undefined") return `?collection=${id}`;
  const url = new URL(window.location.href);
  url.searchParams.set("collection", id);
  return url.toString();
}

/**
 * "Add many queries to one link": pick a set of existing saved queries,
 * name the bundle, and get back one URL that opens all of them together
 * (via CollectionView, which reads the same collection + queries data on
 * the receiving end).
 */
export function CollectionManager({
  collections,
  queries,
  onCreate,
  onUpdate,
  onDelete,
  currentUser = "you",
  getShareUrl = defaultShareUrl,
  onOpenQuery,
  className,
}: CollectionManagerProps) {
  const [view, setView] = React.useState<View>({ mode: "list" });
  const [search, setSearch] = React.useState("");
  const canCreate = usePermission("query:create");

  const filteredCollections = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, search]);

  if (view.mode === "editor") {
    return (
      <CollectionEditor
        initial={view.collection}
        queries={queries}
        currentUser={currentUser}
        onBack={() => setView(view.collection ? { mode: "detail", collection: view.collection } : { mode: "list" })}
        onSave={async (c) => {
          if (view.collection) {
            await onUpdate?.(view.collection.id, c);
            setView({ mode: "detail", collection: { ...view.collection, ...c } });
          } else {
            await onCreate(c);
            setView({ mode: "list" });
          }
        }}
      />
    );
  }

  if (view.mode === "detail") {
    return (
      <CollectionDetail
        collection={view.collection}
        queries={queries}
        shareUrl={getShareUrl(view.collection.id)}
        onBack={() => setView({ mode: "list" })}
        onEdit={canCreate ? () => setView({ mode: "editor", collection: view.collection }) : undefined}
        onOpenQuery={onOpenQuery}
      />
    );
  }

  return (
    <div className={cn("brk-flex brk-flex-col brk-gap-3", className)}>
      <div className="brk-flex brk-items-center brk-justify-between brk-gap-2">
        <h2 className="brk-text-lg brk-font-semibold brk-tracking-tight">Collections</h2>
        {canCreate && (
          <Button size="sm" onClick={() => setView({ mode: "editor", collection: null })}>
            <Plus className="brk-h-4 brk-w-4" /> New collection
          </Button>
        )}
      </div>

      <div className="brk-relative brk-max-w-sm">
        <Search className="brk-pointer-events-none brk-absolute brk-left-2.5 brk-top-1/2 brk-h-3.5 brk-w-3.5 brk--translate-y-1/2 brk-text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search collections\u2026"
          className="brk-pl-8"
        />
      </div>

      <div className="brk-overflow-hidden brk-rounded-lg brk-border brk-border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Queries</TableHead>
              <TableHead className="brk-w-40">Link</TableHead>
              {canCreate && <TableHead className="brk-w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCollections.map((c) => (
              <CollectionRow
                key={c.id}
                collection={c}
                shareUrl={getShareUrl(c.id)}
                onOpenDetail={() => setView({ mode: "detail", collection: c })}
                onEdit={canCreate ? () => setView({ mode: "editor", collection: c }) : undefined}
                onDelete={canCreate ? onDelete : undefined}
              />
            ))}
            {filteredCollections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="brk-py-8 brk-text-center brk-text-muted-foreground">
                  {collections.length === 0 ? "No collections yet." : "No collections match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CollectionRow({
  collection,
  shareUrl,
  onOpenDetail,
  onEdit,
  onDelete,
}: {
  collection: QueryCollection;
  shareUrl: string;
  onOpenDetail: () => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  return (
    <TableRow className="brk-cursor-pointer" onClick={onOpenDetail}>
      <TableCell className="brk-font-medium">{collection.name}</TableCell>
      <TableCell className="brk-text-muted-foreground">{collection.createdBy}</TableCell>
      <TableCell className="brk-text-muted-foreground">{collection.queryIds.length}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="brk-h-7 brk-px-2 brk-text-xs" onClick={copyLink}>
          {copied ? <Check className="brk-h-3.5 brk-w-3.5" /> : <LinkIcon className="brk-h-3.5 brk-w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </TableCell>
      {(onEdit || onDelete) && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="brk-flex brk-items-center brk-gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" className="brk-h-7 brk-w-7" onClick={onEdit}>
                <Pencil className="brk-h-3.5 brk-w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="brk-h-7 brk-w-7 brk-text-destructive"
                onClick={() => onDelete(collection.id)}
              >
                <Trash2 className="brk-h-3.5 brk-w-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

function CollectionDetail({
  collection,
  queries,
  shareUrl,
  onBack,
  onEdit,
  onOpenQuery,
}: {
  collection: QueryCollection;
  queries: SavedQuery[];
  shareUrl: string;
  onBack: () => void;
  onEdit?: () => void;
  onOpenQuery?: (query: SavedQuery) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const members = collection.queryIds
    .map((id) => queries.find((q) => q.id === id))
    .filter((q): q is SavedQuery => !!q);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  return (
    <div className="brk-flex brk-flex-col brk-gap-4">
      <button
        onClick={onBack}
        className="brk-flex brk-w-fit brk-items-center brk-gap-1 brk-text-sm brk-text-muted-foreground hover:brk-text-foreground"
      >
        <ArrowLeft className="brk-h-3.5 brk-w-3.5" /> Back to collections
      </button>

      <div className="brk-flex brk-items-start brk-justify-between brk-gap-2">
        <div>
          <h3 className="brk-text-base brk-font-semibold">{collection.name}</h3>
          <p className="brk-text-sm brk-text-muted-foreground">
            {members.length} quer{members.length === 1 ? "y" : "ies"} \u00b7 created by {collection.createdBy}
          </p>
        </div>
        <div className="brk-flex brk-shrink-0 brk-items-center brk-gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="brk-h-4 brk-w-4" /> : <LinkIcon className="brk-h-4 brk-w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="brk-h-4 brk-w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="brk-overflow-hidden brk-rounded-lg brk-border brk-border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((q) => (
              <TableRow
                key={q.id}
                className={onOpenQuery ? "brk-cursor-pointer" : undefined}
                onClick={() => onOpenQuery?.(q)}
              >
                <TableCell className={cn("brk-font-medium", onOpenQuery && "brk-text-primary hover:brk-underline")}>
                  {q.name}
                </TableCell>
                <TableCell className="brk-text-muted-foreground">{q.createdBy}</TableCell>
              </TableRow>
            ))}
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="brk-py-8 brk-text-center brk-text-muted-foreground">
                  No queries in this collection.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CollectionEditor({
  initial,
  queries,
  currentUser,
  onBack,
  onSave,
}: {
  initial: QueryCollection | null;
  queries: SavedQuery[];
  currentUser: string;
  onBack: () => void;
  onSave: (c: NewQueryCollection) => Promise<void>;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [selected, setSelected] = React.useState<Set<string>>(new Set(initial?.queryIds ?? []));
  const [saving, setSaving] = React.useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim() || selected.size === 0) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), createdBy: initial?.createdBy ?? currentUser, queryIds: [...selected] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="brk-flex brk-flex-col brk-gap-4">
      <button
        onClick={onBack}
        className="brk-flex brk-w-fit brk-items-center brk-gap-1 brk-text-sm brk-text-muted-foreground hover:brk-text-foreground"
      >
        <ArrowLeft className="brk-h-3.5 brk-w-3.5" /> Back to collections
      </button>

      <div className="brk-flex brk-flex-col brk-gap-1">
        <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly sales pack" className="brk-max-w-md" />
      </div>

      <div className="brk-flex brk-flex-col brk-gap-1">
        <label className="brk-text-xs brk-font-medium brk-text-muted-foreground">
          Queries ({selected.size} selected)
        </label>
        <div className="brk-max-h-80 brk-overflow-y-auto brk-rounded-lg brk-border brk-border-border">
          {queries.length === 0 && (
            <p className="brk-p-4 brk-text-sm brk-text-muted-foreground">No saved queries yet \u2014 create one first.</p>
          )}
          {queries.map((q) => (
            <label
              key={q.id}
              className="brk-flex brk-cursor-pointer brk-items-center brk-gap-3 brk-border-b brk-border-border brk-px-3 brk-py-2 brk-text-sm last:brk-border-b-0 hover:brk-bg-secondary"
            >
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={() => toggle(q.id)}
                className="brk-h-4 brk-w-4 brk-accent-primary"
              />
              <div>
                <div className="brk-font-medium">{q.name}</div>
                <div className="brk-text-xs brk-text-muted-foreground">{q.createdBy}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving || !name.trim() || selected.size === 0} className="brk-w-fit">
        {saving ? "Saving\u2026" : initial ? "Save changes" : "Save collection"}
      </Button>
    </div>
  );
}
