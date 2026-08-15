'use server';

// Server Action called by the "Show phone number" button.
//
// Why a Server Action and not an API route: the route would have to be an
// open endpoint the browser can POST to, which means anyone could inflate a
// provider's numbers. Those numbers are exactly what you would later show a
// provider, so they need to be defensible. Server Actions are POST endpoints
// Next.js protects with an action ID and an Origin check, and the Supabase
// key never leaves the server.

import { slugifyOutboundName } from '@/lib/outbound-clicks';

type RevealInput = {
  name: string;
  lake: string;
  category: string;
  sourcePage: string;
};

export async function trackPhoneReveal(input: RevealInput) {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Never let tracking break the interaction. The number still shows.
  if (!url || !key) return { ok: false };

  try {
    await fetch(`${url}/rest/v1/rpc/ingest_outbound_click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        payload: {
          destinationType: 'phone_reveal',
          slug: slugifyOutboundName(input.name),
          name: input.name,
          lake: input.lake,
          category: input.category,
          sourcePage: input.sourcePage,
          timestamp: new Date().toISOString(),
        },
      }),
      cache: 'no-store',
    });
    return { ok: true };
  } catch (error) {
    console.error('Phone reveal tracking failed:', error);
    return { ok: false };
  }
}
