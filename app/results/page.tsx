'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { upgrades } from '../data/upgrades';
import { boats } from '../data/boats';

export default function ResultsPage() {
  const searchParams = useSearchParams();

  const selectedLake = searchParams.get('lake') ?? 'Lake of the Ozarks';
  const selectedUsage = searchParams.get('usage') ?? 'Wakeboarding';
  const selectedBudget = searchParams.get('budget') ?? '60-90';
  const selectedDockType = searchParams.get('dockType') ?? '';
  const selectedGoal = searchParams.get('goal') ?? 'Buy new';
  const selectedPriorities = (searchParams.get('priorities') ?? '')
    .split('|')
    .filter(Boolean);

  const [openBoatId, setOpenBoatId] = useState<string | null>(null);
  const [showUpgradeDetails, setShowUpgradeDetails] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const recommendations = useMemo(() => {
    return boats
      .map((boat) => {
        let score = 0;

        if (boat.usage.includes(selectedUsage as never)) score += 2;
        if (boat.budget === selectedBudget) score += 2;

        const dockCompatibility = (boat as { dockCompatibility?: string[] })
          .dockCompatibility;

        if (
          selectedDockType &&
          dockCompatibility &&
          dockCompatibility.includes(selectedDockType)
        ) {
          score += 1;
        }

        return { ...boat, score };
      })
      .filter((boat) => boat.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [selectedUsage, selectedBudget, selectedDockType]);

  const recommendedUpgrades = useMemo(() => {
    return upgrades.filter((item) => {
      return (
        (!item.match.usage || item.match.usage.includes(selectedUsage)) &&
        (!item.match.dockType ||
          item.match.dockType.includes(selectedDockType))
      );
    });
  }, [selectedUsage, selectedDockType]);

  const budgetLabel =
    selectedBudget === '30-60'
      ? '$30k–$60k'
      : selectedBudget === '60-90'
      ? '$60k–$90k'
      : selectedBudget === '90-150'
      ? '$90k–$150k'
      : '$150k+';

  const topRecommendation = recommendations[0];
  const alternateRecommendations = recommendations.slice(1, 3);

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingLead(true);

    try {
      const response = await fetch('/api/lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: leadForm.name,
            email: leadForm.email,
            phone: leadForm.phone,
            notes: leadForm.notes,
            lake: selectedLake,
            usage: selectedUsage,
            budget: budgetLabel,
            dockType: selectedDockType,
            goal: selectedGoal,
            priorities: selectedPriorities.join(', '),
            recommendedBoat: topRecommendation
              ? `${topRecommendation.brand} ${topRecommendation.model}`
              : 'No exact recommendation',
            recommendedBudget: topRecommendation
              ? topRecommendation.budget === '30-60'
                ? '$30k–$60k'
                : topRecommendation.budget === '60-90'
                ? '$60k–$90k'
                : topRecommendation.budget === '90-150'
                ? '$90k–$150k'
                : '$150k+'
              : budgetLabel,
          }),
        }
      );

      const rawText = await response.text();
      console.log('Lead submit raw response:', rawText);

      let result: { success?: boolean; error?: string } = {};

      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Failed to parse Apps Script response:', parseError);
        alert(`Could not read server response: ${rawText || 'Empty response'}`);
        return;
      }

      console.log('Lead submit result:', result);

      if (result.success) {
        setLeadSuccess(true);
        setLeadForm({
          name: '',
          email: '',
          phone: '',
          notes: '',
        });
      } else {
        console.error('Apps Script returned error:', result);
        alert(
          `Something went wrong saving your results: ${
            result.error || 'Unknown error'
          }`
        );
      }
    } catch (error) {
      console.error('Lead submit error:', error);
      alert(`Something went wrong sending your results: ${String(error)}`);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6 md:py-14">
      <img
        src="/lake-bg2.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f4d]/55 via-[#0b1f4d]/45 to-[#0b1f4d]/65" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="rounded-[40px] bg-white/55 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur-lg md:p-6">
          <div className="rounded-[32px] border border-white/50 bg-white/95 px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:px-8 md:py-8">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <p className="mb-4 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Results
                </p>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#132a72] md:text-5xl">
                  Your Personalized Setup Plan
                </h1>

                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-700">
                  Based on your inputs, here’s the setup that best fits how you
                  actually use the lake.
                </p>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Lake
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedLake}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Usage
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedUsage}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Budget
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {budgetLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Goal
                  </p>
                  <p className="mt-1 font-medium text-gray-800">
                    {selectedGoal}
                  </p>
                </div>
              </div>

              {selectedPriorities.length > 0 && (
                <div className="mb-10">
                  <p className="mb-3 text-sm font-semibold text-[#132a72]">
                    Your priorities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPriorities.map((priority) => (
                      <span
                        key={priority}
                        className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700"
                      >
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {topRecommendation ? (
                <div className="space-y-8">
                  <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                    <div className="h-2 bg-cyan-500" />

                    <div className="p-8">
                      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                            Top recommendation
                          </p>
                          <h2 className="text-3xl font-bold text-[#132a72] md:text-4xl">
                            {topRecommendation.brand} {topRecommendation.model}
                          </h2>
                        </div>

                        <div className="shrink-0 rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72]">
                          {topRecommendation.score >= 4
                            ? 'Top Match'
                            : topRecommendation.score >= 2
                            ? 'Strong Fit'
                            : 'Consider'}
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <p className="mb-2 text-sm font-semibold text-cyan-600">
                            Budget range
                          </p>
                          <p className="text-lg font-bold text-[#132a72]">
                            {topRecommendation.budget === '30-60'
                              ? '$30k–$60k'
                              : topRecommendation.budget === '60-90'
                              ? '$60k–$90k'
                              : topRecommendation.budget === '90-150'
                              ? '$90k–$150k'
                              : '$150k+'}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <p className="mb-2 text-sm font-semibold text-cyan-600">
                            Best for
                          </p>
                          <p className="text-lg font-bold text-[#132a72]">
                            {selectedUsage}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="mb-3 text-xl font-bold text-[#132a72]">
                          Why this fits you
                        </h3>
                        <ul className="space-y-3 text-gray-700">
                          {topRecommendation.notes.map((note, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="mt-0.5 text-cyan-600">✔</span>
                              <span>{note}</span>
                            </li>
                          ))}
                          <li className="flex items-start gap-3">
                            <span className="mt-0.5 text-cyan-600">✔</span>
                            <span>
                              Strong fit for {selectedUsage.toLowerCase()} use
                              cases
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="mt-0.5 text-cyan-600">✔</span>
                            <span>
                              Falls within your selected budget range
                            </span>
                          </li>
                          {selectedDockType && (
                            <li className="flex items-start gap-3">
                              <span className="mt-0.5 text-cyan-600">✔</span>
                              <span>
                                Considered alongside your dock setup:{' '}
                                {selectedDockType}
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98]"
                        >
                          Find Dealers Near You
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenBoatId(
                              openBoatId === topRecommendation.id
                                ? null
                                : topRecommendation.id
                            )
                          }
                          className="rounded-full bg-[#eef7fb] px-6 py-3 font-semibold text-[#132a72] transition-all duration-200 hover:bg-cyan-100"
                        >
                          {openBoatId === topRecommendation.id
                            ? 'Hide details'
                            : 'Expand details'}
                        </button>
                      </div>

                      {openBoatId === topRecommendation.id && (
                        <div className="mt-6 rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <h3 className="mb-3 text-lg font-bold text-[#132a72]">
                            Why this match works
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>
                              • Aligned with your selected usage and intended
                              lake activity
                            </li>
                            <li>
                              • Budget fit is strong enough to make this a
                              practical next step
                            </li>
                            <li>
                              • Leaves room to build a more complete lake-day
                              setup over time
                            </li>
                            <li>
                              • Gives you a strong starting point instead of
                              shopping blindly
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>

                  {alternateRecommendations.length > 0 && (
                    <section>
                      <h3 className="mb-4 text-2xl font-bold text-[#132a72]">
                        Other options to consider
                      </h3>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {alternateRecommendations.map((boat) => (
                          <div
                            key={boat.id}
                            className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
                          >
                            <div className="h-2 bg-cyan-500" />
                            <div className="p-6">
                              <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                  <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                                    Alternate recommendation
                                  </p>
                                  <h4 className="text-2xl font-bold text-[#132a72]">
                                    {boat.brand} {boat.model}
                                  </h4>
                                </div>

                                <div className="rounded-full bg-[#eef7fb] px-3 py-1 text-sm font-semibold text-[#132a72]">
                                  {boat.score >= 4
                                    ? 'Top Match'
                                    : boat.score >= 2
                                    ? 'Strong Fit'
                                    : 'Consider'}
                                </div>
                              </div>

                              <ul className="space-y-2 text-sm text-gray-700">
                                {boat.notes.slice(0, 3).map((note, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="mt-0.5 text-cyan-600">
                                      ✔
                                    </span>
                                    <span>{note}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                    <div className="h-2 bg-cyan-500" />

                    <div className="p-8">
                      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <h3 className="text-2xl font-bold text-[#132a72]">
                          Recommended Setup Upgrades
                        </h3>

                        <button
                          type="button"
                          onClick={() =>
                            setShowUpgradeDetails((prev) => !prev)
                          }
                          className="rounded-full bg-[#eef7fb] px-4 py-2 text-sm font-semibold text-[#132a72] transition-all duration-200 hover:bg-cyan-100"
                        >
                          {showUpgradeDetails
                            ? 'Hide details'
                            : 'Expand details'}
                        </button>
                      </div>

                      {recommendedUpgrades.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {recommendedUpgrades.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5"
                            >
                              <p className="mb-2 text-sm font-semibold text-cyan-600">
                                {item.category}
                              </p>

                              <h4 className="mb-2 text-xl font-bold text-[#132a72]">
                                {item.title}
                              </h4>

                              <p className="text-gray-600">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5 text-gray-600">
                          No specific upgrades were identified for this setup
                          yet.
                        </div>
                      )}

                      {showUpgradeDetails && (
                        <div className="mt-6 rounded-[20px] border border-[#d7e3ee] bg-[#f8fbfd] p-5">
                          <h4 className="mb-3 text-lg font-bold text-[#132a72]">
                            Why these upgrades matter
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>
                              • Helps protect your boat and dock investment
                            </li>
                            <li>
                              • Improves comfort and day-to-day usability on the
                              lake
                            </li>
                            <li>
                              • Supports your selected activity and dock type
                            </li>
                            <li>
                              • Creates a more complete setup instead of just a
                              boat purchase
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-[28px] bg-[#132a72] p-8 text-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-200">
                          Next step
                        </p>
                        <h3 className="text-2xl font-bold">
                          Want this setup sent to you?
                        </h3>
                        <p className="mt-2 max-w-2xl text-white/85">
                          Save your recommendation, revisit it later, or use it
                          when you start talking with dealers.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowLeadForm(true);
                          setLeadSuccess(false);
                        }}
                        className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98]"
                      >
                        Email My Results
                      </button>
                    </div>
                  </section>
                </div>
              ) : (
                <section className="rounded-[28px] bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <h2 className="mb-3 text-2xl font-bold text-[#132a72]">
                    No exact matches found
                  </h2>
                  <p className="text-gray-600">
                    Try adjusting your usage, budget, or dock type to broaden
                    the recommendation range.
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)] md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Save Your Results
                </p>
                <h3 className="text-2xl font-bold text-[#132a72]">
                  Email this setup to yourself
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  We’ll send your recommendation and save your lead for follow-up.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLeadForm(false)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            {leadSuccess ? (
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-800">
                Your results were sent successfully.
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleLeadSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Name
                  </label>
                  <input
                    type="text"
                    value={leadForm.name}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Email
                  </label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={leadForm.phone}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Notes
                  </label>
                  <textarea
                    value={leadForm.notes}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="w-full rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmittingLead ? 'Sending...' : 'Send My Results'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}