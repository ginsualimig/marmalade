# Marmalade: Keeper Quiz Challenge (Phase 1)

A simplified, kid-friendly quiz battler built with Next.js for web/Vercel deployment.

## Phase 1 gameplay focus

- Single encounter format: **The Keeper of Patience**.
- Each turn is an educational challenge:
  - **Word skills**: phonics, spelling patterns, vocabulary, and word building.
  - **Maths**: number sense through upper-primary arithmetic/problem-solving.
- Correct answer = player deals damage.
- Wrong answer = player takes damage.
- Includes full run flow: start, battle, and learning summary.

## Curriculum mapping

Singapore-aligned curriculum data lives in `lib/game/curriculum.ts`.

It provides:
- Stage progression from **K1 → Primary 6**
- Question bands per stage for **maths** and **word skills**
- Recommended **answer modes** (`mcq`, `typed`, `hybrid`)
- Diagnostic categories for strengths/weaknesses
- A mode-cluster mapping for the current game:
  - `sprout` → **K1-P1**
  - `spark` → **P2-P4**
  - `comet` → **P5-P6**

The current page imports `MODE_CONFIG_FROM_CURRICULUM`, so other implementation lanes can consume the same curriculum source without broad UI changes.

## Phase 2+ notes

- Multi-boss progression and expanded story arcs are intentionally deferred.
- Legacy boss-rush/alternate-boss artifacts may still exist in non-live/internal modules and should be treated as future-lane material unless explicitly reactivated.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```
