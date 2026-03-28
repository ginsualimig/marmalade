# Phase 1 Lane 6: Pedagogy & Spaced Repetition Implementation

## Overview
Implemented a comprehensive pedagogy layer for the Marmalade quiz game featuring spaced repetition, interleaving, hint scaffolding, and growth messaging. This enables learners to build confidence through scientifically-grounded spacing and reinforcement.

## Deliverables

### 1. **Spaced Repetition Queue System** ✅
**File:** `lib/game/quizPersistence.ts`

**How it works:**
- Tracks question slots for learned concepts (after 3+ correct answers)
- Reserves slots at 8–12 turn intervals (randomized per concept family)
- When a concept is answered correctly, a `SpacedRepetitionSlot` is created with a target turn
- The system checks on each new question if any slots are due
- Over time, learned concepts naturally reappear for reinforcement

**Types:**
```typescript
export type SpacedRepetitionSlot = {
  familyId: ConceptFamily;
  reservedAtTurn: number;
  targetTurn: number; // 8–12 turns in future
  lastAskedAt?: number;
  confidenceLevel: number; // 0–100
};
```

**Key function:**
```typescript
getNextFamilyByPedagogy(availableFamilies, diagnostics): ConceptFamily | null
```
Returns a family from the queue if due, otherwise null to allow curriculum-based selection.

---

### 2. **Interleaving Algorithm** ✅
**File:** `lib/game/quizPersistence.ts`

**How it works:**
- Tracks consecutive questions from the same concept family
- After 3 consecutive questions from one family, forces a "diversity injection"
- Switches to a different family to trigger discrimination learning
- Resets the consecutive counter when family changes

**Types:**
```typescript
export type InterleavingState = {
  consecutiveFromFamily: ConceptFamily | null;
  consecutiveCount: number;
  lastFamilyAsked: ConceptFamily | null;
};
```

**Key functions:**
```typescript
shouldInjectDiversity(diagnostics): boolean // true if ≥3 consecutive
recordQuestionAttempt(diagnostics, familyId, wasCorrect) // updates interleaving
```

---

### 3. **Hint System** ✅
**File:** `lib/game/quizPersistence.ts` + `app/page.tsx`

**How it works:**
- Tracks wrong answer count per concept family
- After 2 wrong answers on a family (without a correct in between), displays a contextual hint
- Hint is optional visual scaffold—learner can dismiss by attempting next question
- Hints reset on correct answer, re-accumulate on subsequent wrongs
- 10 concept-specific hints covering all skill areas

**Hint Examples:**
```
spelling-missing-letter: "💡 Tip: Sound out the word slowly. What letter fits?"
math-multiplication: "💡 Tip: Think of groups. 3 groups of 4 means 3 × 4."
```

**UI:**
- Displayed in blue-bordered box above answer options
- Only appears after 2 wrong attempts (not shown on first try)
- Disappears when question is answered (correct or wrong)

**Key function:**
```typescript
shouldShowHint(diagnostics, familyId): boolean
```

---

### 4. **Growth Messaging & Post-Run Diagnostics** ✅
**File:** `lib/game/quizPersistence.ts` + `app/page.tsx`

**What's captured:**
- Accuracy breakdown by concept family
- Families with <60% accuracy flagged as "struggles" (orange)
- Families with ≥80% accuracy flagged as "mastering" (green)
- Hint count shown
- One actionable insight generated per run

**GrowthSummary output:**
```typescript
export type GrowthSummary = {
  accuracyByFamily: Record<ConceptFamily, { correct, total, percentage }>;
  strugglingFamilies: ConceptFamily[]; // < 60%
  masteringFamilies: ConceptFamily[]; // ≥ 80%
  actionableInsight: string; // one key takeaway
  hintsShown: number;
  interleavingInjections: number;
};
```

**UI Rendering (on summary screen):**
```
🌱 Growth Summary
[Actionable insight in large text]

✨ You're mastering:
  • spelling-vowel-sound — 90% (9/10 correct)
  
🎯 Focus areas:
  • math-multiplication — 50% (3/6 correct)
  
💡 2 hints appeared to help you learn.
```

**Key function:**
```typescript
generateGrowthSummary(diagnostics): GrowthSummary
```

---

### 5. **Autonomy Layer: Question Focus Mode Selector** ✅
**File:** `app/page.tsx`

