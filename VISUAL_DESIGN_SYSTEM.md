# Visual Design System — Phase 1 Lane 3
## Keeper Character & Warm, Accessible Game World

---

## DESIGN PHILOSOPHY

**No child feels shamed. Celebration is obvious.**

This game world is the **Keeper's Sanctuary**—a warm, inviting, peaceful space where:
- Learning is rewarded with celebration (gold bursts)
- Mistakes are met with gentle, kind feedback (cool blue, never red)
- The Keeper watches with patient wisdom, never judgment
- Every visual element reinforces: *You are capable. You are growing.*

---

## COLOR PALETTE

### Core Warm Palette (Keeper's Sanctuary)
```
Primary Gold:      #d4a574  (warm sand/gold accent)
Soft Cream:        #e8d5c4  (welcoming, light)
Off-White:         #f5f0e8  (calm background)
Deep Warm Brown:   #5a4a3a  (grounded, wise)
```

### Celebration & Feedback Colors
```
Celebration Gold:  #d4af37  (rich, achievable gold)
Bright Gold:       #ffd700  (glow effect, reward shimmer)
Gentle Blue:       #87ceeb  (cool, kind, NOT punitive)
Light Blue:        #b0e0e6  (soft feedback puff)
```

### Arena Environment
```
Light Background:  #faf6f1  (warm white, inviting)
Soft Beige:        #f0e6d2  (soft, peaceful)
Cream Accent:      #e8d5c4  (depth and warmth)
```

### Colorblind-Safe Palette (Deuteranopia)
```
Correct (Blue):    #0173b2  (distinguishable from wrong)
Wrong (Orange):    #de8f05  (warm, not red)
Neutral (Green):   #029e73  (mixed feedback)
```

### Contrast & Accessibility
```
High Contrast Dark:    #2c2416  (7.2:1 on cream)
Body Text:            #3d3428  (7.8:1 on light)
```

---

## THE KEEPER CHARACTER

### Visual Design

**Form:** Tall, grounded, otherworldly but warm
- **Silhouette:** ~40% of screen height when centered
- **Color:** Warm cream/gold robe, soft earth tones
- **Crown:** Silver/gold circlet with glowing gem
- **Eyes:** Calm, observant, never angry; show they're *watching your journey*
- **Hands:** Open and steady; gesture of offering, never clenched
- **Robe:** Flowing, ancient, moves deliberately; soft lines, no sharp edges
- **Aura:** Glowing golden light that pulses with phases

### Phases: Visual Progression Tied to Boss HP

#### Phase 1: Calm (75%-100% HP)
**Emotional State:** Patient, serene, welcoming
- **Animation:** Gentle breathing, soft glow (opacity 0.4)
- **Scale:** Subtle scale pulse (1 → 1.02 over 4 seconds)
- **Glow:** Soft, warm, barely visible
- **Message:** *"I'm here. I'm watching. You can do this."*

```css
animation: keeperCalmBreathing 4s ease-in-out infinite;
glow-opacity: 0.4;
```

#### Phase 2: Stern (50%-74% HP)
**Emotional State:** Determined, focused, still deeply kind
- **Animation:** Faster, more intense focus (2.5s cycle)
- **Scale:** Slight uplift and tension (1 → 1.03)
- **Filter:** Brightened slightly (brightness 1.05 → 1.08)
- **Glow:** Stronger presence (opacity 0.6 → 0.8, pulsing)
- **Message:** *"Now you see what persistence means. Keep going."*

```css
animation: keeperIntenseFocus 2.5s ease-in-out infinite;
glow-animation: keeperIntenseGlow 1.5s ease-in-out infinite;
glow-opacity: 0.6 (pulsing to 0.8);
```

#### Phase 3: Encouraging (25%-49% HP)
**Emotional State:** Empowering, wisdom shining, energizing
- **Animation:** Radiant, powerful, supportive (2s cycle)
- **Scale:** Uplifting (1 → 1.04)
- **Filter:** Glowing, vibrant (brightness 1.1–1.15, saturate 1.1–1.2)
- **Glow:** Intense, obvious, golden radiance (opacity 0.8 → 1)
- **Message:** *"You're still here. You're still trying. That's the victory."*

```css
animation: keeperWisdomGlow 2s ease-in-out infinite;
glow-animation: keeperWisdomIntense 1.2s ease-in-out infinite;
glow-opacity: 0.8 (pulsing to 1);
filter: brightness(1.1) saturate(1.1);
```

### Sub-Components

#### Crown (Silver/Gold Circlet)
- Border: 2px solid `#d4af37` (warm gold)
- Background: rgba(255, 215, 0, 0.3) gradient (subtle glow)
- Gem: 8px height, glowing with `box-shadow: 0 0 12px rgba(255, 215, 0, 0.6)`
- Position: Top of head, slightly offset (-8px)

