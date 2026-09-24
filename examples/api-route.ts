// examples/api-route.ts
// -----------------------------------------------------------------------
// Mount this at app/api/bi/[...route]/route.ts and bi-report-kit owns
// storing/reading saved queries and collections, plus running report
// queries \u2014 no hand-written CRUD endpoints, no fetch() calls to write.
//
// On first use it creates its own two tables (bi_saved_queries,
// bi_query_collections) in the database at BI_DATABASE_URL. It never
// touches any other table except to run the SELECT queries your users
// write in QueryManager.

import { createBiServer, createNextRouteHandlers } from "bi-report-kit/server";

const bi = createBiServer({
  // Read/write connection for bi-report-kit's own 2 tables.
  connectionString: process.env.BI_DATABASE_URL!,
  // Separate, SELECT-only connection for actually running report SQL.
  // Falls back to `connectionString` above if you omit this \u2014 fine for a
  // side project, not recommended once real users can type SQL. See the
  // README's "Setup" section for the GRANT SELECT-only role example.
  readOnlyConnectionString: process.env.BI_READONLY_DATABASE_URL,
});

export const { GET, POST, PATCH, DELETE } = createNextRouteHandlers(bi);
