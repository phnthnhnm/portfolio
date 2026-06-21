const RESUME_URL = "https://rxresu.me/phnthnhnm/public";
const SLOW_THRESHOLD_MS = 2000;
const TIMEOUT_MS = 8000;

export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const origin = request.headers.get("Origin");
  const allowedOrigin = "https://phanthanhnam.com";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const start = Date.now();
  try {
    const res = await fetch(RESUME_URL, { signal: controller.signal });
    clearTimeout(timeout);
    const latency = Date.now() - start;

    const status = !res.ok
      ? "down"
      : latency > SLOW_THRESHOLD_MS
        ? "slow"
        : "up";

    return new Response(
      JSON.stringify({
        name: "Resume",
        url: RESUME_URL,
        status,
        latency,
        httpStatus: res.status,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
        },
      },
    );
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err instanceof DOMException && err.name === "AbortError";

    return new Response(
      JSON.stringify({
        name: "Resume",
        url: RESUME_URL,
        status: "down",
        latency: null,
        error: isTimeout ? "Request timed out" : err instanceof Error ? err.message : String(err),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
        },
      },
    );
  }
};
