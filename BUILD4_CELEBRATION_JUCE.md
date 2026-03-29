# Celebration Juice Pass Notes

## Audio synthesis
- All celebration sounds run through the Web Audio API via a shared `AudioContext`. The helper `blip` creates an `OscillatorNode` + `GainNode`, and `playToneSequence` schedules multiple notes with configurable frequencies, durations, and timbre. Volume is ramped down to avoid clicks.
- Tier unlocks call `playTierFanfare`, which steps through four ascending tones (392, 494, 587, 698 Hz) to create a brief chime/fanfare.
- Combo milestones call `playComboSound`, which chooses a short sawtooth "whoosh" followed by brighter triangle tones for combo ×5, and extends it with an extra stab for combo ×10.
- Sound respects the new `soundEnabled` state so the master volume checkbox in the Settings screen can mute every source before the `AudioContext` is touched.

## Celebration triggers
- **Tier unlocks:** the `tierAnnouncedRef` effect detects a new tier, fires `celebrateTier()` (particles + CSS shake + fanfare), and shows the tier banner.
- **Combo ×5:** the streak watcher fires `celebrateCombo(5)` the first time the streak crosses 5, triggering the combo banner, screen shake/pulse, and combo sound.
- **Combo ×10:** the same watcher fires `celebrateCombo(10)` when the streak crosses 10, playing the larger combo sound and a slightly stronger animation.

## Visual flourishes (reference)
- Tier unlocks now spawn 6–8 CSS-only gold particles from the `rank-icon` area (`.tier-particle` with custom `--tx/--ty`), plus a brief battle-card shake/pulse (`.celebration-*`). The battle container applies `.celebration-tier`, `.celebration-combo5`, or `.celebration-combo10` to trigger the animations.
