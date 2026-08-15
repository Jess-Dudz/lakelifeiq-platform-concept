// lib/providers-db.ts
//
// Fetches the provider directory from Supabase, shaped to the DealerCard
// and ProviderCard types app/dealers/page.tsx already uses. Same approach
// as lib/boats-db.ts: match the existing shape so the page's JSX is
// untouched and only the data source changes.
//
// Falls back to returning null on any failure, which the page treats as
// "use the hardcoded arrays". The directory never goes blank.

const ENGINE_CATEGORIES = ['boats', 'covers', 'lifts', 'comfort'] as const;
export type EngineCategory = (typeof ENGINE_CATEGORIES)[number];

export type DbDealerCard = {
  name: string;
  lake: string;
  specialties: string[];
  note: string;
  url: string;
  phone?: string;
  hasWebsite: boolean;
  score?: number;
};

export type DbProviderCard = {
  name: string;
  lakes: string[];
  systems: string[];
  serviceTypes: string[];
  note: string;
  url?: string;
  phone?: string;
  hasWebsite: boolean;
  score?: number;
};

type DirectoryRow = {
  provider_id: number;
  slug: string;
  name: string;
  blurb: string | null;
  website_url: string | null;
  city: string | null;
  street_address: string | null;
  phone: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  category: string;
  confidence_score: number | null;
  lakes: string[];
  capabilities: string[];
  system_brands: string[] | null;
};

/**
 * Only 6 of 104 providers have a website. Everyone has a name and a city,
 * so a Maps search is the reliable destination: directions, hours, phone,
 * and reviews in one tap. For a dock builder that beats a website.
 */
function mapsUrl(name: string, address: string | null, city: string | null) {
  // Searching by business name matched the wrong company (a "Sho-Me Mister"
  // search returned a pest control firm). A full street address is exact.
  // Only fall back to name + city when there is no address at all.
  const q = address
    ? encodeURIComponent(address)
    : encodeURIComponent([name, city].filter(Boolean).join(' '));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * 87 of 104 providers have no hand-written blurb. Rather than show an empty
 * card, state what is actually known. Honest and still useful.
 */
function buildNote(r: DirectoryRow) {
  if (r.blurb) return r.blurb;

  const bits: string[] = [];
  if (r.capabilities?.length) bits.push(r.capabilities.slice(0, 3).join(', '));
  if (r.city) bits.push(r.city);
  if (r.google_rating && r.google_review_count) {
    bits.push(
      `${r.google_rating} stars from ${r.google_review_count} Google reviews`
    );
  }
  return bits.join(' \u00b7 ') || 'Local provider.';
}

// Accept the common naming variants. Supabase's own docs use the
// NEXT_PUBLIC_ prefix, so it is very easy to end up with a mix.
function resolveEnv(candidates: string[]) {
  for (const name of candidates) {
    const v = process.env[name];
    if (v && v.trim()) return { name, value: v.trim() };
  }
  return null;
}

async function fetchDirectory(): Promise<DirectoryRow[] | null> {
  const urlVar = resolveEnv([
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_PROJECT_URL',
  ]);
  const keyVar = resolveEnv([
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_KEY',
  ]);

  if (!urlVar || !keyVar) {
    // Log the NAMES of every Supabase-ish variable that exists, never the
    // values. This turns "not configured" into an actionable message.
    const present = Object.keys(process.env)
      .filter((k) => k.toUpperCase().includes('SUPABASE'))
      .sort();
    console.warn(
      'Supabase not configured. url=' + (urlVar?.name ?? 'MISSING') +
      ' key=' + (keyVar?.name ?? 'MISSING') +
      ' | SUPABASE-ish vars present: ' +
      (present.length ? present.join(', ') : 'NONE')
    );
    return null;
  }

  const url = urlVar.value.replace(/\/+$/, '');
  const key = keyVar.value;
  console.info('Directory using ' + urlVar.name + ' + ' + keyVar.name);

  try {
    const res = await fetch(`${url}/rest/v1/v_provider_directory?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      // The directory changes when you edit it, not per request.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('Directory fetch failed:', res.status);
      return null;
    }

    const rows = (await res.json()) as DirectoryRow[];
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch (error) {
    console.error('Directory fetch threw:', error);
    return null;
  }
}

export async function getDirectory(): Promise<{
  dealers: DbDealerCard[];
  covers: DbProviderCard[];
  lifts: DbProviderCard[];
  comfort: DbProviderCard[];
} | null> {
  const rows = await fetchDirectory();
  if (!rows) return null;

  // The page renders one dealer card per lake, and no boat dealer in the
  // catalog serves both lakes, so this cannot produce duplicates today.
  const dealers: DbDealerCard[] = rows
    .filter((r) => r.category === 'boats')
    .flatMap((r) =>
      (r.lakes ?? []).map((lake) => ({
        name: r.name,
        lake,
        specialties: (r.capabilities ?? []).slice(0, 3),
        note: buildNote(r),
        url: r.website_url ?? mapsUrl(r.name, r.street_address, r.city),
        phone: r.phone ?? undefined,
        hasWebsite: Boolean(r.website_url),
        score: r.confidence_score ?? 0,
      }))
    )
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name));

  const toProviderCards = (category: EngineCategory): DbProviderCard[] =>
    rows
      .filter((r) => r.category === category)
      .map((r) => ({
        name: r.name,
        lakes: r.lakes ?? [],
        systems: r.system_brands ?? [],
        serviceTypes: r.capabilities ?? [],
        note: buildNote(r),
        url: r.website_url ?? mapsUrl(r.name, r.street_address, r.city),
        phone: r.phone ?? undefined,
        hasWebsite: Boolean(r.website_url),
        score: r.confidence_score ?? 0,
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name));

  return {
    dealers,
    covers: toProviderCards('covers'),
    lifts: toProviderCards('lifts'),
    comfort: toProviderCards('comfort'),
  };
}
