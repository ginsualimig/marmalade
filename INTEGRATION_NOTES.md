# Wrong Answer Feedback UI — Integration Guide

## How It Works

### User Journey
```
Child answers wrong
    ↓
resolveWrongAnswer(false) triggered
    ↓
FeedbackType created with:
  - message: Coach praise + boss taunt + learning hint
  - type: "wrong"
  - correctAnswer: the actual right answer
  - questionType: "Spelling" or "Maths"
    ↓
BattleState updated with feedbackData
    ↓
WrongAnswerFeedback component renders:
  ┌─────────────────────────┐
  │   Not quite!            │  ← Label
  │  📝 apple              │  ← Correct answer (prominent)
  │   The correct spelling is:
  │
  │ Great try! [Boss attack]
  │ Look for vowel sounds...  ← Learning hint
  └─────────────────────────┘
    ↓
Child can see the right answer clearly
    ↓
Next question ready
```

### Code Paths

**When wrong answer is submitted:**
```typescript
answer(choice: string)
  → submitted !== correct
  → resolveWrongAnswer(false)
    → creates FeedbackType with buildWrongFeedback()
    → sets battle.feedbackData
    → renders WrongAnswerFeedback component
```

**When timeout occurs:**
```typescript
useEffect (questionTimeLeft <= 0)
  → resolveWrongAnswer(true)
    → creates FeedbackType with type: "timeout"
    → same rendering flow
    → timeout-variant styling applied
```

## Component Structure

### WrongAnswerFeedback Props
```typescript
{
  feedback: FeedbackType {
    message: string;           // Coach + boss + hint
    type: "wrong" | "timeout"; // Determines styling
    correctAnswer: string;     // The right answer
    questionType?: "Spelling" | "Maths"; // For icons
  }
}
```

### Rendering Logic (app/page.tsx, battle card section)
```tsx
{battle.feedbackData && (battle.feedbackData.type === "wrong" || battle.feedbackData.type === "timeout") ? (
  <WrongAnswerFeedback feedback={battle.feedbackData} />
) : (
  <p className="feedback">{battle.feedback}</p>
)}
```

## Styling Variants

### Wrong Answer (Red-tinted)
- Background: `rgba(255, 107, 107, 0.22)` → `rgba(255, 180, 120, 0.12)`
- Border: `rgba(255, 140, 120, 0.4)`
- Label color: `#ffcaa3` (warm beige)
- Answer value: `#fffad4` (bright yellow)

### Timeout (Orange-tinted)
- Background: `rgba(255, 140, 72, 0.24)` → `rgba(255, 200, 100, 0.14)`
- Border: `rgba(255, 160, 100, 0.45)`
- Same label and answer coloring

### Animation
- Slide-in from top with fade: 0.48s ease-out
- GPU-accelerated (transform + opacity)

## Data Flow

### BattleState Shape
```typescript
{
  ...
  feedback: string;          // For fallback/summary
  feedbackData?: FeedbackType; // For enhanced rendering
  ...
}
```

### Creating feedback in resolveWrongAnswer()
```typescript
const feedbackData: FeedbackType = {
  message: `${pickLine(COACH_RETRY)} ${boss.taunts.attack} ${hint}`,
  type: "wrong",
  correctAnswer: question.correct,
  questionType: question.typeLabel
};
```

## Key Features

✅ **Prominent answer display** — Large, centered, with icon cue
✅ **Constructive tone** — Coach praise + boss dialogue + learning tip
✅ **Context-aware** — Different messages/icons for spelling vs. math
✅ **Timeout variant** — Distinct styling + "Time out!" label
✅ **Smooth animation** — Fade-in slide for visual feedback
✅ **Backward compatible** — Doesn't affect correct answers, boss-defeated, or summaries
✅ **Accessible** — Clear contrast, readable fonts, semantic HTML

## Future Enhancements (Optional)

1. **Sound feedback** — Could add a "wrong answer" tone during panel animation
2. **Explanation expansion** — Collapse/expand more detailed learning hints
3. **Answer preview** — Show the question + child's answer + correct answer side-by-side
4. **Replay prompt** — Quick "Try again now?" button (non-blocking)
5. **Emoji feedback** — Animated character reactions to reinforce learning

## Testing Checklist

- [x] Build passes (no TypeScript errors)
- [x] Wrong answers show enhanced feedback
- [x] Timeout answers show timeout variant
- [x] Correct answers still use plain text
- [x] Boss-defeated messages unaffected
- [x] Animation smooth and readable
- [x] Works on mobile (responsive grid)
- [x] Battle flow uninterrupted

## Deployment Notes

**No breaking changes.** Safe to ship as-is:
- Existing game state persists
- Progress resumption works
- Parent settings unchanged
- All stats/summaries intact

Just deploy and it will work. No migration needed.
