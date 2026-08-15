import Link from 'next/link';
import { upgrades } from '../data/upgrades';
import { buildOutboundHref } from '@/lib/outbound-clicks';
import { getDirectory } from '@/lib/providers-db';
import PhoneReveal from './phone-reveal';
import { getUpcomingEvents } from '@/lib/events-db';

type Lake = 'Lake of the Ozarks' | 'Table Rock Lake';
type CategoryFilter = 'all' | 'boats' | 'covers' | 'lifts' | 'comfort';

type DealerCard = {
  name: string;
  lake: Lake;
  specialties: string[];
  note: string;
  url: string;
  phone?: string;
  hasWebsite?: boolean;
};

type ProviderCard = {
  name: string;
  lakes: Lake[];
  systems: string[];
  serviceTypes: string[];
  note: string;
  url?: string;
  phone?: string;
  hasWebsite?: boolean;
};

const boatDealers: DealerCard[] = [
  {
    name: 'Big Thunder Marine',
    lake: 'Lake of the Ozarks',
    specialties: ['Performance boats', 'Luxury day boats', 'Marina support'],
    note:
      'Strong Lake of the Ozarks presence with premium inventory and marina-backed service.',
    url: 'https://bigthundermarine.com/',
  },
  {
    name: 'Performance Marine Watersports',
    lake: 'Lake of the Ozarks',
    specialties: ['MasterCraft', 'Supra', 'Moomba'],
    note:
      'Tow-sports focused dealership with new, used, service, and pro-shop support.',
    url: 'https://www.performanceloz.com/',
  },
  {
    name: 'Heartland Marine',
    lake: 'Lake of the Ozarks',
    specialties: ['Pre-owned boats', 'Tritoons', 'Value-focused families'],
    note:
      'Useful stop for mixed-family boating needs and broader pre-owned inventory.',
    url: 'https://www.heartlandmarineboats.com/pages/about-us',
  },
  {
    name: 'The Harbor',
    lake: 'Table Rock Lake',
    specialties: ['Nautique', 'Cobalt', 'Harris'],
    note:
      'A polished Table Rock dealer option spanning premium tow, runabout, and pontoon families.',
    url: 'https://www.theharbor.com/',
  },
  {
    name: 'Ulrich Marine Center',
    lake: 'Table Rock Lake',
    specialties: ['Tri-Lakes market', 'Sales', 'Service'],
    note:
      'Longstanding regional marine dealership serving the broader Table Rock and Tri-Lakes area.',
    url: 'https://www.ulrichmarine.com/about-us-boats-dealership--info',
  },
  {
    name: 'Hughes Marine - Table Rock Lake',
    lake: 'Table Rock Lake',
    specialties: ['Centurion', 'Surf-focused buyers', 'Lake setup support'],
    note:
      'A surf-oriented local option for shoppers prioritizing wake and surf performance.',
    url: 'https://centurionboats.com/dealer/hughes-marine-table-rock-lake/',
  },
];

const upcomingShows = [
  {
    name: 'Overland Park Boat Show',
    date: 'February 19-22, 2026',
    location: 'Overland Park Convention Center',
    note: 'Presented by the Lake of the Ozarks Marine Dealers Association.',
    url: 'https://lakeozarkboatdealers.com/boat-shows/overland-park-boat-show/',
  },
  {
    name: 'Dealer Event Calendar',
    date: 'Seasonal regional events',
    location: 'Lake of the Ozarks and Table Rock markets',
    note: 'More local show dates will be added here as the directory expands.',
    url: 'https://lakeozarkboatdealers.com/boat-shows/overland-park-boat-show/',
  },
];

