# BUILD5_PHASE_ESCALATION

- Added a phase transition drama layer when the Keeper drops below phase triggers, including a brief red flash, a banner for PHASE 2/PHASE 3/FINAL PHASE, and an orbit of subtle boss-stage pulses.
- Implemented stateful helpers to gate the drama sequence (phaseFlash + phaseDrama) without touching core gameplay logic, plus a cleanup hook for the new timers.
- Added CSS for the flash overlay, drama banner, boss pulses, and critical-phase ambience (red vignette, intensified glow/pulses) so the Keeper feels more serious while preserving the combo/phase banners.
- Final phase now also applies a lingering danger vibe (glowing vignette, boss glow/pulse, faster keeper animation) while the transition lasts ~900ms.
- ✅ Tested via `npm run build`.
