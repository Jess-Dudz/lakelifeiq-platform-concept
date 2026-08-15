import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
  <img
    src="/hero.png"
    alt="Boating"
    className="absolute inset-0 w-full h-full object-cover object-top"
  />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-2xl px-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Smarter boating starts here.
          </h1>

          <p className="text-white/90 text-lg mb-8">
            Find the right boat, dealer, and setup—without guesswork.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/start"
              className="inline-block rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-600"
            >
              Start Your Plan
            </Link>
            <Link
              href="/dealers"
              className="inline-block rounded-full bg-white px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Explore Dealers
            </Link>
          </div>
        </div>
      </section>
      {/* Card treatment, eyebrows and shadows are lifted from the dealers
          page so the two surfaces read as the same product. The previous
          #d9d9d9 was not in the brand palette and ran across two consecutive
          sections, which flattened the whole page into one grey slab. */}
      <section className="bg-white px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              What you get
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#132a72] md:text-5xl">
              Clear recommendations, not guesswork
            </h2>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: 'Personalized recommendations',
                body: 'Get boat options tailored to how you use the lake, your budget, and your priorities.',
                icon: (
                  <>
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
                  </>
                ),
              },
              {
                title: 'Dealer matching',
                body: 'Find dealers that actually carry what you need, based on location, availability, and fit.',
                icon: (
                  <>
                    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </>
                ),
              },
              {
                title: 'Setup planning',
                body: 'Understand what your boat actually requires, from dock compatibility to accessories.',
                icon: (
                  <>
                    <rect x="6" y="4" width="12" height="17" rx="2" />
                    <path d="M9.5 4h5v2.5h-5z" />
                    <path d="M9.5 11h5M9.5 15h3" />
                  </>
                ),
              },
              {
                title: 'Decision clarity',
                body: 'Compare options with clear tradeoffs so you know why one choice is better.',
                icon: (
                  <>
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="3.5" />
                  </>
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[24px] border border-[#dbe6ef] bg-white p-8 shadow-[0_16px_40px_rgba(8,34,87,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(8,34,87,0.12)]"
              >
                {/* Emoji were rendering differently on every operating system
                    and dated the page more than anything else on it. */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef7fb] text-cyan-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    {card.icon}
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#132a72]">
                  {card.title}
                </h3>
                <p className="mt-3 leading-relaxed text-gray-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef4f8] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              See it in action
            </p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold leading-[1.15] tracking-tight text-[#132a72] md:text-5xl">
              LakeLifeIQ doesn&rsquo;t stop at the boat
              <span className="mt-1 block">it maps the real setup around it.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-gray-600">
              Local providers, lake-specific logic, and a budget-aware plan
              built around the boat first.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.85fr_auto_1.4fr]">
            <div className="rounded-[24px] border border-[#dbe6ef] bg-white p-7 shadow-[0_16px_40px_rgba(8,34,87,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Input
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ['Lake', 'Table Rock Lake'],
                  ['Usage', 'Family recreation'],
                  ['Dock', 'Covered slip'],
                  ['Seating area', 'Yes'],
                  ['Total project budget', '$150k+'],
                  ['Cover need', 'Required'],
                  ['Cover automation', 'Required'],
                  ['Priorities', 'Comfort + low maintenance'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 border-b border-[#eef4f8] pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-right font-semibold text-[#132a72]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Rotates to point down once the grid stacks. The old arrow kept
                pointing right into empty space on mobile. */}
            <div className="flex items-center justify-center lg:h-full">
              <div className="rotate-90 text-4xl font-light text-cyan-500 lg:rotate-0">
                &rarr;
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dbe6ef] bg-white p-7 shadow-[0_16px_40px_rgba(8,34,87,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                LakeLifeIQ plan
              </p>

              <div className="mt-5 space-y-5">
                {[
                  {
                    title: 'Boat-first recommendation',
                    points: [
                      'Top boat is selected first inside the total setup budget',
                      'Upgrades are filtered against the remaining budget after the boat',
                    ],
                  },
                  {
                    title: 'Provider-based lift guidance',
                    points: [
                      'Table Rock lift providers surface only when the dock setup calls for them',
                      'Easier daily-use lift options can rank higher when that preference matters',
                    ],
                  },
                  {
                    title: 'Provider-based covers',
                    points: [
                      'Lake-specific automatic cover providers are recommended ahead of generic cover tiers',
                      'If an automatic cover is required, manual options are held back from the main set',
                    ],
                  },
                  {
                    title: 'Seating-aware comfort logic',
                    points: [
                      'Misting and dock-comfort providers only show when the setup actually includes a seating area',
                      'Comfort recommendations are tied to lake and dock context, not broad boating usage',
                    ],
                  },
                  {
                    title: 'Budget clarity and required items',
                    points: [
                      'Required lift or cover items can still be surfaced even if they likely sit outside the remaining upgrade budget',
                      'The result is a realistic plan, not a stack of individually in-budget guesses',
                    ],
                  },
                ].map((group) => (
                  <div
                    key={group.title}
                    className="border-l-2 border-cyan-200 pl-4"
                  >
                    <h3 className="font-bold text-[#132a72]">{group.title}</h3>
                    <ul className="mt-2 space-y-1.5">
                      {group.points.map((point) => (
                        <li
                          key={point}
                          className="text-sm leading-relaxed text-gray-600"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navy closer bookends the hero and stops the page ending on flat
          white. Matches the dealers hero treatment. */}
      <section className="relative overflow-hidden bg-[#102b72] px-6 py-24 text-center md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.22),_transparent_38%)]" />

        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Start your decision with clarity
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Find the right boat, dealer, and full setup without guesswork.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            {/* This was a <button> with no handler, so the primary call to
                action on the landing page did nothing when clicked. */}
            <Link
              href="/start"
              className="rounded-full bg-cyan-400 px-8 py-4 text-lg font-semibold text-[#08214f] transition hover:bg-cyan-300"
            >
              Get started
            </Link>

            <Link
              href="/dealers"
              className="rounded-full bg-white/10 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/15"
            >
              Explore dealers
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 border-t border-white/10 pt-10 text-sm sm:grid-cols-3">
            {[
              [
                'Tell us your setup',
                'Answer a few quick questions about how you use the lake',
              ],
              ['Get matched', 'See boats, dealers, and setup recommendations'],
              ['Plan with confidence', 'Understand everything before you buy'],
            ].map(([title, body]) => (
              <div key={title}>
                <p className="font-semibold text-cyan-200">{title}</p>
                <p className="mt-1.5 leading-relaxed text-white/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
