'use client';

import { useMemo, useState } from 'react';
import { upgrades } from '../data/upgrades';
import { boats } from '../data/boats';
import { useSearchParams } from 'next/navigation';


export default function ResultsPage() {
  const searchParams = useSearchParams();

  const selectedUsage = searchParams.get('usage') ?? 'Wakeboarding';
  const selectedBudget = searchParams.get('budget') ?? '60-90';
  const selectedDockType = searchParams.get('dockType') ?? '';

  const [openBoatId, setOpenBoatId] = useState<string | null>(null);
  const [showUpgradeDetails, setShowUpgradeDetails] = useState(false);

  const recommendations = useMemo(() => {
    return boats.filter((boat) => {
      return (
        boat.usage.includes(selectedUsage as any) &&
        boat.budget === selectedBudget
      );
    });
  }, [selectedUsage, selectedBudget]);

  const recommendedUpgrades = useMemo(() => {
    return upgrades.filter((item) => {
      return (
        (!item.match.usage || item.match.usage.includes(selectedUsage)) &&
        (!item.match.dockType ||
          item.match.dockType.includes(selectedDockType))
      );
    });
  }, [selectedUsage, selectedDockType]);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-20">
      <img
        src="/lake-bg2.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-[#0b1f4d]/60" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <p className="mb-4 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
            Results
          </p>

          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Your Recommendation
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-white/85">
            Based on your inputs, here are your best matches.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-6">
            {recommendations.length > 0 ? (
              recommendations.map((boat) => {
                const isOpen = openBoatId === boat.id;

                return (
                  <section
                    key={boat.id}
                    className="max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] hover:translate-y-[-4px] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)] transition duration-300 ease-out"
                  >
                    <div className="h-2 bg-cyan-500" />

                    <div className="p-8">
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                            Recommended model
                          </p>
                          <h2 className="text-3xl font-bold text-[#132a72]">
                            {boat.brand} {boat.model}
                          </h2>
                        </div>

                        <div className="shrink-0 rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72]">
                          {boat.budget === '30-60'
                            ? '$30k–$60k'
                            : boat.budget === '60-90'
                            ? '$60k–$90k'
                            : boat.budget === '90-150'
                            ? '$90k–$150k'
                            : '$150k+'}
                        </div>
                      </div>

                      <ul className="space-y-3 text-gray-700">
                        {boat.notes.map((note, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 text-cyan-600">✔</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenBoatId(isOpen ? null : boat.id)
                        }
                        className="mt-6 rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72] hover:bg-cyan-100 transition"
                      >
                        {isOpen ? 'Hide details' : 'Expand details'}
                      </button>

                      {isOpen && (
                        <div className="mt-6 rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <h3 className="mb-3 text-lg font-bold text-[#132a72]">
                            Why this match works
                          </h3>
                          <ul className="space-y-2 text-gray-700 text-sm">
                            <li>• Strong fit for {selectedUsage.toLowerCase()} use cases</li>
                            <li>• Falls within your selected budget range</li>
                            <li>• Good candidate for your dock setup and future upgrades</li>
                            <li>• Useful as a starting point for a full lake-day setup plan</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })
            ) : (
              <section className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                <p className="text-gray-500">
                  No exact matches found — try adjusting your inputs.
                </p>
              </section>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <section className="max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] hover:translate-y-[-4px] hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)] transition duration-300 ease-out">
              <div className="h-2 bg-cyan-500" />

              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-[#132a72]">
                    Recommended Setup Upgrades
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowUpgradeDetails((prev) => !prev)}
                    className="rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72] hover:bg-cyan-100 transition"
                  >
                    {showUpgradeDetails ? 'Hide details' : 'Expand details'}
                  </button>
                </div>

                <div className="space-y-4">
                  {recommendedUpgrades.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5"
                    >
                      <p className="mb-2 text-sm font-semibold text-cyan-600">
                        {item.category}
                      </p>

                      <h3 className="mb-2 text-xl font-bold text-[#132a72]">
                        {item.title}
                      </h3>

                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>

                {showUpgradeDetails && (
                  <div className="mt-6 rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                    <h3 className="mb-3 text-lg font-bold text-[#132a72]">
                      Why these upgrades matter
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Helps protect your boat and dock investment</li>
                      <li>• Improves comfort and day-to-day lake usability</li>
                      <li>• Supports your selected activity and dock type</li>
                      <li>• Creates a more complete setup instead of just a boat purchase</li>
                    </ul>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}