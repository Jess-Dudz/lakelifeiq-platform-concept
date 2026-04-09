import { Suspense } from 'react';
import ResultsClient from './results-client';

function ResultsLoadingFallback() {
  return (
    <main className="min-h-screen bg-[#eef4f8] text-gray-900">
      <section className="relative overflow-hidden bg-[#102b72] px-6 py-16 text-white md:px-8 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.22),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_28%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Results
          </p>
          <div className="h-12 w-full max-w-3xl rounded-2xl bg-white/10" />
          <div className="mt-5 h-6 w-full max-w-2xl rounded-xl bg-white/10" />
        </div>
      </section>

      <section className="px-6 py-14 md:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="rounded-[28px] border border-[#dbe6ef] bg-white p-8 shadow-[0_18px_50px_rgba(8,34,87,0.08)]">
            <div className="h-7 w-48 rounded-xl bg-[#eef4f8]" />
            <div className="mt-5 h-5 w-full max-w-3xl rounded-xl bg-[#eef4f8]" />
            <div className="mt-3 h-5 w-full max-w-2xl rounded-xl bg-[#eef4f8]" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-[#dbe6ef] bg-white p-8 shadow-[0_18px_50px_rgba(8,34,87,0.08)]"
              >
                <div className="h-6 w-40 rounded-xl bg-[#eef4f8]" />
                <div className="mt-5 h-4 w-full rounded-xl bg-[#eef4f8]" />
                <div className="mt-3 h-4 w-5/6 rounded-xl bg-[#eef4f8]" />
                <div className="mt-6 flex gap-3">
                  <div className="h-9 w-24 rounded-full bg-[#eef4f8]" />
                  <div className="h-9 w-32 rounded-full bg-[#eef4f8]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoadingFallback />}>
      <ResultsClient />
    </Suspense>
  );
}
