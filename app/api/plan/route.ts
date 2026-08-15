// app/api/plan/route.ts
//
// Creates one plan_sessions row and returns its session_id.
//
// results-client.tsx is a client component, so it cannot talk to Supabase
// directly. The service role key would ship to the browser and bypass every
// policy in the database. The client POSTs the plan here instead and gets
// back a UUID it can attach to outbound clicks and to a lead.
//
// Everything except session_id, created_at and completed is nullable on
// plan_sessions, so a partial or unrecognised plan still produces a usable
// session rather than failing.

export const runtime = 'nodejs';

// plan_sessions.lake_id is a foreign key to lakes(lake_id). The app carries
// lake names, so the mapping lives here. Grand Lake (3) exists in the lookup
// but the plan flow does not offer it yet.
const LAKE_IDS: Record<string, number> = {
  'Lake of the Ozarks': 1,
  'Table Rock Lake': 2,
  'Grand Lake': 3,
};

// budget_total is an integer but /start collects a band. We store the band's
// LOWER bound in dollars, which reads as "at least this much". Lower bound is
// the only choice that stays monotonic and still handles the open-ended
// '150+' band without inventing a ceiling.
const BUDGET_FLOOR: Record<string, number> = {
  '30-60': 30000,
  '60-90': 60000,
  '90-150': 90000,
  '150+': 150000,
};

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveEnv(candidates: string[]) {
  for (const name of candidates) {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

export async function POST(request: Request) {
  const url = resolveEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
  const key = resolveEnv([
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_KEY',
  ]);

  if (!url || !key) {
    console.error('Supabase not configured; plan session not created.');
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

  // Both of these collapse a three-option select into a boolean, which is
  // what the column allows. 'not-needed' and 'optional' both become false,
  // so the distinction between them is not recoverable from this table.
  const coverNeed = str(p.coverNeed);
  const coverAutomation = str(p.coverAutomationPreference);

  const row = {
    lake_id: LAKE_IDS[str(p.lake)] ?? null,
    usage: str(p.usage) || null,
    dock_type: str(p.dockType) || null,
    has_seating_area:
      typeof p.hasSeatingArea === 'boolean' ? p.hasSeatingArea : null,
    budget_total: BUDGET_FLOOR[str(p.budget)] ?? null,
    cover_required: coverNeed ? coverNeed === 'required' : null,
    cover_automation: coverAutomation
      ? coverAutomation === 'preferred' || coverAutomation === 'required'
      : null,
    priorities: Array.isArray(p.priorities)
      ? p.priorities.filter((x): x is string => typeof x === 'string')
      : null,
    referrer: str(p.referrer).slice(0, 500) || null,
    // Reaching the results page means the flow was completed.
    completed: true,
  };

  try {
    const res = await fetch(
      url.replace(/\/+$/, '') + '/rest/v1/plan_sessions?select=session_id',
      {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.error(
        'Plan session insert failed:',
        res.status,
        (await res.text()).slice(0, 300)
      );
      return Response.json({ success: false }, { status: 200 });
    }

    const rows = (await res.json()) as { session_id?: string }[];
    const sessionId = Array.isArray(rows) ? rows[0]?.session_id : undefined;

    if (!sessionId) {
      console.error('Plan session insert returned no session_id.');
      return Response.json({ success: false }, { status: 200 });
    }

    return Response.json({ success: true, sessionId }, { status: 200 });
  } catch (error) {
    console.error('Plan session insert threw:', error);
    return Response.json({ success: false }, { status: 200 });
  }
}
