import application from "vinext/server/fetch-handler";
export * from "vinext/server/fetch-handler";

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (request.method === "POST" && (path.startsWith("/api/bookings/") || path === "/api/push/subscribe")) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.BOOKING_LIMITER.limit({ key: `${path}:${ip}` });
      if (!success) return Response.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    }
    return application.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Cloudflare.Env>;