**How it works:**
- Learner (or parent) selects question focus before game: Maths, Words, or Mix
- Affects weighting of question selection throughout the game
- "Mix" mode: 50/50 maths vs words (default)
- "Maths focus": 100% maths questions
- "Words focus": 100% word skill questions

**UI Location:** Title screen, "Learning Setup" section
```
Question focus (autonomy):
  ○ Mix (50/50)
  ◉ Maths focus
  ○ Words focus
```

**Implementation:**
- Passed to `createQuestion()` which uses it to weight RNG
- Integrated into voice feedback when mode is selected
- Stored in diagnostics for per-run analysis

**Code:**
```typescript
const isMathsRound =
  autonomyMode === "maths" ? true :
  autonomyMode === "words" ? false :
  Math.random() < 0.5; // "mix"
```

---

## Code Architecture

### New Types (quizPersistence.ts)
```typescript
type ConceptFamily = SkillArea; // aliases the 10 skill areas
type SpacedRepetitionSlot;      // tracks future question slots
type InterleavingState;         // tracks consecutive family count
type HintTracker;               // wrong answer count per family
type QuestionAnswerRecord;      // single answer event
type RunDiagnostics;            // session-wide data
type GrowthSummary;             // post-run insights
```

### New State (page.tsx)
```typescript
const [autonomyMode, setAutonomyMode] = useState<"maths" | "words" | "mix">("mix");
const [diagnostics, setDiagnostics] = useState<RunDiagnostics | null>();
const [growthSummary, setGrowthSummary] = useState<GrowthSummary | null>();
const [currentHintText, setCurrentHintText] = useState<string | null>();
```

### Integrated Hooks
- **Game start:** Initializes new RunDiagnostics with empty queues
- **Each answer:** Records attempt, checks hint eligibility, updates queues
- **Game end:** Generates GrowthSummary from diagnostics, clears storage
- **UI:** Displays hint when `currentHintText` is set; renders growth panel on summary

---

## Quality Gates

### ✅ Spacing is Natural
- 8–12 turn intervals vary per concept, preventing mechanical repetition
- Confidence level can eventually adjust intervals (framework in place)
- Learned concepts naturally fade in and out during long sessions

### ✅ Hints Feel Helpful
- Only appear after 2 wrong attempts (not premature)
- Contextual to the concept family (not generic)
- Visual scaffold without giving away the answer
- Reset on correct answer, encouraging persistence

### ✅ Growth Messaging is Genuine
- Derived from actual run data (not templated)
- Actionable insight focused on single biggest opportunity
- Separates "mastering" (high confidence) from "struggling" (needs focus)
- Celebrates progress while being honest about growth areas

### ✅ Interleaving Injection Works
- Forces after exactly 3 consecutive from same family
- Picks from available alternatives (varies per stage/mode)
- Prevents single-family dominance, improves discrimination learning

---

## Files Modified

1. **lib/game/quizPersistence.ts** (+280 lines)
   - Added all pedagogy types and functions
   - Save/load diagnostics to localStorage
   
2. **app/page.tsx** (~150 lines added/modified)
   - Added pedagogy state hooks
   - Updated `createQuestion()` to accept autonomy mode
   - Integrated `recordQuestionAttempt()` in answer handler
   - Hint display in quiz UI
   - Growth summary panel on summary screen
   - Autonomy mode selector on title screen
   - Updated `startGame()` and `finishRun()` for pedagogy lifecycle

---

## Usage Example

**For learner:**
1. On title screen, select "Maths focus" from autonomy dropdown
2. Start game
3. First 3 maths questions appear; interleaving may inject a word question on #4
4. After answering 3+ questions correctly in "math-multiplication", that family gets a slot reserved for turn 12
5. If 2 wrong answers accumulate on "math-addition", hint appears: "💡 Tip: Use your fingers..."
6. Game ends → summary shows:
   - ✨ Mastering: math-multiplication (88%)
   - 🎯 Focus: spelling-vowel-sound (40%)
   - 💡 2 hints appeared. One actionable insight given.

---

## Next Steps (Future Lanes)

- **Lane 7+:** Difficulty adaptation based on accuracy trends
- **Lane +:** Social learning (compare growth summaries, friendly challenges)
- **Lane +:** Parent dashboard showing longitudinal progress
- **Lane +:** Export diagnostics for teacher review
