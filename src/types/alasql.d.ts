declare module "alasql" {
  interface AlaSQLTable {
    data: unknown[];
  }
  interface AlaSQLStatic {
    (sql: string, params?: unknown[]): unknown;
    tables: Record<string, AlaSQLTable>;
  }
  const alasql: AlaSQLStatic;
  export default alasql;
}
