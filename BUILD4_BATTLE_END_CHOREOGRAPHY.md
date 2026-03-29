# BUILD4 Battle End Choreography

## Overview
- Adds bite-sized dramatic punctuation to the Keeper experience without touching the underlying quiz logic.
- Introduces entrance + defeat choreography plus celebratory defeat/victory results that keep the loop kid-friendly and fast.

## Boss Entrance
- `Page` now tracks `bossEntranceActive` and toggles it for ~750ms whenever a boss phase or boss index changes while the battle screen is live.
- The `.boss-stage` element receives the `.boss-entrance` modifier, which plays `bossEntrance` + `bossGlowBuild` keyframes (slide-in, scale, glow) for 0.75s.
- Entrance state is reset when the battle screen exits so the animation re-triggers cleanly on every new phase or boss.

## Boss Defeat Sequence
- Landing the final strike sets `bossDefeatFlashing`, which adds `.boss-defeat` to the boss stage and fires the `.battle-flash` overlay.
- `.boss-stage.boss-defeat` plays `bossDefeatSequence` (shake → flash → shrink) while `bossDefeatGlow` fades the aura.
- `.battle-flash.boss-defeat-flash` runs a white pulse animation to punctuate the moment; the effect lasts ~0.85s before fading out.

## Victory Screen (Final Boss Defeat)
- The summary card now gets a `victory-summary` class and shows a `Victory!` hero panel when `result === "victory"`.
- The hero panel spotlights the current tier badge, score, max combo, bosses defeated, and accuracy, plus a dedicated `Play Again` CTA (`hero-btn`).
- `confetti-shower` overlays dashed radial gradients with a slow `confettiDrift` animation to simulate gold sparkles behind the panel.
- Supporting layout tweaks (`summary-hero`, `.summary-headline`, `.victory-stats-grid`) keep the celebratory info front-and-center while preserving the existing detailed summary grid.

## Defeat Screen (Player HP → 0)
- When `result === "game-over"`, the hero panel switches to a “Try again!” treatment with encouraging copy.
- It shows the tier reached, the point total, and the same `Play Again` CTA so retrying feels welcoming.
- Summary actions now focus on contextual secondary choices (retry checkpoint when available + back to title), while the hero handles the primary retry CTA.

## Notes
- All new CSS sits with the battle and summary styles; no existing logic pathways were redirected.
- Animations are tuned to be under 1s to keep the flow snappy for kids.
