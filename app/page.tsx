export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
  <div className="absolute top-10 left-10 z-20">
  <img
    src="/logo-white.png"
    alt="LakeLifeIQ"
    className="h-20 md:h-24 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
  />
</div>

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
            <a
  href="/start"
  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-full font-semibold transition inline-block"
>
  Get Started
</a>
            <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-full font-semibold transition">
              Explore Dealers
            </button>
          </div>
        </div>
      </section>
      <section className="bg-[#d9d9d9] py-24 px-6">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-20">
      <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-3 tracking-tight">
        What you actually get
      </h2>
      <p className="text-gray-800 font-medium">
        Clear recommendations, not guesswork.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
      <div className="bg-white shadow-xl p-10 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition duration-300">
        <div className="mb-4 w-12 h-12 text-2xl flex items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 text-xl">
  👤
</div>
        <h3 className="text-[#132a72] font-bold text-2xl mb-4">
          Personalized recommendations
        </h3>
        <p className="text-black text-lg leading-relaxed">
          Get boat options tailored to how you use the lake, your budget, and your priorities.
        </p>
      </div>

      <div className="bg-white shadow-xl p-10 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition duration-300">
      <div className="mb-4 w-12 h-12 text-2xl flex items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 text-xl">
  📍
</div>
       <h3 className="text-[#132a72] font-bold text-2xl mb-4">
          Dealer matching
        </h3>
        <p className="text-black text-lg leading-relaxed">
          Find dealers that actually carry what you need—based on location, availability, and fit.
        </p>
      </div>

      <div className="bg-white shadow-xl p-10 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition duration-300">
        <div className="mb-4 w-12 h-12 text-2xl flex items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 text-xl">
  📝
</div>
        <h3 className="text-[#132a72] font-bold text-2xl mb-4">
          Setup planning
        </h3>
        <p className="text-black text-lg leading-relaxed">
          Understand what your boat actually requires—from dock compatibility to accessories.
        </p>
      </div>

      <div className="bg-white shadow-xl p-10 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition duration-300">
        <div className="mb-4 w-12 h-12 text-2xl flex items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 text-xl">
  🎯
</div>
        <h3 className="text-[#132a72] font-bold text-2xl mb-4">
          Decision clarity
        </h3>
        <p className="text-black text-lg leading-relaxed">
          Compare options with clear tradeoffs so you know why one choice is better.
        </p>
      </div>
    </div>
  </div>
</section>
<section className="bg-[#d9d9d9] py-24 px-6">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-16">
     <p className="inline-block text-xs font-semibold text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full mb-6">
  See it in action
</p>
      <h2 className="text-3xl md:text-5xl font-bold text-blue-900 max-w-4xl mx-auto leading-[1.1] tracking-tight">
  LakeLifeIQ doesn’t just recommend a boat
  <span className="block mt-2">it recommends your entire setup.</span>
</h2>
      <p className="text-cyan-700 font-semibold">
        A complete setup recommendation based on how you actually use the lake.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.4fr] gap-8 items-start max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-[#132a72] font-bold text-2xl mb-6">Input</h3>
        <div className="space-y-3 text-lg text-gray-800">
          <p><span className="font-bold">Lake:</span> Lake of the Ozarks</p>
          <p><span className="font-bold">Usage:</span> Wakeboarding + cruising</p>
          <p><span className="font-bold">Dock:</span> Covered slip with seating area</p>
          <p><span className="font-bold">Budget:</span> $60k–$90k</p>
          <p><span className="font-bold">Priorities:</span> Low maintenance + family-friendly</p>
        </div>
      </div>

      <div className="flex items-center justify-center">
  <div className="text-cyan-500 text-5xl md:text-6xl font-light translate-x-2">
    →
  </div>
</div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-[#132a72] font-bold text-2xl mb-6">Recommendation</h3>

        <div className="space-y-5 text-gray-800">
          <div>
            <h4 className="font-bold text-lg text-black">Boat</h4>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Wake boat (23ft)</li>
              <li>Ballast system, tower speakers</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg text-black">Lift</h4>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>6,500 lb boat lift</li>
              <li>Fast lift motors for high-traffic water</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg text-black">Cover</h4>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Touchless boat cover</li>
              <li>Lower maintenance and faster daily use than spider systems</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg text-black">Dock setup</h4>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Lift placement optimized for slip width</li>
              <li>Clearance verified for tower height</li>
              <li>Misting system for seating area</li>
              <li>Shade + cooling for summer heat</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg text-black">Dealers</h4>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>3 nearby dealers with matching inventory and service availability</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<section className="bg-white py-28 px-6 text-center">
  <div className="max-w-3xl mx-auto">

    <h2 className="text-4xl md:text-5xl font-bold text-[#132a72] mb-6 leading-tight">
      Start your decision with clarity
    </h2>

    <p className="text-gray-600 text-lg mb-10">
      Find the right boat, dealer, and full setup—without guesswork.
    </p>

    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
      <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition">
        Get Started
      </button>

      <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition">
        Explore Dealers
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-600">
      <div>
        <p className="font-semibold text-gray-800 mb-1">Tell us your setup</p>
        <p>Answer a few quick questions about how you use the lake</p>
      </div>

      <div>
        <p className="font-semibold text-gray-800 mb-1">Get matched</p>
        <p>See boats, dealers, and setup recommendations</p>
      </div>

      <div>
        <p className="font-semibold text-gray-800 mb-1">Plan with confidence</p>
        <p>Understand everything before you buy</p>
      </div>
    </div>

  </div>
</section>
    </main>
  );
}