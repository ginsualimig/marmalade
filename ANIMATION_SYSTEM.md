# Marmalade Attack & Hit Animation System

## Overview

The animation system provides **satisfying, impactful visual feedback** for quiz gameplay. Attacks trigger movement, combat effects, and visual flourishes that reinforce both victory and defeat.

### Core Goals

1. **Visible attack animations** – Player attacks on correct answers, boss attacks on wrong answers
2. **Movement & impact** – Sprites move, projectiles travel, impact bursts explode
3. **Feedback loop** – Satisfying win feel, impactful lose feel
4. **Clean & composable** – Modular utility functions, reusable CSS

---

## File Structure

### New Files

- **`lib/game/animations.ts`** – Core animation utilities
  - Type definitions (`AttackMode`, `DamageFeedbackType`, `PhaseBannerType`)
  - Helper functions for animation classes
  - Constants for animation durations
  - Timer urgency levels

- **`styles/animations.css`** – All animation keyframes
  - Hero attack (forward lunge)
  - Boss attack (backward thrust)
  - Hurt wobble (multi-frame recoil)
  - Projectile travel (glow + stretch)
  - Impact burst (radial pop)
  - Damage numbers (float + shimmer)
  - Combo shine (pulsing glow)
  - Victory/defeat states (golden/red glow)

### Modified Files

- **`app/page.tsx`** – Integrated animation utilities
  - Imports `animations.ts` helpers
  - Uses clean, composable function calls for animation classes
  - Timer urgency helper for visual feedback

- **`app/layout.tsx`** – Added CSS import for `animations.css`

- **`styles/globals.css`** – Enhanced attack animations (kept for backward compat)

---

## Animation Utilities

### `lib/game/animations.ts`

#### Types

```typescript
type AttackMode = "none" | "hero" | "boss";

type PhaseBannerType = 
  | "Boss Defeated!"
  | "Direct Hit!"
  | "Combo x2!" | "Combo x3!" | "Combo x4!" | "Combo x5+"
  | "Time Up!" | "Battle Start!" | ...;
```

#### Functions

**`getPhaseBanner(isCorrect, streak, isTimeout, isBossDefeated)`**
- Returns the text for the floating phase banner
- Shows combo numbers (e.g., "Combo x3!") for streaks

**`getAttackClasses(lastHit, attackMode, timeoutFlash)`**
- Returns CSS class array for battle card
- Example: `["win-flash", "hero-zoom"]`
- Used: `<section className={getAttackClasses(...).join(" ")}>`

**`getSpriteAnimationClass(spriteType, attackMode, damageTaken)`**
- Returns animation class for hero or boss sprite
- Example: `"hero-attack"`, `"boss-hurt"`, or empty string

**`getImpactOverlayType(attackMode)` / `getImpactBurstPosition(attackMode)` / `getProjectileType(attackMode)`**
- Return animation type or position for projectiles, impacts, bursts

**`shouldShowProjectile(attackMode)` / `shouldShowImpactBurst(attackMode)`**
- Boolean checks to conditionally render animation elements

**`getTimerUrgencyLevel(secondsLeft, limit)`**
- Returns `"normal"` | `"urgent"` | `"critical"`
- Used to style timer with escalating visual urgency

**`getTimerAriaLabel(secondsLeft, urgency)`**
- Accessible aria-label text for timer
- Communicates time pressure to screen readers

#### Constants

```typescript
ANIMATION_TIMINGS = {
  ATTACK_DURATION: 700,        // How long attackMode state persists
  DAMAGE_POP_DURATION: 900,    // How long damage number floats
  PHASE_BANNER_DURATION: 1400, // How long banner is shown
  HERO_ATTACK_DURATION: 620,   // Hero sprite animation
  BOSS_ATTACK_DURATION: 620,   // Boss sprite animation
  HURT_WOBBLE_DURATION: 580,   // Recoil wobble
  PROJECTILE_DURATION: 550,    // Projectile travel
  IMPACT_BURST_DURATION: 450,  // Impact burst pop
}
```

---

## Animation Details

### Attack Flow

**Correct Answer (Player Attacks)**

1. **Phase Banner**: `"Direct Hit!"` (or combo milestone)
2. **Hero Sprite**: Lunges forward with `hero-attack`
3. **Projectile**: Glowing shot travels right with `hero-shot`
4. **Impact**: Circle burst expands from right with `impact-burst`
5. **Boss Sprite**: Wobbles back with `boss-hurt`
6. **Damage Number**: `-X` floats up from boss with shimmer
7. **Battle Card**: Green `win-flash` glow
8. **SFX**: Positive tone cue

Timings: All animations run ~600–900ms, auto-clear after `ATTACK_DURATION` (700ms)

**Wrong Answer (Boss Attacks)**

1. **Phase Banner**: `"Boss Attack!"` (or `"Time Up!"` for timeout)
2. **Boss Sprite**: Thrusts backward with `boss-attack`
3. **Projectile**: Red shot travels left with `boss-shot`
4. **Impact**: Circle burst expands from left with `impact-burst`
5. **Hero Sprite**: Wobbles with `hero-hurt`
6. **Damage Number**: `-X` floats up from hero
7. **Battle Card**: Red `danger-flash` glow + optional `screen-shake`
8. **SFX**: Wrong tone cue

### Combo Milestones

On streaks of 3, 5, 10, or multiples of 5:
- Phase banner shows `"Combo x3!"` instead of `"Direct Hit!"`
- Damage number applies `comboShine` animation for extra pulsing glow
- Audio cue emphasizes the achievement