function toUniqueList(values: (string | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

function toUniqueLakes(values: (Lake[] | undefined)[]) {
  return Array.from(new Set(values.flatMap((value) => value ?? []))) as Lake[];
}

function buildProviderCards(
  kind: 'cover' | 'lift' | 'comfort'
): ProviderCard[] {
  const grouped = new Map<string, ProviderCard>();

  upgrades.forEach((item) => {
    const details =
      kind === 'cover' ? item.cover : kind === 'lift' ? item.lift : item.comfort;

    if (!details?.localProvider) return;

    const key = details.localProvider;
    const existing = grouped.get(key);
    const systemBrand =
      'systemBrand' in details ? details.systemBrand : undefined;
    const serviceType =
      kind === 'cover'
        ? item.cover?.coverType
        : kind === 'lift'
        ? item.lift?.liftType
        : item.comfort?.comfortType;

    if (existing) {
      existing.lakes = toUniqueLakes([existing.lakes, details.lakeCoverage]);
      existing.systems = toUniqueList([...existing.systems, systemBrand]);
      existing.serviceTypes = toUniqueList([
        ...existing.serviceTypes,
        serviceType,
      ]);
      existing.url = existing.url ?? details.websiteUrl;
      return;
    }

    grouped.set(key, {
      name: details.localProvider,
      lakes: details.lakeCoverage ?? [],
      systems: toUniqueList([systemBrand]),
      serviceTypes: toUniqueList([serviceType]),
      note: item.description,
      url: details.websiteUrl,
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeLakeFilter(value?: string | string[]) {
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved === 'Lake of the Ozarks' || resolved === 'Table Rock Lake'
    ? resolved
    : 'all';
}

function normalizeCategoryFilter(value?: string | string[]) {
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved === 'boats' ||
    resolved === 'covers' ||
    resolved === 'lifts' ||
    resolved === 'comfort'
    ? resolved
    : 'all';
}

function buildFilterHref(
  lake: string,
  category: CategoryFilter,
  sessionId?: string
) {
  const params = new URLSearchParams();

  if (lake !== 'all') {
    params.set('lake', lake);
  }

  if (category !== 'all') {
    params.set('category', category);
  }

  // Without this, clicking any filter drops the plan attribution and every
  // click after that point looks like anonymous directory browsing.
  if (sessionId) {
    params.set('session', sessionId);
  }

  const query = params.toString();
  return query ? `/dealers?${query}` : '/dealers';
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] border border-[#dbe6ef] bg-white p-6 text-gray-600 shadow-[0_16px_40px_rgba(8,34,87,0.08)]">
      No {label} are currently listed for this filter.
    </div>
  );
}


function ViewAllLink({
  shown,
  total,
  category,
  label,
  lake,
  sessionId,
}: {
  shown: number;
  total: number;
  category: string;
  label: string;
  lake: string;
  sessionId?: string;
}) {
  if (shown >= total) return null;
  const params = new URLSearchParams({ category });
  if (lake !== 'all') params.set('lake', lake);
  if (sessionId) params.set('session', sessionId);
  return (
    <div className="mt-6 flex justify-center">
      <Link
        href={`/dealers?${params.toString()}`}
        className="inline-flex items-center gap-2 rounded-full border border-[#dbe6ef] bg-white px-5 py-3 text-sm font-semibold text-[#132a72] transition hover:border-cyan-300 hover:bg-cyan-50"
      >
        View all {total} {label}
      </Link>
    </div>
  );
}

function ServiceCard({
  title,
  eyebrow,
  note,
  lakes,
  systems,
  serviceTypes,
  outboundHref,
  phone,
  hasWebsite,
  category,
  sourcePage,
}: {
  title: string;
  eyebrow: string;
  note: string;
  lakes: Lake[];
  systems: string[];
  serviceTypes: string[];
  outboundHref?: string;
  phone?: string;
  hasWebsite?: boolean;
  category?: string;
  sourcePage?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-[24px] border border-[#dbe6ef] bg-white p-6 shadow-[0_16px_40px_rgba(8,34,87,0.08)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
        {eyebrow}
      </p>
      <h3 className="text-2xl font-bold text-[#132a72]">{title}</h3>
      {phone && (
        <PhoneReveal
          phone={phone}
          name={title}
          lake={lakes[0] ?? 'Unknown'}
          category={category ?? 'unknown'}
          sourcePage={sourcePage ?? '/dealers'}
        />
      )}
      <p className="mt-3 text-sm leading-relaxed text-gray-600">{note}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {lakes.map((lake) => (
          <span
            key={lake}
            className="rounded-full bg-[#eef7fb] px-3 py-1 text-xs font-semibold text-[#132a72]"
          >
            {lake}
          </span>
        ))}
      </div>

      {systems.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Systems / brands
          </p>
          <p className="mt-2 text-sm font-medium text-gray-800">
            {systems.join(' • ')}
          </p>
        </div>
      )}

      {serviceTypes.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Best fit for
          </p>
          <p className="mt-2 text-sm font-medium text-gray-800">
            {serviceTypes.join(' • ')}
          </p>
        </div>
      )}

      {/* Only show provider website buttons when a verified URL exists in the source data. */}
      {outboundHref ? (
        <div className="mt-auto pt-6">
          <a
            href={outboundHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
          >
            Visit Website
          </a>
        </div>
      ) : null}
    </div>
  );
}

function formatProviderLakeMetadata(
  lakes: Lake[],
  selectedLake: Lake | 'all'
): string {
  if (selectedLake !== 'all') {
    return selectedLake;
  }

  return lakes.length > 0 ? lakes.join(' / ') : 'Unknown';
}

export default async function DealersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    lake?: string | string[];
    category?: string | string[];
    session?: string | string[];
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedLake = normalizeLakeFilter(resolvedSearchParams?.lake);
  const selectedCategory = normalizeCategoryFilter(
    resolvedSearchParams?.category
  );

  // Present when the visitor arrived from a completed plan. Validated as a
  // UUID so nothing malformed reaches ingest_outbound_click.
  const rawSession = Array.isArray(resolvedSearchParams?.session)
    ? resolvedSearchParams?.session[0]
    : resolvedSearchParams?.session;
  const sessionId =
    rawSession &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      rawSession
    )
      ? rawSession
      : undefined;

  // Database first. getDirectory() returns null on any failure, in which
  // case we fall back to the hardcoded arrays below and the page renders
  // exactly as it did before Supabase existed.
  const directory = await getDirectory();

  // Real dates from the database, filtered to what has not happened yet.
  // Falls back to the hardcoded array only if the fetch fails.
  const dbEvents = await getUpcomingEvents();
  const shows =
    dbEvents?.map((e) => ({
      name: e.name,
      date: e.dateLabel,
      location: e.venue,
      note: e.note,
      url: e.url,
      timing: e.timingLabel,
      daysAway: e.daysAway,
      typeLabel: e.typeLabel,
    })) ??
    upcomingShows.map((s) => ({
      ...s,
      timing: '',
      daysAway: 0,
      typeLabel: 'Trade show',
    }));

  // The hero card only ever renders the next show in full. Everything else
  // collapses behind a native <details> toggle so the card stays short and
  // the first dealer card stays above the fold.
  const hasShows = shows.length > 0;
  const nextShow = shows[0];
  const laterShows = shows.slice(1);

  const sourceDealers = (directory?.dealers ?? boatDealers) as DealerCard[];
  const sourceCovers = (directory?.covers ??
    buildProviderCards('cover')) as ProviderCard[];
  const sourceLifts = (directory?.lifts ??
    buildProviderCards('lift')) as ProviderCard[];
  const sourceComfort = (directory?.comfort ??
    buildProviderCards('comfort')) as ProviderCard[];

  const filteredBoatDealers = sourceDealers.filter(
    (dealer) => selectedLake === 'all' || dealer.lake === selectedLake
  );
  const coverProviders = sourceCovers.filter(
    (provider) =>
      selectedLake === 'all' || provider.lakes.includes(selectedLake)
  );
  const liftProviders = sourceLifts.filter(
    (provider) =>
      selectedLake === 'all' || provider.lakes.includes(selectedLake)
  );
  const comfortProviders = sourceComfort.filter(
    (provider) =>
      selectedLake === 'all' || provider.lakes.includes(selectedLake)
  );

  // Preview mode: with no category chosen, show the top few per category
  // instead of all 58 cards. Selecting a category reveals the full list.
  const isPreview = selectedCategory === 'all';
  const PREVIEW_COUNT = 4;
  const cap = <T,>(list: T[]) => (isPreview ? list.slice(0, PREVIEW_COUNT) : list);

  const showBoats = selectedCategory === 'all' || selectedCategory === 'boats';
  const showCovers =
    selectedCategory === 'all' || selectedCategory === 'covers';
  const showLifts = selectedCategory === 'all' || selectedCategory === 'lifts';
  const showComfort =
    selectedCategory === 'all' || selectedCategory === 'comfort';
  const hasSetupContext =
    (resolvedSearchParams?.lake && selectedLake !== 'all') ||
    (resolvedSearchParams?.category && selectedCategory !== 'all');
  const selectedCategoryLabel =
    selectedCategory === 'boats'
      ? 'Boat Dealers'
      : selectedCategory === 'covers'
      ? 'Covers'
      : selectedCategory === 'lifts'
      ? 'Lifts'
      : selectedCategory === 'comfort'
      ? 'Cooling / Comfort'
      : 'All categories';
  const sourcePage = buildFilterHref(selectedLake, selectedCategory, sessionId);

  return (
    <main className="min-h-screen bg-[#eef4f8] text-gray-900">
      <section className="relative overflow-hidden bg-[#102b72] px-6 py-16 text-white md:px-8 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.22),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_28%)]" />

        <div
          className={`relative mx-auto grid max-w-6xl gap-8 ${
            hasShows ? 'lg:grid-cols-[1.5fr_0.9fr]' : ''
          }`}
        >
          <div>
            <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Dealer Directory
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
              Find the local partners behind a confident lake setup.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
              Browse boat dealers and setup providers across Lake of the Ozarks
              and Table Rock Lake, from towboat showrooms to covers, lifts, and
              dock-comfort specialists.
            </p>

          </div>

          {/* No upcoming shows means no card at all. The grid above drops to
              a single column so the hero copy does not sit next to a gap. */}
          {hasShows && nextShow && (
            <aside className="self-start rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.16)] backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Upcoming Shows
              </p>

              {/* The next show gets full detail. It is the only one close
                  enough to act on, so it earns the space. */}
              <a
                href={nextShow.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block rounded-[18px] border border-cyan-300/25 bg-[#15357f]/85 p-4 transition hover:bg-[#19418f]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-cyan-200">
                    {nextShow.date}
                  </p>
                  <span className="shrink-0 rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-100">
                    {nextShow.daysAway === 0
                      ? 'Today'
                      : nextShow.daysAway <= 30
                      ? `${nextShow.daysAway} days`
                      : nextShow.timing}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold">{nextShow.name}</h2>
                <p className="mt-1.5 text-sm text-white/75">
                  {nextShow.typeLabel} &middot; {nextShow.location}
                </p>
              </a>

              {/* Native <details> keeps this a server component. The rest of
                  the season is months out, so it stays closed by default. */}
              {laterShows.length > 0 && (
                <details className="group mt-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-xs font-semibold text-cyan-100/90 transition hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                    <span>
                      {laterShows.length} more{' '}
                      {laterShows.length === 1 ? 'show' : 'shows'} this season
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </summary>

                  <div className="mt-1 space-y-0.5">
                    {laterShows.map((show) => (
                      <a
                        key={show.name}
                        href={show.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-baseline justify-between gap-4 rounded-[12px] px-3 py-2 transition hover:bg-white/10"
                      >
                        <span className="text-sm font-medium text-white/85">
                          {show.name}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-cyan-200/80">
                          {show.date}
                        </span>
                      </a>
                    ))}
                  </div>
                </details>
              )}
            </aside>
          )}
        </div>
      </section>

      <section className="px-6 py-14 md:px-8">
        <div className="mx-auto max-w-6xl">
          {hasSetupContext && (
            <div className="mb-8 rounded-[24px] border border-cyan-200 bg-white p-5 shadow-[0_16px_40px_rgba(8,34,87,0.08)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Filtered for your setup
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    Dealer listings are pre-filtered using the context carried
                    over from your recommendation flow.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedLake !== 'all' && (
                    <span className="rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72]">
                      Lake: {selectedLake}
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="rounded-full bg-[#132a72] px-4 py-2 text-sm font-semibold text-white">
                      Category: {selectedCategoryLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mb-10 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Link
                href={buildFilterHref('all', selectedCategory, sessionId)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedLake === 'all'
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-[#c7d7e4] bg-white text-[#132a72] hover:border-cyan-300'
                }`}
              >
                All lakes
              </Link>
              {(['Lake of the Ozarks', 'Table Rock Lake'] as Lake[]).map((lake) => (
                <Link
                  key={lake}
                  href={buildFilterHref(lake, selectedCategory, sessionId)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedLake === lake
                      ? 'border-cyan-500 bg-cyan-500 text-white'
                      : 'border-[#c7d7e4] bg-white text-[#132a72] hover:border-cyan-300'
                  }`}
                >
                  {lake}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {(
                [
                  ['all', 'All categories'],
                  ['boats', 'Boat Dealers'],
                  ['covers', 'Covers'],
                  ['lifts', 'Lifts'],
                  ['comfort', 'Cooling / Comfort'],
                ] as [CategoryFilter, string][]
              ).map(([category, label]) => (
                <Link
                  key={category}
                  href={buildFilterHref(selectedLake, category, sessionId)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === category
                      ? 'border-[#132a72] bg-[#132a72] text-white'
                      : 'border-[#c7d7e4] bg-white text-[#132a72] hover:border-cyan-300'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-14">
            {showBoats && (
              <section id="boat-dealers">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      Boat Dealers
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-[#132a72]">
                      Start with the right showroom partners
                    </h2>
                  </div>
                  <Link
                    href="/start"
                    className="rounded-full bg-[#132a72] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f235f]"
                  >
                    Get Matched
                  </Link>
                </div>

                {filteredBoatDealers.length > 0 ? (
                  <>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {cap(filteredBoatDealers).map((dealer) => {
                      const outboundHref = buildOutboundHref({
                        destinationType: 'dealer',
                        sessionId,
                        name: dealer.name,
                        lake: dealer.lake,
                        category: 'boats',
                        sourcePage,
                        destinationUrl: dealer.url,
                      });

                      return (
                        <div
                          key={`${dealer.name}-${dealer.lake}`}
                          className="flex h-full flex-col rounded-[24px] border border-[#dbe6ef] bg-white p-6 shadow-[0_16px_40px_rgba(8,34,87,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(8,34,87,0.12)]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                              {dealer.lake}
                            </p>
                            <span className="rounded-full bg-[#eef7fb] px-3 py-1 text-xs font-semibold text-[#132a72]">
                              Boat Dealer
                            </span>
                          </div>
                          <h3 className="mt-3 text-2xl font-bold text-[#132a72]">
                            {dealer.name}
                          </h3>
                          {dealer.phone && (
                            <PhoneReveal
                              phone={dealer.phone}
                              name={dealer.name}
                              lake={dealer.lake}
                              category="boats"
                              sourcePage={sourcePage}
                            />
                          )}
                          <p className="mt-3 text-sm leading-relaxed text-gray-600">
                            {dealer.note}
                          </p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {dealer.specialties.map((specialty) => (
                              <span
                                key={specialty}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                          <div className="mt-auto pt-6">
                            <a
                              href={outboundHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600"
                            >
                              {dealer.hasWebsite ? 'Visit Website' : 'View on Map'}
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ViewAllLink shown={cap(filteredBoatDealers).length} total={filteredBoatDealers.length} category="boats" label="boat dealers" lake={selectedLake} sessionId={sessionId} />
                  </>
                ) : (
                  <EmptyState label="boat dealers" />
                )}
              </section>
            )}

            {showCovers && (
              <section id="covers">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Covers
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-[#132a72]">
                    Cover providers already mapped into recommendations
                  </h2>
                </div>

                {coverProviders.length > 0 ? (
                  <>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {cap(coverProviders).map((provider) => (
                      // Provider outbound clicks stay privacy-safe and only use known website URLs.
                      <ServiceCard
                        key={provider.name}
                        title={provider.name}
                        eyebrow="Cover Provider"
                        category="covers"
                        note={provider.note}
                        lakes={provider.lakes}
                        systems={provider.systems}
                        serviceTypes={provider.serviceTypes}
                        phone={provider.phone}
                        hasWebsite={provider.hasWebsite}
                        sourcePage={sourcePage}
                        outboundHref={
                          provider.url
                            ? buildOutboundHref({
                                destinationType: 'provider',
                                sessionId,
                                name: provider.name,
                                lake: formatProviderLakeMetadata(
                                  provider.lakes,
                                  selectedLake
                                ),
                                category: 'covers',
                                sourcePage,
                                destinationUrl: provider.url,
                              })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  <ViewAllLink shown={cap(coverProviders).length} total={coverProviders.length} category="covers" label="cover providers" lake={selectedLake} sessionId={sessionId} />
                  </>
                ) : (
                  <EmptyState label="cover providers" />
                )}
              </section>
            )}

            {showLifts && (
              <section id="lifts">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Lifts
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-[#132a72]">
                    Local lift providers for covered-slip planning
                  </h2>
                </div>

                {liftProviders.length > 0 ? (
                  <>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {cap(liftProviders).map((provider) => (
                      <ServiceCard
                        key={provider.name}
                        title={provider.name}
                        eyebrow="Lift Provider"
                        category="lifts"
                        note={provider.note}
                        lakes={provider.lakes}
                        systems={provider.systems}
                        serviceTypes={provider.serviceTypes}
                        phone={provider.phone}
                        hasWebsite={provider.hasWebsite}
                        sourcePage={sourcePage}
                        outboundHref={
                          provider.url
                            ? buildOutboundHref({
                                destinationType: 'provider',
                                sessionId,
                                name: provider.name,
                                lake: formatProviderLakeMetadata(
                                  provider.lakes,
                                  selectedLake
                                ),
                                category: 'lifts',
                                sourcePage,
                                destinationUrl: provider.url,
                              })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  <ViewAllLink shown={cap(liftProviders).length} total={liftProviders.length} category="lifts" label="lift providers" lake={selectedLake} sessionId={sessionId} />
                  </>
                ) : (
                  <EmptyState label="lift providers" />
                )}
              </section>
            )}

            {showComfort && (
              <section id="comfort">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                    Cooling / Comfort
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-[#132a72]">
                    Dock-comfort partners for shade, cooling, and summer usability
                  </h2>
                </div>

                {comfortProviders.length > 0 ? (
                  <>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {cap(comfortProviders).map((provider) => (
                      <ServiceCard
                        key={provider.name}
                        title={provider.name}
                        eyebrow="Comfort Provider"
                        category="comfort"
                        note={provider.note}
                        lakes={provider.lakes}
                        systems={provider.systems}
                        serviceTypes={provider.serviceTypes}
                        phone={provider.phone}
                        hasWebsite={provider.hasWebsite}
                        sourcePage={sourcePage}
                        outboundHref={
                          provider.url
                            ? buildOutboundHref({
                                destinationType: 'provider',
                                sessionId,
                                name: provider.name,
                                lake: formatProviderLakeMetadata(
                                  provider.lakes,
                                  selectedLake
                                ),
                                category: 'comfort',
                                sourcePage,
                                destinationUrl: provider.url,
                              })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  <ViewAllLink shown={cap(comfortProviders).length} total={comfortProviders.length} category="comfort" label="comfort providers" lake={selectedLake} sessionId={sessionId} />
                  </>
                ) : (
                  <EmptyState label="comfort providers" />
                )}
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
