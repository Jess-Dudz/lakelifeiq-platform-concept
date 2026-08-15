'use client';

import { useState } from 'react';
import { trackPhoneReveal } from './track-reveal';

// Hides the number behind one click so the reveal is measurable. A plain
// tel: link cannot be tracked, and with 93 of 101 providers reachable only
// by phone, that would leave the main contact path invisible.
//
// The number appears immediately on click. Tracking is fire-and-forget: if
// it fails, the user still gets the number.

export default function PhoneReveal({
  phone,
  name,
  lake,
  category,
  sourcePage,
}: {
  phone: string;
  name: string;
  lake: string;
  category: string;
  sourcePage: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <a
        href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
        className="mt-2 inline-flex items-center text-base font-semibold text-cyan-700 transition hover:text-cyan-600"
      >
        {phone}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setRevealed(true);
        void trackPhoneReveal({ name, lake, category, sourcePage });
      }}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
    >
      Show phone number
    </button>
  );
}
