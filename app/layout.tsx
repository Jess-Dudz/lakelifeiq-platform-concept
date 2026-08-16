import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'LakeLifeIQ',
    template: '%s | LakeLifeIQ',
  },
  description: 'Smarter boating starts here.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-US"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#eef4f8] text-gray-900">
        <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
            <div className="flex items-center gap-6 md:gap-8">
              <Link
                href="/"
                className="flex items-center rounded-full px-1 py-1 transition hover:opacity-90"
              >
                <Image
                  src="/logo-color.png"
                  alt="LakeLifeIQ"
                  width={205}
                  height={50}
                  className="h-10 w-auto md:h-11"
                  priority
                />
              </Link>

              <nav className="hidden items-center gap-5 md:flex">
                <Link
                  href="/"
                  className="text-sm font-semibold text-gray-700 transition hover:text-[#132a72]"
                >
                  Home
                </Link>
                <Link
                  href="/start"
                  className="text-sm font-semibold text-gray-700 transition hover:text-[#132a72]"
                >
                  Get Started
                </Link>
                <Link
                  href="/dealers"
                  className="text-sm font-semibold text-gray-700 transition hover:text-[#132a72]"
                >
                  Dealers
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-semibold text-gray-700 transition hover:text-[#132a72]"
                >
                  About
                </Link>
              </nav>
            </div>

            <nav className="flex items-center gap-3 md:hidden">
              <Link
                href="/start"
                className="text-xs font-semibold text-gray-700 transition hover:text-[#132a72]"
              >
                Get Started
              </Link>
              <Link
                href="/"
                className="text-xs font-semibold text-gray-700 transition hover:text-[#132a72]"
              >
                Home
              </Link>
              <Link
                href="/dealers"
                className="text-xs font-semibold text-gray-700 transition hover:text-[#132a72]"
              >
                Dealers
              </Link>
              <Link
                href="/about"
                className="text-xs font-semibold text-gray-700 transition hover:text-[#132a72]"
              >
                About
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-white/10 bg-[#0c214f] text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 md:flex-row md:items-end md:justify-between md:px-6">
            <div className="max-w-lg">
              <Link
                href="/"
                className="inline-flex items-center transition hover:opacity-90"
              >
                <Image
                  src="/logo-white.png"
                  alt="LakeLifeIQ"
                  width={185}
                  height={44}
                  className="h-10 w-auto"
                />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                Smarter boating starts with a smarter setup. LakeLifeIQ helps
                connect the boat, the dock, the providers, and the real budget
                behind a confident lake plan.
              </p>
              <p className="mt-3 text-sm font-medium text-cyan-100/90">
                For users, LakeLifeIQ will always be free to use.
              </p>
              <p className="mt-3 text-sm text-white/70">
                Contact:{" "}
                <a
                  href="mailto:contact@lakelifeiq.com"
                  className="font-semibold text-cyan-100 transition hover:text-white"
                >
                  contact@lakelifeiq.com
                </a>
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.14em] text-white/45">
                © 2026 LakeLifeIQ. All rights reserved.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-sm font-semibold md:items-end md:self-center md:text-right">
              <Link
                href="/about"
                className="text-white/80 transition hover:text-white"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-white/80 transition hover:text-white"
              >
                Contact
              </Link>
              <Link
                href="/privacy-policy"
                className="text-white/80 transition hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
