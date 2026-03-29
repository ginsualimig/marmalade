# BUILD5 Audio Fix

- Raised all synth outputs to ~3× the previous gain, routed them through a new master volume multiplier, and multiplied the celebration chime volumes to land inside the 15‑20% loudness window.
- Added a persistent `Sound FX` slider (0‑100%) that lives alongside the master volume toggle, persists with localStorage defaults (80%), and drives the shared Web Audio multiplier while still allowing the toggle to mute by setting the gain to 0.
- Implemented a small audio delay (≈80ms) so celebration chimes align with the particle peak and introduced a first-interaction fade-in (via an `audioPrimed` guard) so browsers unlock the AudioContext without clipping.
- Added slider-specific styling and confirmed a clean `npm run build`.
