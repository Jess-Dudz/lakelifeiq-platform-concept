<h1 align="center">LakeLifeIQ</h1>

<p align="center">
  A decision-support platform for recreational boat buyers.<br/>
  Most boat advice stops at the boat. This maps the whole setup around it.
</p>

<p align="center">
  <a href="https://lakelifeiq.com"><img src="https://img.shields.io/badge/Live-lakelifeiq.com-22D3EE?style=for-the-badge" alt="Live at lakelifeiq.com"/></a>
  <img src="https://img.shields.io/badge/Next.js-0B1220?style=for-the-badge&logo=nextdotjs&logoColor=E4E4E4" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-0B1220?style=for-the-badge&logo=typescript&logoColor=3178C6" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-0B1220?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase"/>
</p>

<p align="center">
  <img src="public/screenshots/launch-screeenshots/lakelife-hero.png" width="49%" alt="LakeLifeIQ home"/>
  <img src="public/screenshots/launch-screeenshots/lakelife-setup-results.png" width="49%" alt="Personalized results"/>
</p>

---

## Why I built this

Most recreational boating decisions get framed too narrowly around the boat
itself. In reality buyers are also trying to work out dock compatibility, lift
and cover requirements, comfort upgrades, which local providers can actually do
the work, and whether the whole setup fits inside a real budget.

Nobody sells the answer to that question because it spans five different
businesses. LakeLifeIQ is an attempt to answer it in one place, and to test
whether a boat-first planning workflow creates enough value that local marine
businesses would want to be part of it.

## What it does

A short guided flow collects lake, primary usage, budget, dock setup, lift and
cover needs, automation preferences, and comfort priorities. The output is a
ranked boat recommendation, a remaining upgrade allowance derived from what the
boat consumed, setup-aware lift and cover suggestions, and a filtered directory
of local providers who can deliver them.

<p align="center">
  <img src="public/screenshots/launch-screeenshots/lakelife-setup-flow.png" width="49%" alt="Guided setup flow"/>
  <img src="public/screenshots/launch-screeenshots/lakelife-dealer.png" width="49%" alt="Dealer directory"/>
</p>

## How the recommendation works

It is a deterministic scoring engine, not a model. Being clear about that
matters, because the interesting engineering is in the data and the
measurement rather than in any algorithm.

**Boat fit is graded, not binary.** A `hull_use_case_fit` matrix scores every
hull against every use case from 1 to 5. That score is weighted heavily enough
to dominate the other criteria, so a surf boat never outranks a real cruiser for
someone who said cruising, no matter how well it matches on budget and dock
type.

**Upgrade allowance steps down by what the boat consumed.** Budget bands are
wide, so the allowance drops one tier per tier the boat used, with a floor,
rather than pretending exact arithmetic is possible on a range.

**Provider ranking uses Bayesian shrinkage.** Ratings are pulled toward a global
prior weighted by review count, so a business with three five-star reviews
cannot outrank one with three hundred. Raw star average would have made the
directory useless.

**The directory is honest about reachability.** Only 6 of 104 providers have a
website. Rather than pad cards with dead links, providers without one route to a
verified map listing, and phone numbers sit behind a single click so that
contact intent is measurable at all.

## Measurement

The whole product exists to answer one question: does a broader planning
workflow actually drive people to contact local businesses? That needs
attribution, not just traffic.

Running a plan creates a `plan_sessions` row and returns a session id. That id
follows the visitor through the dealer directory, into every outbound click, and
onto the lead record. Same identifier in all three tables, which makes it
possible to ask which recommendations produce contact rather than just how many
clicks happened.

Outbound clicks route through an internal redirect, so no personal data is
attached to the destination visit, and bot traffic is flagged at ingest to keep
the counts honest rather than flattering.

## Architecture notes

- **Next.js App Router** with server components for data-driven pages and client components only where interaction requires it
- **Supabase Postgres** behind the whole site: providers, boats, events, plans, clicks, and leads
- **Graceful degradation on every read.** Each database fetch falls back to a static catalogue on failure, so an outage produces a slightly stale site rather than an error page
- **Self-expiring events.** The upcoming-shows view filters on `current_date`, after a hardcoded date went stale in production once
- **Server-side ingest.** Writes go through API routes with a shared secret rather than from the browser, so the service role key never ships to a client
- **Resend** for transactional email, with the visitor-facing message built from catalogue data rather than posted input

## Status

Live and usable, in validation. Current focus is learning which recommendation
paths are actually useful and where provider demand concentrates by lake and
category. Paid dealer lead routing is not active.

## Roadmap

- Persist ranked results per session so recommendation quality can be evaluated against real outcomes
- Test the hand-set scoring weights against click-through behaviour instead of defending them from intuition
- Expand boat specs and provider coverage by lake and category
- Move beyond rules-based scoring once there is enough labelled outcome data to justify it

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production check:

```bash
npm run build
```

<p align="center">
  <img src="public/screenshots/launch-screeenshots/mobile-screenshot.png" width="240" alt="Mobile experience"/>
</p>
