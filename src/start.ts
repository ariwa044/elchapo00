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
// defining the file opts out, so re-add it explicitly here using a plain
// createMiddleware().server() instead of createCsrfMiddleware() which is an
// isomorphic fn stub and not reliably callable on all Vercel bundle targets.
const csrfMiddleware = createMiddleware().server(async (ctx) => {
  // Only gate server function calls, not page requests.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((ctx as any).handlerType !== "serverFn") return ctx.next();

  const request = ctx.request as Request;

  const secFetchSite = request.headers.get("Sec-Fetch-Site");
  if (secFetchSite !== null) {
    return secFetchSite === "same-origin"
      ? ctx.next()
      : new Response("Forbidden", { status: 403 });
  }

  const origin = request.headers.get("Origin");
  if (origin !== null) {
    try {
      return origin === new URL(request.url).origin
        ? ctx.next()
        : new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const referer = request.headers.get("Referer");
  if (referer !== null) {
    try {
      return new URL(referer).origin === new URL(request.url).origin
        ? ctx.next()
        : new Response("Forbidden", { status: 403 });
    } catch {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return ctx.next();
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