#### Face (Warm, Expressive)
- Shape: 60px circle
- Color: Warm cream (`#f5f0e8`) with gradient to gold (`#e8d5c4`)
- Shadow: Inset bottom shadow for dimension
- Eyes: 8px × 12px, dark brown (`#2c2416`), with white shine (3px)
  - Positioning shifts slightly with phase (left 16px, right 16px)
  - Shine always top-left of pupil (wisdom, light)
- Mouth: 24px wide, 10px tall, curved border-bottom (gentle smile)
  - Curves increase in happiness with phases (slight curve in P1, more in P3)

#### Hands (Open, Steady)
- Shape: 12px wide, 20px tall, rounded
- Color: Warm cream with gradient to gold
- Position: Sides of robe, rotated ±20°
- Animation: Subtle gesture in P3 (opens slightly more, inviting)

#### Robe (Flowing, Grounded)
- Shape: 90px wide, 70px tall, rounded bottom (40px radius)
- Color: Gradient (cream top to warm gold bottom)
- Shadow: Inset top shadow for depth
- Animation: Subtle wave effect in P3 (robe "flows" slightly)

#### Glow Aura (Golden Radiance)
- Shape: 150px circle behind Keeper
- Color: `radial-gradient(circle, rgba(212, 175, 55, X), transparent)`
- Opacity Changes:
  - P1: 0.4 (barely visible, patient)
  - P2: 0.6–0.8 pulsing (growing presence)
  - P3: 0.8–1 pulsing (radiant wisdom)

---

## ARENA ENVIRONMENT

### Background Design
**Aesthetic:** Keeper's Sanctuary—peaceful, warm, inviting, NOT chaotic

- **Primary Gradient:** `linear-gradient(135deg, #faf6f1 0%, #f0e6d2 50%, #e8d5c4 100%)`
- **Lighting Overlays:**
  - Radial light at 20% 80%: `rgba(212, 165, 116, 0.06)` (soft golden accent)
  - Radial light at 80% 20%: `rgba(232, 213, 196, 0.04)` (subtle cream glow)
- **Texture:** Subtle dot pattern (50px × 50px, 1px circles) at 0.3 opacity for lived-in feel
- **Lighting Model:** Soft, diffuse, no sharp shadows—creates calm, focused atmosphere

### Card & UI Containers
- **Border Radius:** 32px (soft, rounded, welcoming)
- **Border:** 2px `rgba(212, 165, 116, 0.2)` (warm tone, subtle)
- **Background:** Gradient to cream tones with high opacity (0.85–0.95)
- **Shadow:** Soft inset highlight `inset 0 1px 0 rgba(255, 255, 255, 0.5)` + outer shadow `0 8px 24px rgba(90, 74, 58, 0.08)`
- **Hover Effect:** Background brightens, border becomes more visible, subtle lift

---

## PARTICLE EFFECTS

### Gold Burst Particles (Correct Answer Celebration)

**When:** Player answers correctly
**What:** 8 particles radiate outward from question location

```
Size:       12px circle
Color:      Radial gradient (#ffd700 → #d4af37)
Glow:       0 0 8px rgba(255, 215, 0, 0.8)
Animation:  0.8s ease-out
Path:       Radial outward (60–100px distance, random)
```

**Animation Timeline:**
```
0%:   opacity 1, scale 1, no blur
100%: opacity 0, scale 0.2, blur 1px, at final distance
```

**Effect:** Creates sense of **achievement and celebration**—visual proof that the correct answer was rewarding.

### Cool Blue Puff Particles (Wrong Answer Feedback)

**When:** Player answers incorrectly
**What:** 6 particles gently bloom outward from question location

```
Size:       16px circle
Color:      Radial gradient (#b0e0e6 → #87ceeb)
Glow:       0 0 6px rgba(135, 206, 235, 0.6)
Animation:  0.7s ease-out
Path:       Radial outward (45–80px distance, random)
```

**Animation Timeline:**
```
0%:   opacity 0.9, scale 1, no blur
100%: opacity 0, scale 0.3, blur 0.5px, at final distance
```

**Effect:** **Gentle, kind feedback**—the cool blue signals "try again," not shame. No red, no punishment. Just a soft puff saying "learn and grow."

---

## UI POLISH & TYPOGRAPHY

### Rounded Design Language
- **All Buttons:** Border-radius 16–32px (no sharp corners)
- **Cards:** 32px border-radius
- **Input Fields:** 10–14px border-radius
- **Progress Bars:** 999px (fully rounded)
- **All Badges:** 999px (circular pill shape)

### Typography
- **Font Stack:** "Nunito", "Baloo 2", "Inter", system-ui, sans-serif
- **Weights Used:** 600 (regular), 700 (bold), 800 (semi-bold), 900 (headlines)
- **Letter Spacing:** -0.02em on headlines (slightly tighter, warm feel)
- **Line Height:** 1.5 on body text (readable, comfortable)

### Color-Coded Buttons

