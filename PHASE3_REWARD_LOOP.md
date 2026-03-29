# PHASE3_REWARD_LOOP

## Tier/Tier System Foundation
- Introduced a running rank tier tied to the current score (Novice 0–200, Apprentice 201–500, Warrior 501–900, Champion 901–1400, Master 1400+). Each tier carries a short description, icon, and celebratory bonus value.
- Added a `rank-hud` HUD panel in the battle chrome that shows the active tier, the current score, and a progress bar toward the next tier. The panel sits alongside the health rails and is styled as a secondary HUD element so the boss phase remains dominant.
- A tier unlock banner (`tierBanner`) fires whenever the score crosses a tier threshold. The banner persists briefly and reports the unlocked tier name plus its bonus points.

## Combo Milestones
- Added milestone banners for x5 and x10 streaks (`comboBanner`). Each banner states the combo name (INCREDIBLE COMBO / UNSTOPPABLE COMBO) and the bonus points being awarded.
- Combos are tracked via `battle.stats.streak`, with a simple cross-threshold detection so the banner appears once per milestone.

## Visual/UX Details
- Reward banners (tier and combo) float near the top center; they share animation styling and fade after about a second so they feel celebratory without grabbing the entire scene.
- Styling lives in `styles/globals.css`: there are new classes for the rank HUD, progress track, reward banners, and responsive tweaks for the small-screen battle layout. The top HUD also allows wrapping to avoid crowding the pause button.