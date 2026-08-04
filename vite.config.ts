// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      // @tanstack/react-start re-exports createMiddleware (and other symbols) via
      // `export * from "@tanstack/start-client-core"`. Vite's SSR ESModulesEvaluator
      // does not walk transitive `export *` chains, so those symbols resolve as
      // undefined at runtime even though plain Node ESM resolves them correctly.
      // Including both packages here flattens the re-export at optimise time,
      // mirroring Rollup's production-bundle behaviour and fixing the crash.
      optimizeDeps: {
        include: ["@tanstack/react-start", "@tanstack/start-client-core"],
      },
    },
  },
});
