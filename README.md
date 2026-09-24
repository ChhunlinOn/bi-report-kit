# bi-report-kit

Embeddable BI reporting toolkit for React / Next.js — the `bi_report`-style
building blocks (saved queries, collections, dashboards) you'd get from a
Rails BI gem, delivered as an installable npm package that **owns its own
storage**: connect a database, mount one route, done.

**Read-only against your data, by design.** This package only ever *reads*
data and *exports* what it read (CSV/PNG/PDF) — there is no create/update/
delete path into your business tables anywhere in it, and no data-import
feature. The only tables it ever writes to are its own two (saved queries
and collections — see below); everything else it only runs `SELECT`
against.

## Install

```bash
npm install bi-report-kit pg
# peer deps, if not already present:
npm install react react-dom
```

Import the stylesheet once, e.g. in your root layout:

```tsx
import "bi-report-kit/style.css";
```

## Quick setup

You already have a database with data in it — that's the only
prerequisite. Nothing here creates tables for *your* data, migrates
anything, or requires a specific schema.

**No separate server.** `bi-report-kit/server` isn't a server you run —
it's Node-only functions that execute inside whatever server you already
have (your existing Next.js app, in the steps below). One process, same
as before; one database, same as before, just with two extra tables in
it. Nothing new to deploy, no new port, no second thing to keep running.

**1. Set a connection string.**

```bash
# .env
BI_DATABASE_URL=postgres://user:pass@host/db
```

**2. Mount one route.** Create `app/api/bi/[...route]/route.ts`:

```ts
import { createBiServer, createNextRouteHandlers } from "bi-report-kit/server";

const bi = createBiServer({ connectionString: process.env.BI_DATABASE_URL! });
export const { GET, POST, PATCH, DELETE } = createNextRouteHandlers(bi);
```

That's it — on first use, `createBiServer` creates its own two tables
(`bi_saved_queries`, `bi_query_collections`) in that database if they
don't already exist. You never write `CREATE TABLE`, a migration, or any
CRUD endpoint yourself.

**3. Render the UI.** Anywhere in your app:

```tsx
"use client";
import {
  BiProvider, PermissionProvider, createRestAdapter,
  QueryManager, useManagedQueries,
} from "bi-report-kit";
import "bi-report-kit/style.css";

const adapter = createRestAdapter({ endpoint: "/api/bi/query" });

export default function ReportsPage() {
  const managedQueries = useManagedQueries({ endpoint: "/api/bi/saved-queries" });

  return (
    <PermissionProvider permissions={["query:create"]}>
      <BiProvider adapter={adapter}>
        <QueryManager {...managedQueries} currentUser="you@company.com" />
      </BiProvider>
    </PermissionProvider>
  );
}
```

**Done.** Open the page: an index of saved queries, a "New query" screen
where people write real SQL against your actual tables, a Schema page, a
"Preview table" picker, CSV/PNG/PDF export — all wired up, nothing else to
build. `useManagedCollections` + `<CollectionManager>` work the same way
for bundling queries under one shareable link. Full copy-pasteable
versions of both files above: `examples/api-route.ts` and
`examples/query-manager-page.tsx`.

### Before you let real users in: use a read-only role for report queries

`createBiServer({ connectionString })` needs read/write access — that's
for its own 2 tables. But `QueryManager` lets people type arbitrary SQL,
and by default that SQL runs against the *same* connection. For anything
beyond local testing, give it a second, `SELECT`-only connection instead:

```sql
-- Postgres
CREATE ROLE bi_readonly WITH LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE your_db TO bi_readonly;
GRANT USAGE ON SCHEMA public TO bi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bi_readonly;
```

```ts
const bi = createBiServer({
  connectionString: process.env.BI_DATABASE_URL!,               // read/write, bi-report-kit's own 2 tables
  readOnlyConnectionString: process.env.BI_READONLY_DATABASE_URL!, // SELECT-only, everything users query
});
```

This is the real security boundary — not anything in the npm package
itself. `createBiServer` also wraps every report query in an explicit
`BEGIN TRANSACTION READ ONLY` as a second layer, but the DB role is what
actually matters.

### Not using Next.js, or not using Postgres?

`createNextRouteHandlers` is a thin adapter over `BiServer`'s plain
methods (`listQueries`, `createQuery`, `runQuery`, etc.) — call those
directly from Express, a Cloudflare Worker, whatever you're running, if
you're not on Next.js's App Router. `createBiServer` itself is Postgres
via `pg`; a MySQL/SQLite version means swapping the driver + the two
`CREATE TABLE` statements in `src/server/schema.ts` — the interface
(`BiServer`) stays the same either way.

