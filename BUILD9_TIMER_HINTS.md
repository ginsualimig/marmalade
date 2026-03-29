# BUILD 9 — Timer Tiers & Family-Specific Hint Library

## Changes

### 1. Timer Tiers (Question Time Limit per Mode)

Each difficulty mode now has an age-appropriate time limit per question:

| Mode | Age Band | Time per Question | Rationale |
|------|----------|-------------------|-----------|
| **Sprout** | K1–P1 (ages 4–6) | **90 seconds** | Youngest learners need more processing time; visual/motor recall is slower |
| **Spark** | P2–P4 (ages 7–9) | **60 seconds** | Standard pacing for mid-primary; balances fluency with thought |
| **Comet** | P5–P6 (ages 10+) | **45 seconds** | Older children process faster; tighter pacing builds retrieval fluency |

**Implementation:**
- `QUESTION_TIME_TIERS` record in `app/page.tsx` maps `DifficultyMode → seconds`.
- `getQuestionTimeLimit(mode)` helper used wherever the limit is needed.
- Timer resets to the mode-appropriate tier on each new question and on retry.
- All timer-urgency CSS classes (`urgent`, `critical`) scale correctly against the active tier.

---

### 2. Hint System — Cumulative Wrong Tracking

**Before (consecutive tracking):**
- `hintTracker[familyId]` incremented on wrong, **reset to 0 on correct**.
- Hint shown after `≥ 2` consecutive wrongs on the same family.
- Result: kids cycling through different families saw **zero hints** all session.

**After (cumulative tracking, BUILD 9):**
- `hintTracker[familyId]` incremented on wrong; **never reset** during the session.
- Hint shown after `≥ 1` cumulative wrong on any family.
- Result: first mistake on any family immediately triggers a relevant, specific hint.
- Each subsequent wrong on the same family re-triggers the hint (no debounce — repetition reinforces the strategy).

**Code changes in `lib/game/quizPersistence.ts`:**
- `recordQuestionAttempt()`: removed the `else { hintTracker[familyId] = 0 }` reset branch.
- `shouldShowHint()`: threshold lowered from `>= 2` to `>= 1`.
- `generateGrowthSummary()`: `hintsShown` now sums all wrong attempts (accurate since each wrong after the first triggers a hint).

---

### 3. Family-Specific Hint Library (10 Hints)

All 10 `SkillArea` families have a unique, actionable hint. Each is written for a child's perspective — concrete strategy, not generic encouragement.

| SkillArea | Hint |
|-----------|------|
| `spelling-missing-letter` | Say the whole word slowly in your head. Which sound is missing? That sound is written as one letter. |
| `spelling-beginning-sound` | Say the word aloud. What sound do you hear first? Pick the letter that makes that sound. |
| `spelling-word-ending` | Listen to the last part of the word. Many words share the same endings — like -ing, -er, or -tion. |
| `spelling-letter-count` | Point to each letter as you say it aloud. How many fingers do you have up by the end? |
| `spelling-vowel-sound` | Vowels are A, E, I, O, U (and sometimes Y!). Say the word again — which vowel sound do you hear? |
| `spelling-unscramble` | Look for any small words hidden inside the scrambled letters first (like 'at', 'in', 'an'), then build the rest. |
| `math-add-subtract` | Use your fingers to count up or down. You can also draw dots to help you see the numbers. |
| `math-missing-number` | Try counting forward from the bigger number. For ? + 4 = 9, start at 4 and count up to 9 — how many steps? |
| `math-two-step` | Solve one step at a time. Find the answer to the first part, then use that number for the second part. |
| `math-multiplication` | Think of equal groups. 3 × 4 means 3 groups of 4. Try skip-counting by that number, or use facts you already know. |

**Design principles applied:**
- **Spelling hints** focus on the specific phonological or morphological strategy relevant to each variant (sounding out, chunking endings, finding embedded words).
- **Maths hints** give procedural scaffolding (counting up, skip-counting, two-step breakdown) rather than the answer.
- No hint is a "spoiler" — all guide the child's process.
- Hints are medium-length, plain English, no jargon.

---

## Files Changed

| File | Change |
|------|--------|
| `app/page.tsx` | Added `QUESTION_TIME_TIERS` map + `getQuestionTimeLimit()`; updated all timer references; replaced hint map with 10 family-specific hints |
| `lib/game/quizPersistence.ts` | Hint tracking: removed per-correct reset; lowered threshold to 1; updated `hintsShown` tally |

## Backward Compatibility

- All existing game logic (HP, damage, boss phases, power levels, spaced repetition, interleaving) is preserved.
- Existing saved progress, high scores, and run summaries are unaffected.
- `HintTracker` type signature unchanged; only semantics differ.