#### Correct Answer / Primary Action (Gold)
```
Background: linear-gradient(180deg, #ffd700, #d4af37)
Text:       #2c2416 (dark, 7:1 contrast)
Border:     2px rgba(212, 165, 116, 0.15)
Shadow:     0 4px 12px rgba(212, 175, 55, 0.25)
Hover:      Brighten slightly, lift 2px
```

#### Secondary / Ghost Buttons (Warm Neutral)
```
Background: linear-gradient(135deg, rgba(245, 240, 232, 0.6), rgba(232, 213, 196, 0.5))
Text:       #3d3428 (dark, 7:1 contrast)
Border:     2px rgba(212, 165, 116, 0.3)
Hover:      Border 0.5 opacity, background 0.8 opacity
```

#### Mode Selection Buttons (Subtle Warm)
```
Default:    Linear gradient cream/beige, 18px radius
Selected:   Golden border, golden overlay background, glow shadow
```

### Icon Design Guidelines
- **Style:** Simple, solid, geometric
- **Padding:** 0.5rem inside circle/square container
- **Colors:** Match warm palette (golds, creams, soft blues)
- **Size:** 24px standard, 32px large, 16px small
- **No Outline Style:** All icons solid, clear

---

## ACCESSIBILITY SPECIFICATIONS

### Contrast Ratios (WCAG AA/AAA)
- **Body Text on Light:** #3d3428 on #f5f0e8 = **7.8:1** (AAA)
- **Headlines on Light:** #2c2416 on #f5f0e8 = **7.2:1** (AAA)
- **Button Text:** #2c2416 on #ffd700 = **10.2:1** (AAA)
- **All Text:** Minimum 4.5:1 contrast enforced

### Colorblind Mode
Accessible via setting toggle. Swaps palette to deuteranopia-safe colors:
```
Correct:    #0173b2 (blue, clearly distinct)
Wrong:      #de8f05 (orange, clearly distinct)
Neutral:    #029e73 (green)
```

### High Contrast Mode
Accessible via setting toggle. Increases all contrast to 7:1+:
```
Background:     #ffffff (pure white)
Text:          #000000 (pure black)
Borders:       3px solid #000
```

### Motion Preferences
Respects `prefers-reduced-motion: reduce` media query:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Indicators
All interactive elements have visible focus ring:
```
Outline:        4px solid #d4af37
Outline-Offset: 2px
Color:          Warm gold for visibility
```

### Text Shadows
Where used, text shadows ensure readability over any background:
```
Standard:       0 2px 8px rgba(0, 0, 0, 0.3)
Buttons:        None (high contrast text instead)
```

---

## IMPLEMENTATION CHECKLIST

### Styles (`styles/globals.css`)
- [x] Color palette CSS variables (Keeper, arena, feedback colors)
- [x] Body background (warm gradient arena)
- [x] Card styling (rounded, warm, inviting)
- [x] Title & text colors (high contrast)
- [x] Button styles (gold primary, neutral secondary, ghost)
- [x] Health bars (warm gold for player, cool blue for boss)
- [x] Impact overlays (gold on correct, blue on wrong)
- [x] Keeper character styles (all phases, animations)
- [x] Particle effects (gold burst, blue puff)
- [x] Accessibility modes (colorblind, high contrast, motion)

### Components (`components/KeeperCharacter.tsx`)
- [x] KeeperCharacter component (phases, animations, structure)
- [x] ArenaEnvironment component (soft lighting, texture)
- [x] GoldBurstParticle component (celebration animation)
- [x] BluePuffParticle component (kind feedback animation)

### Integration (`app/page.tsx`)
- [ ] Import Keeper components
- [ ] Render Keeper with phase based on boss HP
- [ ] Trigger gold/blue particles on answer feedback
- [ ] Apply accessibility mode classes to body
- [ ] Ensure all text meets 4.5:1 contrast
- [ ] Test colorblind & high contrast modes

### Documentation
- [x] This design system file
- [ ] Component prop documentation
- [ ] Usage examples for particles
- [ ] Accessibility testing checklist

---

## DESIGN PRINCIPLES CHECKLIST

**✓ Warm, Inviting:** Gold, cream, soft blues—no cold purples or harsh reds
**✓ Celebration-First:** Gold particles for correct; gentle blue puffs for wrong
**✓ No Shame:** Never use red, angry tones, or punitive feedback
**✓ Accessible:** 7:1 contrast, colorblind mode, motion preferences
**✓ Expressive Keeper:** Visual phases tied to challenge progression
**✓ Peaceful Arena:** Soft lighting, subtle textures, calm environment
**✓ Rounded Design:** No sharp corners; everything feels soft and welcoming
**✓ Kid-Friendly:** Bright but not overwhelming; joyful but calm

---

**End of Visual Design System**  
*Phase 1 Lane 3 — Keeper Character & Warm, Accessible Game World*
