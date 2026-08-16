// app/api/plan/results/route.ts
//
// Records which boats were actually shown for a plan session.
//
// plan_sessions stores what the visitor asked for. This stores what we
// answered with, in the order we ranked it. Without this half, an outbound
// click tells you a provider was clicked but not what it beat, so there is
// no way to ask whether position 1 outperforms position 3, or whether the
// fitScore * 10 weighting in results-client.tsx is actually producing better
// outcomes rather than just more confident ones.
//
// The client sends slugs, never ids. lib/boats-db.ts maps boat rows to
// `id: r.slug`, so the browser has no access to boat_id in the first place,
// and plan_results.boat_id is a foreign key to boats(boat_id). Resolving the
// slug here means the browser cannot post arbitrary integers into a
// foreign-keyed table. Anything that does not resolve is dropped rather than
// failing the whole batch.
//
// Constraints this has to satisfy, from plan_results:
//   slot_type_chk  slot_type in ('boat','dealer','cover','lift','comfort')
//   target_chk     exactly one of boat_id / provider_id is non-null
// The results page has no provider links, so every row written here is
// slot_type 'boat' with provider_id left null. Provider slots become
// relevant if the dealers page ever carries a session id.
//
// Nothing here is allowed to surface an error to a visitor. Attribution is
// telemetry. A failure is logged and the response is still 200.

export const runtime = 'nodejs';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Slugs are generated, not typed, so they are always lowercase alphanumeric
// with hyphens. Validating the shape here means the values can be dropped
// into a PostgREST `in.()` filter without any quoting or escaping concerns.
const SLUG_REGEX = /^[a-z0-9-]{1,80}$/;

// The results page shows three boats. The cap is generous so a future layout
// change does not silently start truncating, but bounded so a crafted request
// cannot ask us to resolve a thousand slugs.
const MAX_ROWS = 12;

function resolveEnv(candidates: string[]) {
  for (const name of candidates) {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

type IncomingBoat = {
  slug: string;
  position: number;
  inBudget: boolean | null;
};

function parseBoats(value: unknown): IncomingBoat[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const out: IncomingBoat[] = [];

  for (const item of value.slice(0, MAX_ROWS)) {
    if (!item || typeof item !== 'object') continue;

    const row = item as Record<string, unknown>;
    const slug = typeof row.slug === 'string' ? row.slug.trim().toLowerCase() : '';
    if (!SLUG_REGEX.test(slug)) continue;

    // The same boat must not occupy two slots. Without this, a duplicate in
    // the payload would write two rows and quietly double that boat's
    // impression count in any downstream rate calculation.
    if (seen.has(slug)) continue;

    const position =
      typeof row.position === 'number' && Number.isInteger(row.position)
        ? row.position
        : NaN;
    if (!Number.isFinite(position) || position < 1 || position > MAX_ROWS) {
      continue;
    }

    seen.add(slug);

    out.push({
      slug,
      position,
      inBudget: typeof row.inBudget === 'boolean' ? row.inBudget : null,
    });
  }

  return out;
}

export async function POST(request: Request) {
  const url = resolveEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
  const key = resolveEnv([
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_KEY',
  ]);

  if (!url || !key) {
    console.error('Supabase not configured; plan results not recorded.');
    return Response.json({ success: false }, { status: 200 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ success: false }, { status: 400 });
  }

  const p = body as Record<string, unknown>;
  const sessionId = typeof p.sessionId === 'string' ? p.sessionId.trim() : '';

  // session_id is NOT NULL with a foreign key to plan_sessions. A bad value
  // would be rejected by the database anyway; rejecting it here keeps the
  // error out of the Supabase logs where it would look like a real fault.
  if (!UUID_REGEX.test(sessionId)) {
    return Response.json({ success: false }, { status: 400 });
  }

  const boats = parseBoats(p.boats);

  if (boats.length === 0) {
    return Response.json({ success: true, recorded: 0 }, { status: 200 });
  }

  const base = url.replace(/\/+$/, '');
  const authHeaders = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  try {
    // Resolve every slug in one round trip. Safe to interpolate because
    // SLUG_REGEX has already restricted the character set.
    const slugList = boats.map((b) => b.slug).join(',');

    const lookup = await fetch(
      `${base}/rest/v1/boats?select=boat_id,slug&slug=in.(${slugList})`,
      {
        headers: authHeaders,
        cache: 'no-store',
      }
    );

    if (!lookup.ok) {
      console.error(
        'Boat id lookup failed:',
        lookup.status,
        (await lookup.text()).slice(0, 300)
      );
      return Response.json({ success: false }, { status: 200 });
    }

    const found = (await lookup.json()) as { boat_id: number; slug: string }[];

    const idBySlug = new Map<string, number>();
    for (const row of Array.isArray(found) ? found : []) {
      if (typeof row?.slug === 'string' && typeof row?.boat_id === 'number') {
        idBySlug.set(row.slug, row.boat_id);
      }
    }

    const rows = boats
      .map((b) => {
        const boatId = idBySlug.get(b.slug);
        if (boatId === undefined) return null;

        return {
          session_id: sessionId,
          slot_type: 'boat',
          boat_id: boatId,
          // target_chk requires exactly one of boat_id / provider_id to be
          // non-null. Left explicit so the constraint is visible in the code.
          provider_id: null,
          position: b.position,
          in_budget: b.inBudget,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      // Every slug missed. Usually means the static fallback catalogue in
      // boats-db.ts served the page because the database read failed, so
      // the client is holding slugs that are not in the boats table.
      console.error('No plan result slugs resolved to a boat_id.');
      return Response.json({ success: true, recorded: 0 }, { status: 200 });
    }

    const insert = await fetch(`${base}/rest/v1/plan_results`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        // return=minimal because nothing needs the generated result_id.
        // ignore-duplicates is a no-op today and becomes real protection the
        // moment a unique index exists on (session_id, slot_type, position).
        Prefer: 'return=minimal, resolution=ignore-duplicates',
      },
      body: JSON.stringify(rows),
      cache: 'no-store',
    });

    if (!insert.ok) {
      console.error(
        'Plan results insert failed:',
        insert.status,
        (await insert.text()).slice(0, 300)
      );
      return Response.json({ success: false }, { status: 200 });
    }

    return Response.json(
      { success: true, recorded: rows.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Plan results insert threw:', error);
    return Response.json({ success: false }, { status: 200 });
  }
}
