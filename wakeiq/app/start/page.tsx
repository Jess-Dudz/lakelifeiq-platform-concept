'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StartPage() {
  const router = useRouter();

  const [lake, setLake] = useState('Lake of the Ozarks');
  const [usage, setUsage] = useState('Wakeboarding');
  const [budget, setBudget] = useState('60-90');
  const [dockType, setDockType] = useState('Covered slip');

  const handleSubmit = () => {
    const params = new URLSearchParams({
      lake,
      usage,
      budget,
      dockType,
    });

    router.push(`/results?${params.toString()}`);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      <img
        src="/lake-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-[center_65%]"
      />

      <div className="absolute inset-0 bg-[#0b1f4d]/50" />

      <div className="relative w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-8 md:p-12">
          <p className="inline-block text-xs font-semibold text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full mb-4">
            Get Started
          </p>

          <h1 className="text-3xl md:text-5xl font-bold text-[#132a72] mb-4 tracking-tight">
            Tell us about your setup
          </h1>

          <p className="text-gray-600 text-lg mb-10 max-w-2xl leading-relaxed">
            Answer a few quick questions so WakeIQ can recommend the right boat,
            dock setup, and upgrades for how you actually use the lake.
          </p>

          <form
            className="space-y-10"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Lake
                </label>
                <select
                  value={lake}
                  onChange={(e) => setLake(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option>Lake of the Ozarks</option>
                  <option>Table Rock Lake</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Primary usage
                </label>
                <select
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option>Wakeboarding</option>
                  <option>Cruising</option>
                  <option>Family recreation</option>
                  <option>Fishing</option>
                  <option>Entertaining</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Budget range
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="30-60">$30k–$60k</option>
                  <option value="60-90">$60k–$90k</option>
                  <option value="90-150">$90k–$150k</option>
                  <option value="150+">$150k+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Dock type
                </label>
                <select
                  value={dockType}
                  onChange={(e) => setDockType(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option>Covered slip</option>
                  <option>Open dock</option>
                  <option>Lift already installed</option>
                  <option>No dock yet</option>
                  <option>Covered slip with seating area</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-md"
              >
                See My Recommendation
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}