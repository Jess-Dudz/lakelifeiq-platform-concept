'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const priorityOptions = [
  'Family Friendly',
  'Low Maintenance',
  'Performance',
  'Comfort',
  'Easy Dock Access',
  'Automation / Convenience',
  'Upgrade Potential',
];

export default function StartPage() {
  const router = useRouter();

  const [startingPoint, setStartingPoint] = useState('Starting from scratch');
  const [lake, setLake] = useState('Lake of the Ozarks');
  const [usage, setUsage] = useState('Wakeboarding');
  const [budget, setBudget] = useState('60-90');
  const [dockType, setDockType] = useState('Covered slip');
  const [goal, setGoal] = useState('Buy new');
  const [priorities, setPriorities] = useState<string[]>([
    'Family Friendly',
    'Low Maintenance',
  ]);

  const togglePriority = (priority: string) => {
    setPriorities((current) => {
      if (current.includes(priority)) {
        return current.filter((item) => item !== priority);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, priority];
    });
  };

  const handleSubmit = () => {
    const params = new URLSearchParams({
      startingPoint,
      lake,
      usage,
      budget,
      dockType,
      goal,
      priorities: priorities.join('|'),
    });

    router.push(`/results?${params.toString()}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6 md:py-14">
      <img
        src="/lake-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_70%]"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1f4d]/50 via-transparent to-[#0b1f4d]/60" />

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <div className="rounded-[40px] bg-white/55 backdrop-blur-lg p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] md:p-6">
          <div className="rounded-[32px] border border-white/50 bg-white/95 px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:px-8 md:py-8">
            <div className="mx-auto max-w-3xl">
              <p className="mb-4 inline-block rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                Get Started
              </p>

              <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#132a72] md:text-5xl">
                Tell us about your setup
              </h1>

              <p className="mb-4 max-w-3xl text-lg leading-relaxed text-gray-700">
                Answer a few quick questions so LakeLifeIQ can recommend the
                right boat, setup, and next steps for how you actually use the
                lake.
              </p>

              <p className="mb-8 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
                We use your answers to match you with the best boat, setup, and
                local dealers.
              </p>

              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <section className="space-y-4">
                  <div>
                    <h2 className="mb-1 text-xl font-bold text-[#132a72]">
                      Your situation
                    </h2>
                    <p className="text-sm text-gray-700">
                      Tell us where you are and what you want help with.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        Where are you starting from?
                      </label>
                      <select
                        value={startingPoint}
                        onChange={(e) => setStartingPoint(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-cyan-500"
                      >
                        <option>Starting from scratch</option>
                        <option>I already own a boat</option>
                        <option>I already have part of my setup</option>
                        <option>I want to improve my current setup</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        What do you want help with?
                      </label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-cyan-500"
                      >
                        <option>Buy new</option>
                        <option>Upgrade what I have</option>
                        <option>Fill setup gaps</option>
                        <option>Decide what to do next</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <h2 className="mb-1 text-xl font-bold text-[#132a72]">
                      Core details
                    </h2>
                    <p className="text-sm text-gray-700">
                      These basics help shape the recommendation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        Lake
                      </label>
                      <select
                        value={lake}
                        onChange={(e) => setLake(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-cyan-500"
                      >
                        <option>Lake of the Ozarks</option>
                        <option>Table Rock Lake</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        Primary usage
                      </label>
                      <select
                        value={usage}
                        onChange={(e) => setUsage(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-cyan-500"
                      >
                        <option>Wakeboarding</option>
                        <option>Cruising</option>
                        <option>Family recreation</option>
                        <option>Fishing</option>
                        <option>Entertaining</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        Budget range
                      </label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="30-60">$30k–$60k</option>
                        <option value="60-90">$60k–$90k</option>
                        <option value="90-150">$90k–$150k</option>
                        <option value="150+">$150k+</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">
                        Dock type
                      </label>
                      <select
                        value={dockType}
                        onChange={(e) => setDockType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-cyan-500"
                      >
                        <option>Covered slip</option>
                        <option>Open dock</option>
                        <option>Lift already installed</option>
                        <option>No dock yet</option>
                        <option>Covered slip with seating area</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div>
                    <h2 className="mb-1 text-xl font-bold text-[#132a72]">
                      What matters most?
                    </h2>
                    <p className="text-sm text-gray-700">
                      Select up to 3 priorities.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {priorityOptions.map((priority) => {
                      const selected = priorities.includes(priority);
                      const disabled = !selected && priorities.length >= 3;

                      return (
                        <label
                          key={priority}
                          className={`flex cursor-pointer items-center rounded-xl border px-4 py-2.5 transition-all duration-200 ${
                            selected
                              ? 'border-cyan-500 bg-cyan-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-md hover:scale-[1.01]'
                          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={disabled}
                            onChange={() => togglePriority(priority)}
                            className="h-4 w-4 shrink-0 accent-cyan-600"
                          />

                          <span
                            className={`ml-4 text-[15px] font-medium ${
                              selected ? 'text-[#132a72]' : 'text-gray-800'
                            }`}
                          >
                            {priority}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>

                <div className="sticky bottom-0 -mx-2 bg-white/80 px-2 pt-4 pb-2 backdrop-blur-md">
                  <button
                    type="submit"
                    className="rounded-full bg-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-md transition-all duration-200 hover:bg-cyan-600 hover:shadow-lg active:scale-[0.98]"
                  >
                    See My Recommendation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}