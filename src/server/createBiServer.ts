import { Pool } from "pg";
import { schemaSql } from "./schema";
import type { BiServerOptions, StoredSavedQuery, StoredQueryCollection } from "./types";

export interface RunQueryInput {
  sql?: string;
  metrics?: string[];
  dimensions?: string[];
  filters?: unknown[];
  sort?: unknown[];
  limit?: number;
  dateRange?: { field: string; start: string; end: string };
}

export interface BiServer {
  /** Creates the two tables (IF NOT EXISTS) \u2014 safe to call repeatedly; called lazily on first use if you never call it yourself. */
  ensureSchema(): Promise<void>;

  listQueries(): Promise<StoredSavedQuery[]>;
  createQuery(input: { name: string; sql: string; createdBy: string }): Promise<StoredSavedQuery>;
  updateQuery(id: string, patch: { name?: string; sql?: string }): Promise<StoredSavedQuery>;
  deleteQuery(id: string): Promise<void>;

  listCollections(): Promise<StoredQueryCollection[]>;
  createCollection(input: { name: string; createdBy: string; queryIds: string[] }): Promise<StoredQueryCollection>;
  updateCollection(id: string, patch: { name?: string; queryIds?: string[] }): Promise<StoredQueryCollection>;
  deleteCollection(id: string): Promise<void>;

  /** Runs a report query (raw SQL today; see the README for structured-query support) against the read-only connection. */
  runQuery(input: RunQueryInput): Promise<{ rows: Record<string, unknown>[] }>;

  /** Closes both connection pools \u2014 call on server shutdown in long-running (non-serverless) environments. */
  close(): Promise<void>;
}

/**
 * The whole point: give this a connection string, mount its route
 * handlers (see ./next), and bi-report-kit owns storing/reading saved
 * queries and collections \u2014 no CRUD code to write yourself. It creates
 * its own two tables on first use; it never touches anything else in
 * your database except to run the read queries you ask it to.
 */
export function createBiServer(options: BiServerOptions): BiServer {
  const {
    connectionString,
    readOnlyConnectionString = connectionString,
    queriesTable = "bi_saved_queries",
    collectionsTable = "bi_query_collections",
  } = options;

  const metaPool = new Pool({ connectionString });
  const dataPool =
    readOnlyConnectionString === connectionString ? metaPool : new Pool({ connectionString: readOnlyConnectionString });

  let schemaReady: Promise<void> | null = null;
  function ensureSchema(): Promise<void> {
    if (!schemaReady) {
      schemaReady = metaPool.query(schemaSql(queriesTable, collectionsTable)).then(() => undefined);
    }
    return schemaReady;
  }

  return {
    ensureSchema,

    async listQueries() {
      await ensureSchema();
      const { rows } = await metaPool.query(`SELECT * FROM ${queriesTable} ORDER BY created_at ASC`);
      return rows;
    },

    async createQuery({ name, sql, createdBy }) {
      await ensureSchema();
      const { rows } = await metaPool.query(
        `INSERT INTO ${queriesTable} (name, sql, created_by) VALUES ($1, $2, $3) RETURNING *`,
        [name, sql, createdBy]
      );
      return rows[0];
    },

    async updateQuery(id, patch) {
      await ensureSchema();
      const { rows } = await metaPool.query(
        `UPDATE ${queriesTable} SET name = COALESCE($2, name), sql = COALESCE($3, sql) WHERE id = $1 RETURNING *`,
        [id, patch.name ?? null, patch.sql ?? null]
      );
      if (rows.length === 0) throw new Error(`bi-report-kit: no saved query with id ${id}`);
      return rows[0];
    },

    async deleteQuery(id) {
      await ensureSchema();
      await metaPool.query(`DELETE FROM ${queriesTable} WHERE id = $1`, [id]);
    },

    async listCollections() {
      await ensureSchema();
      const { rows } = await metaPool.query(`SELECT * FROM ${collectionsTable} ORDER BY created_at ASC`);
      return rows;
    },

    async createCollection({ name, createdBy, queryIds }) {
      await ensureSchema();
      const { rows } = await metaPool.query(
        `INSERT INTO ${collectionsTable} (name, created_by, query_ids) VALUES ($1, $2, $3) RETURNING *`,
        [name, createdBy, queryIds]
      );
      return rows[0];
    },

    async updateCollection(id, patch) {
      await ensureSchema();
      const { rows } = await metaPool.query(
        `UPDATE ${collectionsTable} SET name = COALESCE($2, name), query_ids = COALESCE($3, query_ids) WHERE id = $1 RETURNING *`,
        [id, patch.name ?? null, patch.queryIds ?? null]
      );
      if (rows.length === 0) throw new Error(`bi-report-kit: no collection with id ${id}`);
      return rows[0];
    },

    async deleteCollection(id) {
      await ensureSchema();
      await metaPool.query(`DELETE FROM ${collectionsTable} WHERE id = $1`, [id]);
    },

    async runQuery(input) {
      if (!input.sql || !input.sql.trim()) {
        throw new Error(
          "bi-report-kit: runQuery only supports raw SQL (QueryManager) out of the box. For the structured " +
            "metrics/dimensions path (DashboardBuilder/ReportBrowser), resolve QueryDefinition -> SQL yourself " +
            "in your own route handler before calling into this server \u2014 see the README."
        );
      }
      const client = await dataPool.connect();
      try {
        await client.query("BEGIN TRANSACTION READ ONLY");
        const { rows } = await client.query(input.sql);
        return { rows };
      } finally {
        await client.query("ROLLBACK").catch(() => {});
        client.release();
      }
    },

    async close() {
      await metaPool.end();
      if (dataPool !== metaPool) await dataPool.end();
    },
  };
}
