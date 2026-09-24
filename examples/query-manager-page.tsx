// examples/query-manager-page.tsx
// -----------------------------------------------------------------------
// The frontend half of examples/api-route.ts: no fetch() calls, no CRUD
// state management \u2014 useManagedQueries/useManagedCollections do all of
// that against the route you mounted.
"use client";

import {
  BiProvider,
  PermissionProvider,
  createRestAdapter,
  QueryManager,
  CollectionManager,
  useManagedQueries,
  useManagedCollections,
} from "bi-report-kit";
import "bi-report-kit/style.css";

const adapter = createRestAdapter({ endpoint: "/api/bi/query" });

export default function ReportsPage() {
  const managedQueries = useManagedQueries({ endpoint: "/api/bi/saved-queries" });
  const managedCollections = useManagedCollections({ endpoint: "/api/bi/collections" });

  return (
    <PermissionProvider permissions={["query:create", "export:csv", "export:png", "export:pdf"]}>
      <BiProvider adapter={adapter}>
        <QueryManager {...managedQueries} currentUser={currentUserEmail()} />
        <CollectionManager
          collections={managedCollections.collections}
          queries={managedQueries.queries}
          onCreate={managedCollections.onCreate}
          onUpdate={managedCollections.onUpdate}
          onDelete={managedCollections.onDelete}
          currentUser={currentUserEmail()}
          onOpenQuery={(query) => {
            // e.g. router.push(`/reports?query=${query.id}`) and read it
            // back into <QueryManager initialOpenQueryId={...} />
          }}
        />
      </BiProvider>
    </PermissionProvider>
  );
}

function currentUserEmail(): string {
  // wire to your own auth/session
  return "you@company.com";
}
