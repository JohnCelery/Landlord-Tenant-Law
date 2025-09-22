# Garden State Manager – Agent Guidelines

## Project overview
- Garden State Manager is a React 19 + Vite + TypeScript single-page training app scaffolded for New Jersey landlord-tenant scenarios with linting, testing, and PWA support preconfigured.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=55 terminal_chunk_id=fa8ccc}​

## Setup & workflow
- Use Node.js 20+ and run `npm install` after cloning or when dependencies change.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=28 line_range_end=40 terminal_chunk_id=fa8ccc}​
- For any code change, execute `npm run lint`, `npm run test`, and `npm run build` before committing; the build script runs `tsc -b` prior to the production bundle to enforce type safety.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=37 line_range_end=42 terminal_chunk_id=fa8ccc}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=5 line_range_end=24 terminal_chunk_id=bed88c}​

## Code style & linting
- ESLint and Prettier run together and treat `prettier/prettier` as an error—let Prettier control formatting instead of hand-adjusting whitespace or semicolons.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=25 terminal_chunk_id=ed1c66}​
- TypeScript uses strict compiler settings and unused checks; avoid suppressing diagnostics and prefer precise types over `any` or broad unions.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=3 line_range_end=22 terminal_chunk_id=cde591}​
- Author React features as typed function components/hooks consistent with `App`, `Layout`, and `RunPage`, leaning on helpers like `PropsWithChildren`, `useMemo`, and `useEffect` for derived state rather than ad hoc patterns.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=66 terminal_chunk_id=0e3000}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=45 terminal_chunk_id=c0fed4}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=200 terminal_chunk_id=1324ea}​

## Architecture notes
- `PacksProvider` owns pack fetching, selection, and error handling—keep it side-effect free beyond its fetch/persistence responsibilities and consume pack state via `usePacks`/`useActivePack` instead of duplicating logic.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=145 terminal_chunk_id=56ddb8}​
- Content contracts live in `src/data/packs/schema.ts`; update schemas and converters alongside any new fields, and keep `public/packs/core.pack.json` aligned so the Zod validation continues to pass.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=177 terminal_chunk_id=9e5562}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=200 terminal_chunk_id=7a5b38}​
- Export new routed pages through the barrel file `src/pages/index.ts` so routing stays consistent.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=11 terminal_chunk_id=ffb3d6}​
- Scenario planning relies on deterministic helpers in `core` (director, rng, scoring); maintain pure utilities, respect seeded RNG patterns, and avoid mutating shared state when extending these systems.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=167 terminal_chunk_id=5be92a}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=45 terminal_chunk_id=bc1dbe}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=34 terminal_chunk_id=532ae7}​

## UI, accessibility, and theming
- Reuse the theming/accessibility helpers in `src/utils/a11y.ts` for theme persistence, system preference sync, focus management, and ARIA announcements instead of bespoke DOM manipulation.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=63 terminal_chunk_id=94f11b}​
- Global layout and component styles live in `src/App.css`, with design tokens and theme palettes defined in `src/index.css`; prefer class-based styling here over inline styles to match existing spacing, color, and responsive patterns.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=200 terminal_chunk_id=514ee4}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=80 terminal_chunk_id=8695ea}​
- Timer utilities (stopwatch, delay, formatting) are already implemented in `src/utils/timers.ts`; import them instead of reimplementing similar logic inside components.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=40 terminal_chunk_id=aefe16}​

## Testing & quality checks
- Vitest (jsdom) plus Testing Library power the unit tests—add coverage mirroring `src/components/Layout.test.tsx` for new UI/logic and register shared setup through `vitest.setup.ts` as needed.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=16 terminal_chunk_id=e51037}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=22 terminal_chunk_id=ead757}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=9 terminal_chunk_id=a4b9e6}​
- When testing features that depend on routing or pack context, wrap them with `BrowserRouter` and `PacksProvider` just as the production entry point does.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=19 terminal_chunk_id=fc93bd}​​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=22 terminal_chunk_id=ead757}​

## PWA & routing considerations
- `main.tsx` registers the Workbox-powered service worker and mounts the app inside `BrowserRouter` and `PacksProvider`; keep new bootstrapping or hydration logic flowing through this entry point so the PWA and routing remain intact.​:codex-terminal-citation[codex-terminal-citation]{line_range_start=1 line_range_end=19 terminal_chunk_id=fc93bd}​
