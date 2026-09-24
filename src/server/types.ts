export interface BiServerOptions {
  /**
   * Postgres connection string used for bi-report-kit's OWN two tables
   * (saved queries + collections) \u2014 needs read/write.
   */
  connectionString: string;
  /**
   * Connection string used to actually RUN reports \u2014 i.e. what
   * QueryManager's SQL and the structured query path execute against.
   * Defaults to `connectionString` if omitted, but for anything beyond a
   * side project you want this to be a separate, read-only role: see the
   * README's "Setup" section for the GRANT SELECT-only example. This
   * package does not create or manage that role for you.
   */
  readOnlyConnectionString?: string;
  /** table name for saved queries; defaults to "bi_saved_queries" */
  queriesTable?: string;
  /** table name for collections; defaults to "bi_query_collections" */
  collectionsTable?: string;
}

export interface StoredSavedQuery {
  id: string;
  name: string;
  sql: string;
  created_by: string;
  created_at: string;
}

export interface StoredQueryCollection {
  id: string;
  name: string;
  created_by: string;
  query_ids: string[];
  created_at: string;
}
