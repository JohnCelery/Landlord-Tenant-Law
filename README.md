# Garden State Manager
*A bite-size, replayable training game for New Jersey property managers (NJLAD, FCHA, notices, rent increases, deposits, subsidies).*

> **Disclaimer:** This is training, not legal advice. Laws/ordinances change; always verify current authority or consult counsel.

---

## What is this?
A single-page, offline-capable web game (React + Vite + TypeScript, PWA) that turns real landlord-tenant scenarios into a **decision game**. Players manage a small NJ portfolio, make choices under time pressure, and see effects on four meters:

- **Compliance** (lawfulness)  
- **Resident Trust** (tenant relations)  
- **Owner ROI** (business)  
- **Risk** (exposure/litigation)

It ships with:
- **Director AI** (adaptive difficulty & pacing)  
- **Event cards** with evidence peeks & costs  
- **Notice-Builder** mini-game (drag tiles, justify, simulate service)  
- **NPC “phone call”** dialog mini-game  
- **Skills & policy cards** (clarity boosts, not pay-to-win)  
- **Daily challenges, boss cases, streaks, badges**  
- **Content-pack system** (drop in more scenarios without code)  
- **Art slot system** (named placeholders for custom art with size/format rules)

---

## Quick start

**Requirements:** Node 20+, npm (or pnpm/yarn).

```bash
npm install
npm run dev         # local dev on http://localhost:5173
npm run test        # unit tests (Vitest)
npm run build       # production build
npm run preview     # preview the built app locally
Deploy as any static SPA (Vercel, Netlify, GitHub Pages). A PWA service worker is included (cache-first assets, stale-while-revalidate packs).

Project layout
php
Copy code
.
├─ public/                      # static (manifest, icons)
├─ src/
│  ├─ core/                     # engines: director, scoring, saves, rng
│  ├─ components/               # UI building blocks
│  ├─ pages/                    # routes (/map, /run, /daily, /boss/:id, /notice/:id, /practice, /skills, /admin, /analytics, /settings)
│  ├─ data/
│  │  ├─ packs/                 # content packs (JSON)
│  │  ├─ asset-catalog.json     # required art slots (names, sizes, formats)
│  │  ├─ notice-rules.json      # ground → cease? timing, service options
│  │  ├─ questions.json         # optional: quick drills
│  │  └─ events.json            # optional: baseline events
│  ├─ assets/                   # your custom art (organized by slot keys; see below)
│  ├─ utils/                    # a11y, timers, csv, rand
│  ├─ tokens.ts                 # design tokens (spacing, radii, palette)
│  └─ main.tsx
├─ AGENTS.md                    # build rules for code assistants (see below)
├─ package.json
└─ vite.config.ts
Core concepts
1) Content packs
Everything the player sees lives in JSON packs so you can add scenarios without re-deploying code.

Manifest (abbreviated):

json
Copy code
{
  "id": "core",
  "title": "Core NJ Pack",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "topics": ["NJLAD", "FCHA", "Notices", "Deposits", "Rent"],
  "municipalities": ["Jersey City", "Newark", "Elizabeth"],
  "difficultyCurve": {"start":"easy","mid":"normal","late":"hard"},
  "artSlotsRequired": [
    "ui.map.bg.nj.portrait",
    "badge.noticeNinja",
    "building.notices"
  ],
  "questions": [...],
  "events": [...],
  "noticeRules": {...},
  "bossCases": [...],
  "npcScripts": [...]
}
Drop new packs in src/data/packs/*.pack.json. The app loads packs/core.pack.json at boot and can hot-swap more packs via /admin.

2) Art slot system (add custom art later, safely)
UI never imports images by file path. Instead it asks for an art slot key. If that key isn’t found, a generated placeholder (canvas with the key & size) is used and logged.

Catalog entry example (src/data/asset-catalog.json):

json
Copy code
{
  "key": "ui.map.bg.nj.portrait",
  "wPx": 1440,
  "hPx": 2560,
  "aspect": "9:16",
  "density": "2x",
  "formatPreferred": "WEBP|PNG",
  "notes": "Keep top 20% clear for HUD"
}
Where to put files:
Create a file whose path mirrors the key (dots → folders). For example:

arduino
Copy code
slot key:  ui.map.bg.nj.portrait
file:      src/assets/ui/map/bg/nj/portrait.webp   # or .png/.svg per catalog
Other examples:

css
Copy code
badge.noticeNinja            → src/assets/badge/noticeNinja.png
icon.meter.compliance        → src/assets/icon/meter/compliance.svg
building.rentincrease        → src/assets/building/rentincrease.png
npc.owner.bust               → src/assets/npc/owner/bust.png
On boot, dev mode shows a Missing Art Report with any unresolved slots (also exportable to CSV). You can ship with placeholders and replace art later.

3) Notice-Builder rules
src/data/notice-rules.json defines the mapping from Anti-Eviction Act grounds to:

ceaseRequired (true/false)

quitTiming ("3_days" | "1_month" | "3_months" | "18_months" | "3_years" | "other")

serviceOptions (e.g., ["personal","certified_then_regular","household_14+"])

The mini-game loads this file, validates drag-and-drop selections with live errors, then simulates certified→unclaimed→regular sequences.

Building a run (what the player experiences)
Map: choose a building (topic focus, locked by badges).

Director AI picks an event (weights your weak topics, mixes recall/application).

Event case file: you can peek evidence (costs time/coins) then either answer an MCQ (decision UI) or open Notice-Builder.

Outcome: meters move, streaks/combos apply, you earn coins/xp; wrong moves spawn fail-forward cleanup events.

End of day: debrief “Top 3 leaks,” quick practice links, streak bonuses.

Scripts you’ll use often
bash
Copy code
npm run dev           # live dev server
npm run build         # prod build (PWA)
npm run preview       # test the dist/ build locally
npm run test          # unit tests (Vitest)
npm run lint          # lint/format if configured
Add more scenarios or notices (no code)
New event: Append to src/data/packs/core.pack.json → events[].

New notice rule: Edit src/data/notice-rules.json.

New NPC dialog: Append to pack npcScripts[].

New boss arc: Append to pack bossCases[] and ensure referenced events exist.

Legal citations: Put short URLs in each event/question’s citations[]. Explanations should be plain-English, not legal advice.

Accessibility & performance
Keyboard/Screen-reader friendly (focus rings, ARIA labels, reduced motion).

PWA: assets cached; packs fetched with stale-while-revalidate and “Update available” toast.

Contributing & agents
Read AGENTS.md for coding standards, Definition of Done, and ready-to-use task prompts for code assistants.

Consider adding a LICENSE (MIT recommended) and CONTRIBUTING.md if you accept PRs.

Legal
This project helps educate on NJ landlord-tenant topics (NJLAD, FCHA, notices, rent, deposits, subsidies) via gameplay. It does not provide legal advice or create an attorney-client relationship. Always check current statutes/regulations and local ordinances.
