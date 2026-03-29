# Phase 3 — Visual Premium Pass

## Goal
- Give each difficulty mode a self-contained world so the battle stage feels like a crafted arena instead of a flat UI canvas.
- Deliver mode-specific color theming that floods health bars, primary buttons, cards, and the stage environment at runtime.
- Document the new visual language for Sprout (garden), Spark (library/workshop), and Comet (celestial) modes.

## Implementation Notes
1. The `Page` component now updates `document.body` with one of `mode-sprout`, `mode-spark`, or `mode-comet`. Those classes drive the palette swaps and introductory backgrounds across every screen (not just battle).
2. The battle shell (`.battle-card`) now carries the same `mode-<mode>` class so the stage background, impacts, and decorative overlays register per mode. CSS variables (`--primary-button-*`, `--player-health-gradient`, etc.) react to the body class so buttons, cards, and rails match the mode.
3. Custom CSS art (pure gradients, radial fills, repeating patterns) is layered through pseudo-elements and `@keyframes` to simulate the arena zones, floating particles, and atmospheric drills described below.

## Sprout (K1–P1)
- **World concept:** A glowing garden arena under soft sunlight. Warm lime canopies, gentle turf, and ambient leaf motes make the stage feel alive.
- **CSS cues:** `body.mode-sprout` sets the iris to greenness, and `.battle-card.mode-sprout` paints the arena with layered radial gradients plus an animated `sproutDrift` overlay that drifts light flecks overhead.
- **Stage art:** `.battle-card.mode-sprout .battle-stage::before` is a rounded turf platform with a subtle halo and `sproutStageGlow` breathing animation. Hero/boss sprites are anchored to this grassy stage.
- **UI theming:** Buttons, ghost pills, cards, and health bars pick up the verdant gradient tokens (`--primary-button-start: #d5ffb5`, `--player-health-gradient: linear-gradient(90deg, #c4ffb8, #5dc168)`). Border colors lean into deep forest greens.

## Spark (P2–P4)
- **World concept:** An amber-lit library workshop strewn with stacks of books and magical scrolls. Wooden textures and candleglow light sculpt the arena, implying depth without photographic assets.
- **CSS cues:** `body.mode-spark` flips the palette to warm amber/orange. `.battle-card.mode-spark` fuses repeating gradients (stacked shelves and dust) with an animated `sparkDust` overlay that hints at floating paper specks.
- **Stage art:** `.battle-stage::before` draws a low wooden platform textured with repeating linear gradients and pulses via `sparkStagePulse`, reinforcing that players stand on a crafted stage, not a flat card.
- **UI theming:** Buttons reflect the toasted palette (`--primary-button-start: #ffda81`, `--ghost-button-border: rgba(141, 63, 16, 0.45)`), and health bars switch to amber/gold gradients so the UI reads as a single ecosystem.

## Comet (P5–P6)
- **World concept:** A cosmic arena floating in the stars. Deep purples, twinkling constellations, and hovering platforms give the battle a premium, otherworldly feel.
- **CSS cues:** `body.mode-comet` applies a multi-layered night-sky gradient and swaps the text tokens to pale lavender. `.battle-card.mode-comet` adds layered star fields (`cometStars`) and a screen-blend haze (`::after`) for cosmic atmosphere.
- **Stage art:** `.battle-card.mode-comet .battle-stage::before` renders a glowing disc of starlit energy with the `cometStagePulse` animation so each action feels elevated above a galactic stage.
- **UI theming:** Buttons turn silver-to-purple gradients, ghost pills adopt translucent nebula hues, and health bars use luminous lavender/blue gradients to echo the cosmic theme.

## Atmosphere & Particles
- Every mode uses pseudo-elements rather than images: background gradients, radial glows, repeating linear patterns, and animated star/leaf dust carpets.
- Animations (`sproutDrift`, `sparkDust`, `cometStars`) move the overlays subtly to suggest gentle wind, candle motes, or drifting stardust.

## Summary
The new CSS tokens and body classes keep all UI elements—cards, buttons, HUD rails, and battle stage—anchored to the current difficulty mode. Each mode now feels like a unique arena (garden, library, cosmic) thanks to gradient-only art, animated overlays, and curated stage platforms. The `PHASE3_VISUAL_PREMIUM_PASS` doc and the `mode-<mode>` selectors document how the themes map to visual behaviors.
