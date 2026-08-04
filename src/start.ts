import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

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

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
//
// NOTE: createCsrfMiddleware is createIsomorphicFn().server(impl) — it must
// NOT be called at module top-level because Vercel's SSR bundler may resolve
// the wrong export condition before the TanStack compiler rewrites the
// isomorphic fn stubs. Deferring the call inside createStart's lazy callback
// ensures it runs after all modules are initialised with the correct impl.
export const startInstance = createStart(() => {
  const csrfMiddleware = createCsrfMiddleware({
    filter: (ctx) => ctx.handlerType === "serverFn",
  });
  return {
    functionMiddleware: [attachSupabaseAuth],
    requestMiddleware: [errorMiddleware, csrfMiddleware],
  };
});
