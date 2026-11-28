// Serves the static site from ./dist. The only logic: send "/" to the visitor's language,
// and send www to the apex domain. No logging of URLs, no cookies, no third parties.
interface Env { ASSETS: Fetcher }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'www.healthypaw.app') {
      url.hostname = 'healthypaw.app';
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
      const prefersPolish = /^\s*pl\b/i.test(request.headers.get('accept-language') ?? '');
      const target = new URL(prefersPolish ? '/pl/' : '/en/', url);
      return new Response(null, { status: 302, headers: { Location: target.toString(), Vary: 'Accept-Language', 'Cache-Control': 'no-store' } });
    }

    // Invite landing: one static page for every /i/<token>. Never cached, never indexed, token never logged.
    if (url.pathname.startsWith('/i/') && (request.method === 'GET' || request.method === 'HEAD')) {
      const res = await env.ASSETS.fetch(new Request(new URL('/invite', url), request));
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      headers.set('Referrer-Policy', 'no-referrer');
      return new Response(res.body, { status: res.status, headers });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