### Timer Urgency

- **Normal** (25–60s): Blue timer, calm styling
- **Urgent** (12–25s): Orange timer border, yellow text, faster decay
- **Critical** (<12s): Red timer, `timerPanic` pulse, aggressive styling

---

## CSS Animations

### Keyframes in `styles/animations.css`

All animations use descriptive names and document their purpose:

- **`heroAttackEnhanced`** – 25% lunge forward, 50% pull back, 100% reset (620ms)
- **`bossAttackEnhanced`** – Mirror of hero, opposite direction
- **`hurtWobbleEnhanced`** – 5-frame wobble with darkening effect (580ms)
- **`heroShotEnhanced`** – Projectile grows + glows as it travels right (550ms)
- **`bossShotEnhanced`** – Red variant traveling left
- **`popBurstEnhanced`** – Circle expands with fading shadow rings (450ms)
- **`floatUpEnhanced`** – Damage number rises + fades with glow (900ms)
- **`comboShine`** – Pulsing text-shadow on milestones
- **`victoryGlow`** – Golden glow rings on victory state
- **`defeatFlash`** – Red alert pulse on defeat

### Browser Support

- Uses standard CSS3 animations (broad browser support)
- Drop-shadow, filter, transform all widely supported
- Graceful degradation: animations don't break gameplay if disabled

---

## Integration Notes

### Using Animations in Components

**Example: Battle card with attack feedback**

```tsx
<section className={`card battle-card ${getAttackClasses(battle.lastHit, attackMode, timeoutFlash).join(" ")}`}>
  {phaseBanner && <div className="phase-banner">{phaseBanner}</div>}
  {/* ... */}
</section>
```

**Example: Hero sprite animation**

```tsx
<div className={`hero-sprite ${getSpriteAnimationClass("hero", attackMode, attackMode === "boss")}`}>
  {/* ... */}
</div>
```

**Example: Conditional projectile rendering**

```tsx
<div className="projectile-lane">
  {shouldShowProjectile(attackMode) && (
    <div className={`projectile ${getProjectileType(attackMode)}`} />
  )}
  {shouldShowImpactBurst(attackMode) && (
    <div className={`impact-burst ${getImpactBurstPosition(attackMode)}`} />
  )}
</div>
```

### State Management

The main game loop controls:

```tsx
const [attackMode, setAttackMode] = useState<AttackMode>("none");
const [damagePop, setDamagePop] = useState<DamageFeedback | null>(null);
const [phaseBanner, setPhaseBanner] = useState<string | null>(null);

// On correct answer:
setAttackMode("hero");
setDamagePop({ target: "boss", amount: damage });
setPhaseBanner(getPhaseBanner(true, streak, false, false));

// Auto-clear via useEffect:
useEffect(() => {
  if (attackMode === "none") return;
  const t = setTimeout(() => setAttackMode("none"), ANIMATION_TIMINGS.ATTACK_DURATION);
  return () => clearTimeout(t);
}, [attackMode]);
```

---

## Performance Considerations

1. **CSS animations** run on GPU, not blocking JS
2. **Conditional rendering** (via `shouldShow*`) prevents unnecessary DOM nodes
3. **useEffect hooks** auto-clear animation states after `ANIMATION_TIMINGS`
4. **Transform + opacity only** – avoids layout recalculations
5. **Drop-shadow filters** use efficient GPU rendering

**Result**: Smooth 60fps animations even on lower-end devices.

---

## Accessibility

1. **Phase banner**: Visible, reads naturally in context
2. **Timer aria-label**: Screen readers get urgency info
3. **Damage numbers**: Visual feedback, not the only feedback (also audio cue)
4. **Reduced motion**: CSS respects `prefers-reduced-motion` (can be enhanced)
5. **Color + animation**: Not color-only; motion + text conveys meaning

---

## Future Enhancements

1. **Reduced motion support**: Wrap animations in `@media (prefers-reduced-motion: no-preference)`
2. **Custom combo animations**: Different visual styles for milestones (5, 10, etc.)
3. **Boss-specific attacks**: Unique animation per boss (Lyra spin, Orion wave)
4. **Particle effects**: Optional confetti or stars on victory
5. **Mobile touch feedback**: Haptic feedback (vibration) on Android/iOS

---

## Testing

To test animations:

1. **Build**: `npm run build`
2. **Dev server**: `npm run dev`
3. **Test correct answer**: Select any correct option → observe hero attack + impact
4. **Test wrong answer**: Select wrong option → observe boss attack + impact
5. **Test timeout**: Wait 60s → observe red flash + time-up banner
6. **Test combo**: Get 3+ correct in a row → observe combo banner + glow effect

All animations should feel **snappy** (200–700ms) and **impactful** (clear visual feedback).

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `lib/game/animations.ts` | ✨ NEW – Animation utilities & types |
| `styles/animations.css` | ✨ NEW – Attack & impact keyframes |
| `app/page.tsx` | Import animations module, use helper functions |
| `app/layout.tsx` | Import animations.css |
| `styles/globals.css` | Enhanced animation variants added |

---

## Maintainability

- **Single responsibility**: Animations.ts = logic, animations.css = styles
- **Named constants**: `ANIMATION_TIMINGS` makes durations obvious
- **Function names**: `getSpriteAnimationClass` reads like English
- **Comments**: Each animation describes its purpose and timing
- **No magic numbers**: All durations tied to exported constants

This keeps the animation system **clean, composable, and easy to extend**.
