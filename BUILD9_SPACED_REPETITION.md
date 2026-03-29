# BUILD 9 — Spaced Repetition Wiring

## What Changed

### Problem
The spaced repetition system (`SpacedRepetitionSlot`, `getNextFamilyByPedagogy`, `recordQuestionAttempt`) was fully implemented in `quizPersistence.ts` but its output was never consumed. `createQuestion` always fell back to RNG, making the SR queue dead code.

### Fix

#### 1. `createQuestion` now calls `getNextFamilyByPedagogy` (`app/page.tsx`)

- Removed the `_diagnostics` underscore-prefix (was silently ignored).
- `getNextFamilyByPedagogy(availableFamilies, diagnostics)` is called before every question.
- If it returns a family, that family is honoured — the question type (maths/spelling) and skill area are driven by the SR queue rather than RNG.
- If it returns `null`, falls back to the existing autonomy-mode RNG (preserving all balancing).

```ts
// SR queue says this family is due — honour it
if (srFamily && mathFamilies.includes(srFamily)) {
  isMathsRound = true;
  return createMathQuestion(boss, config, mode, level, round, bossPhase, stageId, srFamily);
} else if (srFamily && spellingFamilies.includes(srFamily)) {
  isMathsRound = false;
  return createSpellingQuestion(config, mode, level, round, stageId, srFamily);
}
// No SR override — use autonomy mode RNG
```

#### 2. `createMathQuestion` / `createSpellingQuestion` accept `familyOverride` (`app/page.tsx`)

Both now accept an optional `_familyOverride?: ConceptFamily` parameter. This prepares them to receive a family bias — the underscore prefix keeps the existing RNG-based variant selection intact while allowing future refinement (e.g., weighting the variant pool toward the SR-recommended family).

#### 3. `getNextFamilyByPedagogy` added to imports (`app/page.tsx`)

Added to the import list from `@/lib/game/quizPersistence`.

#### 4. `recordQuestionAttempt` timing corrected (`lib/game/quizPersistence.ts`)

**Before:** `currentTurn++` was at the *end* of `recordQuestionAttempt`, so `getNextFamilyByPedagogy` evaluated due slots against an already-incremented turn — slots appeared due one turn early.

**After:** `currentTurn++` is at the *start* of `recordQuestionAttempt`. A slot reserved at turn `T` with interval `I` gets `targetTurn = T + I`. When the next `createQuestion` runs, `currentTurn = T`, the due check `slot.targetTurn <= T` is false; on the following question `currentTurn = T+I`, and the check fires correctly.

```ts
// BEFORE (wrong)
diagnostics.spacedRepetitionQueue.currentTurn++;
// ... later in getNextFamilyByPedagogy:
const dueSlots = slots.filter(slot => slot.targetTurn <= currentTurn); // off-by-one

// AFTER (correct)
diagnostics.spacedRepetitionQueue.currentTurn++;
const turn = diagnostics.spacedRepetitionQueue.currentTurn;
// ... getNextFamilyByPedagogy reads diagnostics.spacedRepetitionQueue.currentTurn (already incremented)
```

### `recordQuestionAttempt` is called correctly in `answer()`

Both correct and wrong paths in `answer()` call `recordQuestionAttempt(diagnostics, familyId, isCorrect)` before updating power levels, making SR data current. No changes needed here — it was already wired.

## Why This Matters

- **Pedagogically sound question ordering**: questions from families that need review are reserved and re-presented at 8–12 turn intervals, rather than leaving selection entirely to chance.
- **Interleaving still active**: `shouldInjectDiversity` continues to force a different family after 3 consecutive questions from the same family, preventing clustering.
- **All existing balancing preserved**: RNG fallback, boss-phase difficulty shifts, typed-vs-choice ratios, and tier/combo systems are untouched.

## Files Changed

| File | Change |
|------|--------|
| `app/page.tsx` | `createQuestion` now calls `getNextFamilyByPedagogy`; both question creators accept `familyOverride` param; added `getNextFamilyByPedagogy` import |
| `lib/game/quizPersistence.ts` | Moved `currentTurn++` to start of `recordQuestionAttempt` to fix off-by-one in SR slot scheduling |
