# BUILD6 Particle Audio

## Summary
- Added a `playTierParticleTone` helper that fires a quick Web Audio oscillator every time a tier burst particle spawns.
- Tones now trigger alongside each particle's CSS delay so the soundscape sits tightly with the visual burst, keeping the existing celebration chime and mechanics untouched.

## Tuning
- Frequencies hover around 250 Hz with ±50 Hz jitter (`200-300 Hz`) to keep the shimmer grounded in the low-mid register where it feels like a physical pop without stealing the limelight from the main chime.
- Durations stay short (`0.06-0.11 s`) and volumes stay tiny (`0.05-0.07` before the master multiplier) so the effect remains subtle and never overwhelms the celebration cue.
- Each tone randomly picks between `triangle` and `sine` waveforms for gentle variance and humanizes the burst.
- We gate the helper on whether the audio system is primed and the master volume multiplier is above zero, which automatically respects both the mute toggle and the Sound FX slider.
- The build was verified with `npm run build` (Next.js 16.2.1, Turbopack) with no errors.
