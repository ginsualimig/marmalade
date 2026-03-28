# Difficulty Retuning Summary — Beta Polish Sprint Lane 4

## What changed

### Core selector fix
- Replaced the opener's broad mode-level randomness with **stage-aware early curation** in `app/page.tsx`.
- Early questions now pull from the learner's **selected stage band** (`getSelectedStageId(mode, level)`) instead of mixing the entire mode pool.
- This removes the most visible credibility problem in Spark, where P2/P3/P4 words and question styles were leaking together too early.

### Early-round curation by mode
- Added per-mode curated plans (`CURATED_PLANS`) that control:
  - opener length
  - maths/words bias
  - allowed word-question variants
  - typed-answer pressure in the opener
  - early maths sequence
- Result: first 5–10 questions now follow a deliberate lane instead of feeling fully random.

### Stage-aware maths scaling
- Added `STAGE_MATH_PROFILES` to make operand sizes and operation types depend on the actual stage band.
- Spark no longer jumps from very easy sums straight into arbitrary heavier items just because the mode pool allows it.

### Reduced trivial word leakage in Spark
- Spark opener now excludes the weakest-feeling spelling variants that damaged credibility:
  - no beginning-sound opener spam
  - no letter-count filler in Spark/Comet curated plans
- Spark word prompts now favour missing-letter, endings, vowels, and unscramble.

## Tuning summary by mode

### Sprout
- Kept gentle, but made the opener more orderly.
- Stronger bias toward simple add/subtract and missing-number.
- Still allows beginner-friendly word forms, including early phonics-style prompts.

### Spark
- Biggest retune.
- Early questions now stay inside a coherent P2/P3/P4 stage band based on selected learner level.
- Opener sequence now leans on:
  - add/subtract fluency
  - missing number
  - light multiplication
  - delayed two-step entry
- Word opener avoids insultingly easy variants and uses more credible mid-primary tasks.

### Comet
- Kept challenging lane intact, but opener now feels more intentional.
- Stronger maths bias and heavier typed-answer allowance.
- Word prompts favour chunking, endings, and unscramble over lower-signal beginner-style checks.

## Structural issues not fixed in this pass
1. **Question families are still too generic.**
   - The live game still relies on a small set of procedural templates.
   - It does not yet generate truly curriculum-specific items like regrouping, fractions-of-a-set, equivalent fractions, or richer morphology tasks.

2. **No explicit per-stage content bank yet.**
   - We now gate by stage lexicon and stage maths profile, which is materially better.
   - But the strongest long-term fix is a real authored question bank tagged by stage, domain, and difficulty.

3. **Pedagogy queue still guides families, not difficulty bands.**
   - Interleaving/spaced repetition can help variety and reinforcement.
   - It still does not understand "too easy for this mode right now" beyond the new selector constraints.

4. **Boss-phase escalation is still numeric, not curricular.**
   - Later phases increase pressure mostly by range/operation complexity.
   - A better future pass would phase-shift by concept type, not just arithmetic size and template chance.
