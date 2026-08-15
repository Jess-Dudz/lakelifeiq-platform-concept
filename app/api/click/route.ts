// app/api/click/route.ts
//
// Receives the payload that lib/outbound-clicks.ts already sends and writes it
// to Supabase by calling the ingest_outbound_click function over Supabase's
// REST API.
//
// No npm packages required. This uses built-in fetch, which means you can add
// this file through the GitHub website without touching a terminal.
//
// Env vars to set in Vercel (Settings > Environment Variables).
// None of these get a NEXT_PUBLIC_ prefix. That prefix ships the value to the
// browser, and the service role key bypasses every security rule you have.
//
//   DEALER_CLICK_WEBHOOK_URL  = https://lakelifeiq.com/api/click
//   SUPABASE_URL              = https://<your-project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY = <service_role key, Project Settings > API>
//   CLICK_INGEST_SECRET       = <any long random string you invent>

export const runtime = 'nodejs';

// Crawlers will hit /out links once the dealers page is indexed. Flagging them
// keeps your click counts honest rather than flattering.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|preview|monitor|curl|wget|python-requests|axios|node-fetch/i;

function isLikelyBot(userAgent: string | null) {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

// A shared secret so this is not an open write endpoint. Without it, anyone who
// reads your public repo could inflate a provider's click count, which is the
// exact number you would later be selling on.
function isAuthorized(request: Request) {
  const expected = process.env.CLICK_INGEST_SECRET?.trim();
  if (!expected) return true;
  return request.headers.get('x-ingest-secret') === expected;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Supabase env vars missing; click not recorded.');
    // Deliberately still 200. An ingest failure must never break the redirect
    // the user is actually waiting on.
    return Response.json({ success: false, reason: 'not_configured' });
  }

  try {
    const payload = await request.json();

    if (!payload?.slug && !payload?.name) {
      return Response.json({ success: false, reason: 'no_identifier' });
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/ingest_outbound_click`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          payload: {
            ...payload,
            isBot: isLikelyBot(request.headers.get('user-agent')),
          },
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Click ingest failed:', response.status, detail);
      return Response.json({ success: false, reason: 'db_error' });
    }

    const clickId = await response.json();
    return Response.json({ success: true, clickId });
  } catch (error) {
    console.error('Click ingest threw:', error);
    return Response.json({ success: false, reason: 'exception' });
  }
}
