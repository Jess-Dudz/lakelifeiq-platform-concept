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

// Palette lifted from the site so the email cannot drift from the product.
const NAVY = '#102b72';
const HEADING = '#132a72';
const CYAN = '#22d3ee';
const ON_CYAN = '#08214f';
const BORDER = '#dbe6ef';
const PAGE_BG = '#eef4f8';
const BODY_TEXT = '#4b5563';

// Every value that reaches this function is either our own catalogue copy or
// a fixed dropdown value, but escaping is cheap and removes the question.
function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string) {
  return (
    '<tr>' +
    `<td style="padding:4px 12px 4px 0;color:${BODY_TEXT};font-size:14px;white-space:nowrap;">${esc(
      label
    )}</td>` +
    `<td style="padding:4px 0;color:${HEADING};font-size:14px;font-weight:bold;">${esc(
      value
    )}</td>` +
    '</tr>'
  );
}

function sectionHeading(text: string) {
  return (
    `<p style="margin:28px 0 10px;color:#0e7490;font-size:11px;` +
    `font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;">${esc(
      text
    )}</p>`
  );
}

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

  // Table-based layout with inline styles. Email clients have no flexbox and
  // strip <style> blocks, so this is deliberately old-fashioned HTML. The
  // logo sits on a navy band with white alt text, which means the header
  // still reads as LakeLifeIQ when a client blocks images by default.
  const setupRows = SETUP_FIELDS.map(([label, key]) => {
    const value = str(payload[key]);
    return value ? row(label, value) : '';
  }).join('');

  const upgradeHtml =
    picks.length > 0
      ? sectionHeading(
          `Suggested upgrades${allowance ? ` (allowance: ${allowance})` : ''}`
        ) +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">' +
        picks
          .map(
            (line) =>
              '<tr><td style="padding:6px 0;border-bottom:1px solid ' +
              BORDER +
              ';color:' +
              HEADING +
              ';font-size:14px;">' +
              esc(line.replace(/^- /, '')) +
              '</td></tr>'
          )
          .join('') +
        '</table>'
      : '';

  const html =
    `<div style="background:${PAGE_BG};padding:24px 12px;font-family:` +
    `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">` +
    `<tr><td style="background:#ffffff;padding:24px 24px 18px;">` +
    `<img src="https://lakelifeiq.com/logo-email.png" width="200" height="77" alt="LakeLifeIQ" ` +
    `style="display:block;border:0;width:200px;height:auto;color:${HEADING};font-size:20px;font-weight:bold;"/>` +
    `</td></tr>` +
    // A thin brand rule instead of a heavy navy block. Keeps the colour
    // present without competing with the logo.
    `<tr><td style="background:${NAVY};height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>` +
    `<tr><td style="padding:26px 24px 32px;">` +
    `<h1 style="margin:0 0 6px;color:${HEADING};font-size:22px;">Your setup recommendation</h1>` +
    `<p style="margin:0;color:${BODY_TEXT};font-size:14px;line-height:1.6;">` +
    `Here is the plan you asked us to send.</p>` +
    sectionHeading('Your setup') +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${setupRows}</table>` +
    sectionHeading('Recommended boat') +
    `<p style="margin:0;color:${HEADING};font-size:18px;font-weight:bold;">` +
    `${esc(boat || 'No exact match')}</p>` +
    (boatRange
      ? `<p style="margin:4px 0 0;color:${BODY_TEXT};font-size:14px;">${esc(
          boatRange
        )}</p>`
      : '') +
    upgradeHtml +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">` +
    `<tr><td style="background:${CYAN};border-radius:999px;">` +
    `<a href="${directoryUrl}" style="display:inline-block;padding:13px 26px;color:${ON_CYAN};` +
    `font-size:14px;font-weight:bold;text-decoration:none;">Find local providers</a>` +
    `</td></tr></table>` +
    `<p style="margin:24px 0 0;color:${BODY_TEXT};font-size:13px;line-height:1.6;">` +
    `Reply to this email if you would like help with any part of it.</p>` +
    `</td></tr>` +
    `<tr><td style="background:${PAGE_BG};padding:16px 24px;border-top:1px solid ${BORDER};">` +
    `<a href="https://lakelifeiq.com" style="color:${HEADING};font-size:12px;text-decoration:none;">` +
    `lakelifeiq.com</a></td></tr>` +
    `</table></div>`;

  // Plain text is kept as the fallback for clients that refuse HTML, and it
  // is what the inbox copy uses.
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
      html,
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
