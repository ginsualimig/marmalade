# BUILD6_PHASE_TIMING

- Tightened the phase transition beat so the flash, boss pulse, and banner resolve within the same ~950 ms window. The flash duration now runs 220 ms, and the banner timer shares the 950 ms window managed by the new `showPhaseBanner` helper. The boss pulse (`phaseDrama`) still runs 950 ms, so all three cues start and fade together.
- Reworked the banner state handling to clear old timers automatically and to reuse the helper everywhere the banner is raised, keeping the effect readable but never lingering past the pulse.
- Repositioned the banner into the boss-stage container, set it above the arena (overflow visible + relative positioning) and constrained its width for small screens so it cannot overlap the question panel; the danger vignette/final-phase pulse and other mechanics remain untouched.

## Testing
- `npm run build`
