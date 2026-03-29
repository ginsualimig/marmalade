# BUILD5_PARTICLES

## Tier burst (tier unlock)
- Spawned more particles (22) for a fuller radial burst without touching mechanics.
- Each particle now carries randomized CSS variables: `--tx` / `--ty` (radial spread), `--drift` (side-ways wiggle), `--gravity` (natural fall), `--particle-size` (10‑18px), `--duration` (~0.95–1.45s), `--delay`, `--spin-start`, and `--spin-speed` (±260–±1120deg).
- Keyframe `tierParticleBurst` combines translation, drift, gravity, scale, and rotation for a more physical arc with easing.

## Victory confetti
- `confettiPieces` memoizes 45 particles per victory so we hit the 40‑50 target without extra DOM churn.
- Each piece randomizes: horizontal drift (±30px), wave offset (±11px), fall duration (4–6s), delay (0–1.2s), spin speed (±200°–±620°), tilt angle (±30°), size (10/12/16/20px), and color (existing palette).
- CSS `confettiFall` uses those vars to blend sinusoidal drift, rotation, and fade to keep the motion organic.
