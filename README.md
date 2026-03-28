# Marmalade: Mythic Monster Quiz Showdown

A simplified, kid-friendly quiz battler built with Next.js for web/Vercel deployment.

## Core gameplay

- Start screen with both bosses.
- Battle Moonlight Manticore Lyra first, then Starwhirl Kraken Orion.
- Every turn is an educational challenge:
  - **Word skills**: phonics, spelling patterns, vocabulary, and word building.
  - **Maths**: number sense through upper-primary arithmetic/problem-solving.
- Correct answer = damage boss.
- Wrong answer = player takes damage.
- Includes clear victory and game-over flow.

## Curriculum mapping

Singapore-aligned curriculum data now lives in `lib/game/curriculum.ts`.

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
