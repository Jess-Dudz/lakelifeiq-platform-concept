// lib/events-db.ts
//
// Upcoming boat shows from Supabase.
//
// This replaces a hardcoded date string that had quietly gone stale: the
// dealers page was advertising a February 2026 show in August 2026. The
// view filters on current_date, so that cannot happen again.

export type UpcomingEvent = {
  slug: string;
  name: string;
  dateLabel: string;
  venue: string;
  note: string;
  url: string;
  daysAway: number;
  typeLabel: string;
  whyItMatters: string;
  timingLabel: string;
  isNext: boolean;
};

type DbEvent = {
  slug: string;
  name: string;
  date_label: string;
  venue: string | null;
  city: string | null;
  state_code: string | null;
  note: string | null;
  url: string | null;
  days_away: number;
  type_label: string;
  why_it_matters: string | null;
  timing_label: string;
  is_next: boolean;
};

export async function getUpcomingEvents(): Promise<UpcomingEvent[] | null> {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/v_upcoming_events?select=*&order=starts_on.asc&limit=5&is_active=eq.true`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        // Short cache: this is date-sensitive and should roll over promptly.
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) {
      console.error('Events fetch failed:', res.status);
      return null;
    }

    const rows = (await res.json()) as DbEvent[];
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      dateLabel: r.date_label,
      venue: [r.venue, [r.city, r.state_code].filter(Boolean).join(', ')]
        .filter(Boolean)
        .join(' \u00b7 '),
      note: r.note ?? '',
      url: r.url ?? '#',
      daysAway: r.days_away,
      typeLabel: r.type_label,
      whyItMatters: r.why_it_matters ?? '',
      timingLabel: r.timing_label,
      isNext: r.is_next,
    }));
  } catch (error) {
    console.error('Events fetch threw:', error);
    return null;
  }
}
