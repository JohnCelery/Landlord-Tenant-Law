# Garden State Manager

_A bite-size, replayable training game scaffold for New Jersey property managers (NJLAD, FCHA, notices, rent increases, deposits, subsidies)._ This repository provides a modern React + Vite + TypeScript single-page application with ESLint, Prettier, Vitest, and offline-capable PWA support powered by Workbox.

> **Disclaimer:** This scaffold is for training content only. It does **not** provide legal advice. Always verify current law or consult counsel before acting on landlord-tenant topics.

## Project overview

- ⚛️ **React 19 + Vite 7 + TypeScript** SPA ready for GitHub Pages, Vercel, or any static host.
- ✅ **ESLint (flat config) + Prettier** pre-configured for consistent formatting.
- 🧪 **Vitest + Testing Library** with jsdom environment and Jest-DOM matchers.
- 📦 **PWA via Workbox** (`vite-plugin-pwa`) for offline caching and update prompts.
- 🎨 **Light, dark, and high-contrast themes** with runtime switching and system preference sync.
- 📁 Opinionated feature folders matching the Garden State Manager design doc.
- 🔁 SPA-friendly fallbacks (`public/404.html` and `vercel.json`) for static hosting routers.

### Folder layout

```
.
├─ public/                      # Static assets, PWA manifest, SPA fallbacks
├─ src/
│  ├─ core/                     # Gameplay engines (director, scoring, saves, rng)
│  ├─ data/                     # Seed packs, asset catalog, notice rules
│  ├─ components/               # UI building blocks & layout wrappers
│  ├─ pages/                    # Routed views (/map, /run, /daily, /boss/:id, ...)
│  ├─ utils/                    # a11y helpers, timers, random, CSV utilities
│  ├─ App.tsx                   # Router + theme wiring
│  └─ main.tsx                  # Entry point with BrowserRouter + PWA register
├─ vercel.json                  # Rewrites for Vercel SPA fallback
├─ vite.config.ts               # Vite + Workbox configuration
├─ vitest.config.ts             # Vitest + jsdom setup
└─ README.md
```

## Getting started

**Requirements:** Node.js 20+ and npm (or compatible package manager).

```bash
npm install
npm run dev          # Start local dev server on http://localhost:5173
npm run build        # Type-check + production build
npm run preview      # Preview the production build locally
npm run lint         # ESLint with Prettier integration
npm run format       # Prettier format
npm run test         # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode
```

### Theming & accessibility

- Theme selector toggles **light**, **dark**, and **high-contrast** palettes using CSS custom properties.
- System dark/light preference updates the UI automatically unless high-contrast is selected.
- `src/utils/a11y.ts` centralizes theme persistence, focus helpers, and polite ARIA announcements.
- Base styles include focus-visible states, reduced motion hooks, and screen-reader utilities.

### PWA behaviour

- `vite-plugin-pwa` generates a Workbox service worker with cache-first static assets and SPA navigation fallback.
- `virtual:pwa-register` in `src/main.tsx` keeps the service worker up to date.
- `public/manifest.webmanifest` defines install metadata; icons point to `vite.svg` placeholders.

### Hosting notes

- **GitHub Pages:** `public/404.html` redirects unknown paths back to `/` for SPA routing.
- **Vercel:** `vercel.json` rewrites every request to `index.html` to mirror client-side routing.
- Any other static host that respects SPA fallbacks (e.g., Netlify) will work out of the box.

## Gameplay scaffolding

The codebase mirrors the Garden State Manager design document so you can plug in actual content later:

- `src/core/director` – adaptive scenario selection with seeded RNG utilities.
- `src/core/scoring` – meter math & summaries for compliance, trust, ROI, and risk.
- `src/core/saves` – localStorage persistence helpers with versioning.
- `src/data/packs` – seed content pack example including events, art slots, and citations.
- `src/data/notice-rules` – Anti-Eviction Act ground metadata used by the notice builder.
- `src/pages` – stubbed React routes for `/map`, `/run`, `/daily`, `/boss/:id`, `/notice/:id`, `/practice`, `/skills`, `/admin`, `/analytics`, `/settings`, plus a 404 catch-all.

Swap the placeholder data with production-ready JSON packs and extend the UI as your training scenarios evolve.

## Contributing

1. Fork or branch, install dependencies, run `npm run lint` & `npm run test` before committing.
2. Follow the included Prettier/ESLint rules—CI should stay green on the scaffolded configuration.
3. Consider adding LICENSE/CONTRIBUTING docs if you plan to accept outside pull requests.

Enjoy building training adventures for Garden State property teams! 🎮
