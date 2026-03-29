# BUILD 8 — Overlay Visibility Fix

## Problem

During question answering, the battle background and boss animations were excessively blurred, making the animated stage hard to see. This undermined the sense of being in a live battle.

**Root cause:** Double blur treatment — both the `stage-dimmer` and `question-overlay-card` applied heavy `backdrop-filter: blur()`:

| Element | Before |
|---|---|
| `stage-dimmer` | `blur(6px)` + `rgba(5,5,20,0.65)` |
| `question-overlay-card` | `blur(18px) saturate(1.2)` + `rgba(5,8,24,0.92)` |

Together these made the boss/stage barely visible behind the question panel.

## Changes

### `styles/globals.css`

**`stage-dimmer`**
- Reduced blur: `6px` → `2px`
- Reduced opacity: `rgba(5,5,20,0.65)` → `rgba(5,5,20,0.28)` (mild dim only)
- Removed `saturate(1.1)` (unnecessary)

**`question-overlay-card`**
- Reduced blur: `18px` → `4px`
- Reduced saturate: `1.2` → `1.05`
- Reduced background opacity: `rgba(5,8,24,0.92)` → `rgba(5,8,24,0.88)`
- Reduced box-shadow depth: `rgba(3,2,15,0.7)` → `rgba(3,2,15,0.6)`

## Result

- Question card remains fully readable (dark background still provides strong contrast)
- Background boss animations and stage are clearly visible through the lighter dim treatment
- No more double-blur stacking
- Build passes ✅
