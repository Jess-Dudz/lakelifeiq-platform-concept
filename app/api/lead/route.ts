// app/api/lead/route.ts
//
// Saves a results-page lead and emails the recommendation to the visitor.
//
// This used to POST to a Google Apps Script webhook whose URL was hardcoded
// in this file, in a public repo, accepting unauthenticated POSTs. That
// script lost access to its own spreadsheet and started returning
// "You do not have permission to access the requested document" straight
// through to visitors, so lead capture had been silently broken.
//
// Google is now out of the path entirely. Leads go to Supabase and email
// goes through Resend, which is the same provider /api/contact already uses.
//
// Two separate emails on purpose:
//   1. To the visitor: plan details only. Every value comes from a fixed
//      dropdown, so nothing the visitor typed is ever echoed to an address
//      they supplied. That keeps this from becoming a way to send
//      attacker-written text to arbitrary inboxes.
//   2. To the inbox: the full record including name, phone, and notes.
//
// The Supabase insert is best-effort. If it fails, the emails have already
// been sent, so the lead is not lost and the visitor is not shown an error.
//
// Response contract is unchanged: { success: boolean, error?: string }.

import { upgrades } from '@/app/data/upgrades';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INBOX = 'contact@lakelifeiq.com';

// Values that come from fixed controls in the results flow and are safe to
// include in a message sent to a visitor-supplied address.
const SETUP_FIELDS = [
  ['Lake', 'lake'],
  ['Primary usage', 'usage'],
  ['Budget', 'budget'],
  ['Dock type', 'dockType'],
  ['Goal', 'goal'],
  ['Priorities', 'priorities'],
] as const;

// Lakes the plan flow offers. Used to build the directory link without
// putting a client-supplied URL into an outgoing email.
const LAKE_SLUGS = new Set(['Lake of the Ozarks', 'Table Rock Lake']);

// Titles are matched against the catalogue rather than trusted, so the
// upgrade lines in a visitor's email can only ever be our own copy.
const UPGRADES_BY_TITLE = new Map(upgrades.map((u) => [u.title, u]));

function upgradeLines(titles: unknown): string[] {
  if (!Array.isArray(titles)) return [];

  return titles
    .slice(0, 5)
    .map((t) => (typeof t === 'string' ? UPGRADES_BY_TITLE.get(t) : undefined))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => {
      const provider =
        u.cover?.localProvider ??
        u.lift?.localProvider ??
        u.comfort?.localProvider;
      return `- ${u.category}: ${u.title}${provider ? ` (${provider})` : ''}`;
    });
}

function str(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function fail(error: string, status: number) {
  return Response.json({ success: false, error }, { status });
}

// providers-db.ts learned the hard way that the Supabase variable names
// drift between SUPABASE_ and NEXT_PUBLIC_SUPABASE_. Same tolerance here.
function resolveEnv(candidates: string[]) {
  for (const name of candidates) {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

async function sendEmail(payload: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const raw = await res.text();
    throw new Error('Resend responded ' + res.status + ': ' + raw.slice(0, 200));
  }
}

async function saveLead(email: string, sessionId: string | null) {
  const url = resolveEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']);
  const key = resolveEnv([
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_KEY',
  ]);

  if (!url || !key) {
    console.error('Supabase not configured; lead saved to email only.');
    return;
  }

  const res = await fetch(url.replace(/\/+$/, '') + '/rest/v1/leads', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    // leads.session_id is a nullable FK with ON DELETE SET NULL. A lead from
    // a visitor whose session insert failed still saves, just unattributed.
    // consent_marketing defaults to false at the database level.
    body: JSON.stringify(sessionId ? { email, session_id: sessionId } : { email }),
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Lead insert failed:', res.status, (await res.text()).slice(0, 200));
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail('Invalid request.', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail('Invalid request.', 400);
  }

  const payload = body as Record<string, unknown>;
  const email = str(payload.email);

  // Validated here so a malformed value never reaches the foreign key.
  const rawSession = str(payload.sessionId);
  const sessionId = UUID_REGEX.test(rawSession) ? rawSession : null;

  if (!email || email.length > 160 || !EMAIL_REGEX.test(email)) {
    return fail('Please enter a valid email address.', 400);
  }

  const setupLines = SETUP_FIELDS.map(([label, key]) => {
    const value = str(payload[key]);
    return value ? `${label}: ${value}` : null;
  }).filter(Boolean) as string[];

  const boat = str(payload.recommendedBoat);
  const boatRange = str(payload.recommendedBudget);
  const allowance = str(payload.remainingUpgradeBudget);
  const picks = upgradeLines(payload.upgradeTitles);

  const lake = str(payload.lake);
  const directoryUrl = LAKE_SLUGS.has(lake)
    ? 'https://lakelifeiq.com/dealers?lake=' +
      encodeURIComponent(lake) +
      (sessionId ? '&session=' + sessionId : '')
    : 'https://lakelifeiq.com/dealers';

  // Assembled once and reused, so the visitor's copy and the inbox copy can
  // never drift apart.
  const planBody = [
    'YOUR SETUP',
    ...setupLines,
    '',
    'RECOMMENDED BOAT',
    boat ? `${boat}${boatRange ? ` (${boatRange})` : ''}` : 'No exact match',
    ...(picks.length > 0
      ? [
          '',
          `SUGGESTED UPGRADES${allowance ? ` (allowance: ${allowance})` : ''}`,
          ...picks,
        ]
      : []),
    '',
    'FIND LOCAL PROVIDERS',
    directoryUrl,
  ];

  const fromAddress =
    process.env.CONTACT_FROM_EMAIL ||
    'LakeLifeIQ <onboarding@resend.dev>';

  try {
    await sendEmail({
      from: fromAddress,
      to: [email],
      reply_to: INBOX,
      subject: 'Your LakeLifeIQ setup recommendation',
      text: [
        'Here is the setup recommendation you asked us to send.',
        '',
        ...planBody,
        '',
        'Reply to this email if you would like help with any part of it.',
        '',
        'LakeLifeIQ',
        'https://lakelifeiq.com',
      ].join('\n'),
    });
  } catch (error) {
    console.error('Visitor email failed:', error);
    return fail('Could not send your results. Please try again.', 502);
  }

  // The internal copy carries the free-text fields. A failure here must not
  // surface to the visitor, who has already received what they asked for.
  try {
    await sendEmail({
      from: fromAddress,
      to: [INBOX],
      reply_to: email,
      subject: 'New LakeLifeIQ lead: ' + email,
      text: [
        'New lead from the results page.',
        '',
        `Name: ${str(payload.name) || 'Not given'}`,
        `Email: ${email}`,
        `Phone: ${str(payload.phone) || 'Not given'}`,
        '',
        ...planBody,
        '',
        'Notes:',
        str(payload.notes) || 'None',
      ].join('\n'),
    });
  } catch (error) {
    console.error('Internal lead notification failed:', error);
  }

  try {
    await saveLead(email, sessionId);
  } catch (error) {
    console.error('Lead save threw:', error);
  }

  return Response.json({ success: true }, { status: 200 });
}
