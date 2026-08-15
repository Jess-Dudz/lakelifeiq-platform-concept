// app/api/debug-env/route.ts
//
// TEMPORARY DIAGNOSTIC. Delete this file once the dealers page works.
//
// Visit https://lakelifeiq.com/api/debug-env in a browser and it reports:
//   1. which Supabase-related env var NAMES exist (never the values)
//   2. whether a real request to your database succeeds, and the status
//
// SAFETY: this never returns a value, only names, booleans, and lengths.
// Variable names are not secrets; they appear in your public repo already.
// Still, delete the file when you are done. There is no reason to leave a
// diagnostic endpoint on a production site.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Every env var whose name mentions Supabase. Names only.
  const supabaseVarNames = Object.keys(process.env)
    .filter((k) => k.toUpperCase().includes('SUPABASE'))
    .sort();

  // Other vars we expect, reported as present/absent only.
  const otherExpected = [
    'DEALER_CLICK_WEBHOOK_URL',
    'CLICK_INGEST_SECRET',
    'RESEND_API_KEY',
  ].map((name) => ({ name, present: Boolean(process.env[name]) }));

  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const result: Record<string, unknown> = {
    step1_supabaseVarNamesFound: supabaseVarNames,
    step1_count: supabaseVarNames.length,
    step2_otherVars: otherExpected,
    step3_SUPABASE_URL_present: Boolean(url),
    step3_SUPABASE_URL_looksRight: url ? url.startsWith('https://') : false,
    step3_SUPABASE_SERVICE_ROLE_KEY_present: Boolean(key),
    step3_keyLength: key ? key.length : 0,
  };

  // If both are present, actually try the request the dealers page makes.
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/v_provider_directory?select=name&limit=3`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      });
      result.step4_httpStatus = res.status;
      result.step4_ok = res.ok;
      if (res.ok) {
        const rows = await res.json();
        result.step4_rowsReturned = Array.isArray(rows) ? rows.length : 0;
        result.step4_verdict =
          Array.isArray(rows) && rows.length > 0
            ? 'WORKING - the dealers page should be showing 58 providers'
            : 'View reachable but returned no rows';
      } else {
        result.step4_body = (await res.text()).slice(0, 400);
        result.step4_verdict =
          res.status === 404
            ? 'View not exposed to the REST API. Needs a grant.'
            : res.status === 401
            ? 'Key rejected. Wrong key, or it is the anon key not service_role.'
            : 'Request failed, see step4_body';
      }
    } catch (error) {
      result.step4_verdict = 'fetch threw';
      result.step4_error = String(error).slice(0, 300);
    }
  } else {
    result.step4_verdict =
      'Skipped: one or both env vars missing. See step1 for what actually exists.';
  }

  return Response.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
