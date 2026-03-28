# Wrong Answer Feedback — Visual Reference

## Before vs. After

### BEFORE (Old Behavior)
When a child got an answer wrong, the feedback looked like this:

```
Boss Name
Gentle Sea Kraken Who Swirls Number Storms

Nice try — keep going! Kraken whirl bash incoming! 
Correct answer: 7. Break the sum into smaller steps.
```

**Problems:**
- Correct answer buried in text
- No visual separation from other feedback
- Looks like regular dialogue
- Doesn't stand out as instructional

---

### AFTER (New Behavior)
Same scenario now displays:

```
Boss Name
Gentle Sea Kraken Who Swirls Number Storms

┌─────────────────────────────────┐
│       Not quite!                │
│                                 │
│       🔢    7                   │
│                                 │
│   The correct sum is:           │
└─────────────────────────────────┘

Nice try — keep going! Kraken whirl bash incoming! 
Break the sum into smaller steps.
```

**Improvements:**
✅ Correct answer **prominent and centered**
✅ **Visual container** sets it apart
✅ **Icon cue** (🔢 for math, 📝 for spelling)
✅ **Descriptive label** ("The correct sum is:")
✅ **Smooth animation** slide-in effect
✅ Coaching message separate and clear
✅ Large, readable font for the answer

---

## Styling Details

### Answer Display Box
```
Width: Full width of the feedback panel
Height: Auto, minimum 100px
Border: 2px solid rgba(255, 255, 255, 0.2)
Border-radius: 10px
Background: Gradient (lighter in center)
Padding: 0.6rem 1rem
```

**Layout inside:**
```
┌────────────────────────────┐
│  Icon (1.4rem)  Value      │ ← Font 1.4rem, weight 900
│  ("The correct X is:")     │ ← Font 0.92rem, weight 600
└────────────────────────────┘
```

### Panel Container
```
Background: Gradient (semi-transparent)
  Wrong: rgba(255, 107, 107, 0.22) → rgba(255, 180, 120, 0.12)
  Timeout: rgba(255, 140, 72, 0.24) → rgba(255, 200, 100, 0.14)

Border: 2px solid
  Wrong: rgba(255, 140, 120, 0.4)
  Timeout: rgba(255, 160, 100, 0.45)

Border-radius: 16px
Padding: 1.1rem
Gap: 1rem (between answer section and message)

Animation: Slide-in from top (48ms, ease-out)
```

### Color Palette
- **Label text**: `#ffcaa3` (warm peach)
- **Answer value**: `#fffad4` (bright golden)
- **Hint text**: `#f5e6c8` (soft cream)
- **Message text**: `#fffaf0` (off-white)
- **Text shadow** on answer: `0 2px 8px rgba(0, 0, 0, 0.4)`

---

## Example Scenarios

### Spelling Question — Wrong Answer
**Question:** "Which letter starts 'apple'?"
**Child answers:** "b"
**Feedback shows:**

```
┌──────────────────────────┐
│   Not quite!             │
│                          │
│   📝  a                  │
│                          │
│ The correct spelling is: │
└──────────────────────────┘

Great brain move! Stardust spiral attack!
Say the first sound aloud before choosing.
```

### Math Question — Timeout
**Question:** "3 + 4 = ?"
**Time runs out (no answer)**
**Feedback shows:**

```
┌──────────────────────────┐
│  ⏰ Time out!            │
│                          │
│   🔢  7                  │
│                          │
│  The correct sum is:     │
└──────────────────────────┘

Kraken whirl bash incoming!
```

*(Different orange-tinted styling for timeout variant)*

---

## Responsive Behavior

- **Desktop (≥980px):** Panel full width within feedback area
- **Tablet (600-980px):** Scales with parent container
- **Mobile (<600px):** Full width, single column layout
- **Answer display:** Always centered, scales proportionally
- **Font sizes:** Use clamp() for fluid scaling

---

## Animation Detail

The feedback panel uses a custom `wrongFeedbackSlideIn` animation:

```
0ms:     opacity: 0, translateY: -12px, blur: 2px
48ms:    opacity: 1, translateY: 0, blur: 0
```

This creates a subtle "reveal" effect that:
- Draws attention without being jarring
- Feels responsive and quick
- Matches the "boss attack" intensity
- Doesn't distract from reading

---

## Accessibility

✅ **Color contrast:** All text meets WCAG AA standards
✅ **Font sizes:** Minimum 14px body text, 18px for answer
✅ **Line height:** 1.5 for readability
✅ **Touch targets:** Buttons remain 44px+ (no interactive elements in feedback)
✅ **Semantic HTML:** Uses standard `<div>` and `<p>` tags
✅ **Animation:** Safe (no strobing, reduced motion compatible via CSS media query if needed)

---

## Integration with Battle Flow

The feedback panel fits seamlessly into the existing battle sequence:

```
1. Child submits answer
2. resolveWrongAnswer() called
3. Boss attack animation plays (screen shake, sound)
4. Feedback panel slides in (0.48s)
5. Damage pop animates (concurrent with feedback)
6. Message visible for ~2-3 seconds
7. Next question can be answered immediately
8. New question doesn't auto-advance (user controls flow)
```

The panel **does not** interrupt the battle flow — it enhances it with clear, immediate feedback about what went wrong.
