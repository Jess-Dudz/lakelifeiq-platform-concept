// lib/boats-db.ts
//
// Fetches boats from Supabase and returns them in EXACTLY the shape
// app/data/boats.ts already exports, plus one new field: fitScore.
//
// Why this shape: results-client.tsx has ~1,400 lines of working scoring
// logic built against the Boat type. Rewriting that to speak a new shape
// is a large change with a large blast radius. Matching the existing shape
// means the swap is three edits and the logic is untouched.
//
// SAFETY: if Supabase is unreachable or misconfigured, this returns the
// static array from app/data/boats.ts. The site degrades to exactly the
// behaviour it has today rather than showing an error page. A live site
// should never go down because a database is having a bad afternoon.

import { boats as staticBoats, type Boat } from '@/app/data/boats';

export type BoatWithFit = Boat & {
  /** 1-5 from hull_use_case_fit, for the CURRENTLY SELECTED use case.
   *  5 = purpose-built, 2 = possible but a compromise. */
  fitScore: number;
  fitExplanation: string;
};

// Database use_case values -> the labels on the /start dropdown.
// 'surf' has no /start equivalent, so it is intentionally unmapped.
const USE_CASE_TO_LABEL: Record<string, string> = {
  tow_sports: 'Wakeboarding',
  cruising: 'Cruising',
  family_recreation: 'Family recreation',
  fishing: 'Fishing',
  entertaining: 'Entertaining',
};

const LABEL_TO_USE_CASE: Record<string, string> = Object.fromEntries(
  Object.entries(USE_CASE_TO_LABEL).map(([k, v]) => [v, k])
);

type DbBoat = {
  slug: string;
  brand: string;
  model: string;
  family: string | null;
  status: string | null;
  model_years: string | null;
  hull_type: string | null;
  budget_band: string | null;
  luxury_tier: string | null;
  family_friendly: boolean | null;
  low_maintenance: boolean | null;
  performance: boolean | null;
  comfort: boolean | null;
  easy_dock_access: boolean | null;
  upgrade_potential: boolean | null;
  dock_compatibility: string[] | null;
  best_for: string[] | null;
  boat_use_cases: { use_case: string; fit_score: number }[] | null;
};

function fitExplanation(score: number) {
  if (score >= 5) return 'Purpose-built for this';
  if (score === 4) return 'Very well suited';
  if (score === 3) return 'Workable, not what it is designed for';
  return 'Possible, but a compromise';
}

/**
 * @param selectedUsage a /start label, e.g. "Cruising"
 */
export async function getBoats(selectedUsage: string): Promise<BoatWithFit[]> {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const fallback = (): BoatWithFit[] =>
    staticBoats.map((b) => ({ ...b, fitScore: 3, fitExplanation: '' }));

  if (!url || !key) {
    console.warn('Supabase not configured; serving static boat catalog.');
    return fallback();
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/boats` +
        `?select=slug,brand,model,family,status,model_years,hull_type,budget_band,` +
        `luxury_tier,family_friendly,low_maintenance,performance,comfort,` +
        `easy_dock_access,upgrade_potential,dock_compatibility,best_for,` +
        `boat_use_cases(use_case,fit_score)` +
        `&is_active=eq.true`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        // Boats change rarely. Cache for an hour rather than hitting the
        // database on every pageview.
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.error('Boat fetch failed:', res.status);
      return fallback();
    }

    const rows = (await res.json()) as DbBoat[];
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error('Boat fetch returned nothing; using static catalog.');
      return fallback();
    }

    const wantedUseCase = LABEL_TO_USE_CASE[selectedUsage];

    return rows.map((r) => {
      const cases = r.boat_use_cases ?? [];
      const match = cases.find((c) => c.use_case === wantedUseCase);

      return {
        id: r.slug,
        brand: r.brand,
        family: r.family ?? '',
        model: r.model,
        status: (r.status as Boat['status']) ?? 'current',
        modelYears: r.model_years ?? '',
        category: (r.hull_type as Boat['category']) ?? 'cruising',
        budget: (r.budget_band as Boat['budget']) ?? '60-90',
        // Only use cases the boat actually qualifies for, derived from the
        // fit matrix rather than the old hand-maintained array.
        usage: cases
          .map((c) => USE_CASE_TO_LABEL[c.use_case])
          .filter(Boolean) as Boat['usage'],
        familyFriendly: r.family_friendly ?? false,
        lowMaintenance: r.low_maintenance ?? false,
        performance: r.performance ?? false,
        comfort: r.comfort ?? false,
        easyDockAccess: r.easy_dock_access ?? false,
        upgradePotential: r.upgrade_potential ?? false,
        luxuryTier: (r.luxury_tier as Boat['luxuryTier']) ?? 'mid',
        dockCompatibility: r.dock_compatibility ?? [],
        bestFor: r.best_for ?? [],
        notes: [],
        fitScore: match?.fit_score ?? 0,
        fitExplanation: fitExplanation(match?.fit_score ?? 0),
      };
    });
  } catch (error) {
    console.error('Boat fetch threw:', error);
    return fallback();
  }
}
