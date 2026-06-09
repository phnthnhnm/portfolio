interface Env {
  VIEWS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  // Only respond to GET
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Allow only same-origin requests (no cross-site tracking)
  const origin = request.headers.get("Origin");
  const allowedOrigin = "https://phanthanhnam.com";

  if (env.VIEWS) {
    try {
      // Read, increment, write. For a low-traffic portfolio site the tiny
      // chance of a lost increment from concurrent writes is not worth
      // adding Durable Objects or D1 complexity.
      const raw = await env.VIEWS.get("total_views");
      const current = parseInt(raw || "0");
      const next = current + 1;
      await env.VIEWS.put("total_views", next.toString());

      return new Response(
        JSON.stringify({ count: next }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
          },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "KV read/write failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // KV not bound — return 0 so the UI degrades gracefully
  return new Response(
    JSON.stringify({ count: 0 }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
