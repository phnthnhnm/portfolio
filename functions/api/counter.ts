interface Env {
  VIEWS: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const origin = request.headers.get('Origin');
  const allowedOrigin = 'https://phanthanhnam.com';

  if (env.VIEWS) {
    try {
      const raw = await env.VIEWS.get('total_views');
      const current = parseInt(raw || '0');
      const next = current + 1;
      await env.VIEWS.put('total_views', next.toString());

      return new Response(JSON.stringify({ count: next }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin === allowedOrigin ? allowedOrigin : 'null',
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'KV read/write failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ count: 0 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
