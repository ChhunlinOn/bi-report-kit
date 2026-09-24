import type { BiServer } from "./createBiServer";

type RouteContext = { params: Promise<{ route: string[] }> | { route: string[] } };

async function resolveParams(context: RouteContext): Promise<{ route: string[] }> {
  return await context.params;
}

function json(data: unknown, init?: number | ResponseInit): Response {
  return Response.json(data, typeof init === "number" ? { status: init } : init);
}

function guard(fn: (req: Request, context: RouteContext) => Promise<Response>) {
  return async (req: Request, context: RouteContext): Promise<Response> => {
    try {
      return await fn(req, context);
    } catch (err) {
      return json({ error: (err as Error).message ?? "bi-report-kit: unknown error" }, 500);
    }
  };
}

/**
 * Mount this at a single catch-all route \u2014 e.g.
 * `app/api/bi/[...route]/route.ts` \u2014 and every endpoint the package's
 * components need (query execution, saved-query CRUD, collection CRUD)
 * is served from it. No hand-written CRUD routes, no fetch() calls to
 * write yourself:
 *
 * ```ts
 * // app/api/bi/[...route]/route.ts
 * import { createBiServer, createNextRouteHandlers } from "bi-report-kit/server";
 *
 * const bi = createBiServer({ connectionString: process.env.BI_DATABASE_URL! });
 * export const { GET, POST, PATCH, DELETE } = createNextRouteHandlers(bi);
 * ```
 *
 * Then point the frontend at the same base path:
 * `createRestAdapter({ endpoint: "/api/bi/query" })`,
 * `useManagedQueries({ endpoint: "/api/bi/saved-queries" })`,
 * `useManagedCollections({ endpoint: "/api/bi/collections" })`.
 */
export function createNextRouteHandlers(bi: BiServer) {
  const GET = guard(async (_req, context) => {
    const { route } = await resolveParams(context);
    const [resource] = route;

    if (resource === "saved-queries") return json(await bi.listQueries());
    if (resource === "collections") return json(await bi.listCollections());
    return json({ error: `bi-report-kit: unknown route GET /${route.join("/")}` }, 404);
  });

  const POST = guard(async (req, context) => {
    const { route } = await resolveParams(context);
    const [resource] = route;
    const body = await req.json().catch(() => ({}));

    if (resource === "query") return json(await bi.runQuery(body));
    if (resource === "saved-queries") return json(await bi.createQuery(body), 201);
    if (resource === "collections") return json(await bi.createCollection(body), 201);
    return json({ error: `bi-report-kit: unknown route POST /${route.join("/")}` }, 404);
  });

  const PATCH = guard(async (req, context) => {
    const { route } = await resolveParams(context);
    const [resource, id] = route;
    const body = await req.json().catch(() => ({}));

    if (resource === "saved-queries" && id) return json(await bi.updateQuery(id, body));
    if (resource === "collections" && id) return json(await bi.updateCollection(id, body));
    return json({ error: `bi-report-kit: unknown route PATCH /${route.join("/")}` }, 404);
  });

  const DELETE = guard(async (_req, context) => {
    const { route } = await resolveParams(context);
    const [resource, id] = route;

    if (resource === "saved-queries" && id) {
      await bi.deleteQuery(id);
      return new Response(null, { status: 204 });
    }
    if (resource === "collections" && id) {
      await bi.deleteCollection(id);
      return new Response(null, { status: 204 });
    }
    return json({ error: `bi-report-kit: unknown route DELETE /${route.join("/")}` }, 404);
  });

  return { GET, POST, PATCH, DELETE };
}
