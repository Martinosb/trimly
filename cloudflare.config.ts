import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  accountId: "45546e235b52054c97f2a1463bf9bcae",
  worker: defineWorker({
    name: "gxstyl",
    entrypoint: "./src/worker.ts",
    compatibilityDate: "2026-11-07",
    domains: ["gxstyl.com", "www.gxstyl.com"],
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: { enabled: true, headSamplingRate: 1 },
      traces: { enabled: true, headSamplingRate: 0.01 },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      BOOKING_LIMITER: bindings.rateLimit({ namespace: "6720261107", simple: { limit: 12, period: 60 } }),
      NEXT_PUBLIC_APP_URL: bindings.text("https://gxstyl.com"),
      NEXT_PUBLIC_SUPABASE_URL: bindings.secret(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.secret(),
      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
    },
  }),
});
