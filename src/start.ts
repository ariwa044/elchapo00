import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs CSRF protection automatically when src/start.ts is absent;
// defining the file opts out, so we re-add it explicitly here.
//
// We intentionally do NOT use createCsrfMiddleware() from @tanstack/react-start
// because that function is createIsomorphicFn().server(impl) — an isomorphic fn
// stub that must be rewritten by the TanStack Start Vite compiler plugin at build
// time. Vercel's Node.js SSR bundler resolves a package condition where the
// plugin transform doesn't run, leaving createCsrfMiddleware as a non-callable
// chain object and crashing with "createCsrfMiddleware is not a function".
//
// Instead we inline equivalent CSRF logic directly via createMiddleware().server()
// which is a plain function and always works regardless of bundler target.
const csrfMiddleware = createMiddleware().server(async (ctx) => {
  // Only gate server function calls, not regular page requests.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ctx as any).handlerType !== "serverFn") return ctx.next();

  const request = ctx.request as Request;

  // Modern browsers send Sec-Fetch-Site for cross-site detection.
  const secFetchSite = request.headers.get("Sec-Fetch-Site");
  if (secFetchSite !== null) {
    return secFetchSite === "same-origin"
      ? ctx.next()
      : new Response("Forbidden", { status: 403 });
  }

  // Fallback: compare the Origin header against the request URL origin.
  const origin = request.headers.get("Origin");
  if (origin !== null) {
    try {
      const isSameOrigin = origin === new URL(request.url).origin;
      return isSameOrigin ? ctx.next() : new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Fallback: check the Referer header for same-origin.
  const referer = request.headers.get("Referer");
  if (referer !== null) {
    try {
      const requestOrigin = new URL(request.url).origin;
      const refererOrigin = new URL(referer).origin;
      return refererOrigin === requestOrigin
        ? ctx.next()
        : new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // No CSRF signal at all — allow (server-to-server / curl / direct calls).
  return ctx.next();
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