## The other view: `DashboardBuilder` / `ReportBrowser`

Everything above is the `QueryManager` (raw SQL, bi_report-style) path.
If you want charts and a drag/resize dashboard instead, or a simpler
named-query list without letting people write SQL, those don't use
`bi-report-kit/server` at all — they talk to your own query endpoint
directly via a `QueryDefinition` (`{ metrics, dimensions, filters }`
instead of `{ sql }`). See `examples/usage-example.tsx` for the full
`SemanticLayer` + `DashboardBuilder` shape, and
`examples/rails_query_controller.rb` for a Rails-side implementation of
that endpoint if you're not on a Node backend at all.

## Architecture

| Layer | What it does | Where |
|---|---|---|
| **Storage (server-side)** | `createBiServer` (Postgres via `pg`, owns 2 tables, zero-config schema creation) + `createNextRouteHandlers` (mounts everything at one route in *your* existing server) — not a separate server process | `src/server/` |
| **Managed hooks** | `useManagedQueries`/`useManagedCollections` — fetch-backed CRUD against the mounted route, ready to spread into the components below | `src/hooks/` |
| **Query manager** | `bi_report`-style index of saved queries + a raw-SQL editor with syntax highlighting, table preview, schema browser, fork | `src/components/queries/` |
| **Collections** | Bundle several saved queries under one shareable link | `src/components/queries/` |
| **Query layer** | Backend-agnostic `DataSourceAdapter` interface for the *data* path (as opposed to the *storage* path above) — REST adapter + in-memory adapter for demos; `QueryEngine` caches/dedupes | `src/query/` |
| **Semantic layer** | Register metrics/dimensions once for the `DashboardBuilder`/`ReportBrowser` path | `src/semantic/` |
| **Charts** | Bar / Line / Area / Pie (Recharts), KPI cards, sortable DataTable | `src/components/charts/` |
| **Dashboard builder** | Data-driven `WidgetConfig[]` layout, add/resize/reorder/remove UI | `src/components/dashboard/` |
| **Export** | CSV / PNG / PDF — auto-adapts to a published Claude artifact's `downloads` capability when present | `src/export/` |
| **Permissions** | `PermissionProvider` + `usePermission()` / `<Can>` gate; fails open if unused | `src/permissions/` |
| **Scheduling** | Client for CRUD on schedule *configs* — your backend's job runner performs the actual delivery | `src/scheduling/` |

### Two different "backends" in this package, on purpose

It's worth being explicit about the split, since both start with the word
"query":

- **Storage** (saved query *definitions*, collections): owned entirely by
  `bi-report-kit/server` + its 2 tables. You write zero code for this
  beyond mounting the route.
- **Data** (what a query actually returns — rows from your real tables):
  never owned by this package. `createBiServer`'s `runQuery` executes
  the SQL, but *what tables exist and what's in them* is entirely yours;
  this package has no opinion on your schema.

### Why scheduling is "config only"

Cron and outbound email can't run in a browser tab, and `createBiServer`
doesn't run one either. `ScheduleManager` is a thin REST client for
schedule *configuration* — your own job runner (Sidekiq, a cron route,
whatever you already have) reads those configs and actually sends
reports on a timer.

## Building this package

```bash
npm install
npm run build      # tsc typecheck + vite build (browser) + vite build (server) -> dist/
npm run typecheck  # tsc --noEmit only
```

Output:
- **Browser** (`bi-report-kit`): `dist/bi-report-kit.js` / `.cjs` — small
  entry facades importing the real bundle from an adjacent hashed chunk —
  plus `dist/index.d.ts` and `dist/style.css`. A few extra hashed chunks
  (`jspdf.*`, `html2canvas.*`, `purify.*`) also land in `dist/`: these are
  `jsPDF` and its own dependencies, loaded via a dynamic `import()` only
  on the Claude-artifact PDF path, so normal consuming apps never fetch
  or bundle them even though the files ship in the package.
- **Server** (`bi-report-kit/server`): `dist/server.js` / `.cjs`, types at
  `dist/server/*.d.ts`. `pg` is externalized (never bundled).

## Publishing

```bash
npm publish
```

(`prepublishOnly` runs the build automatically.) Then in a consuming
Next.js or React app: `npm install bi-report-kit pg`.
