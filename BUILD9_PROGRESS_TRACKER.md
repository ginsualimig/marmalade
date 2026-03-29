# BUILD 9 — Longitudinal Progress Tracker

## Summary

Added a **cross-session progress view** accessible from the title screen ("📊 Progress" button). It shows per-skill-family accuracy across all past sessions, enabling parents to observe a child's improvement over time.

---

## What Was Built

### 1. `lib/game/progressTracker.ts`

A new persistence module that stores a rolling history of per-session accuracy by skill family.

**Key types:**
```typescript
ProgressHistoryEntry = {
  id: string
  sessionNumber: number  // human-readable 1-based counter
  playedAt: number       // Unix timestamp
  mode: DifficultyMode
  familyId: SkillArea
  attempts: number
  correct: number
  accuracy: number       // 0–100 percentage
}
```

**Key functions:**
- `recordProgressForRun(mode, skillProgress)` — called at the end of each session to persist per-family accuracy. Skips families with 0 attempts.
- `loadProgressHistory()` / `saveProgressHistory()` — raw localStorage access
- `getProgressByFamily()` — aggregates entries into `FamilyProgressGroup[]`, each containing:
  - `latestSession`, `sessionCount`, `latestAccuracy`
  - `trend`: "improving" / "declining" / "stable" (based on last 3 sessions, ≥10% delta)
  - `entries`: chronological list of all sessions for that family
- `clearProgressHistory()` — parental reset

**Storage key:** `marmalade-progress-history-v1`
**Session counter key:** `marmalade-session-counter-v1`
**Cap:** 200 entries max (trimmed on write)

---

### 2. `app/page.tsx` Changes

**Import:**
```typescript
import { recordProgressForRun, getProgressByFamily, clearProgressHistory, type FamilyProgressGroup } from "@/lib/game/progressTracker";
```

**Screen type:** Added `"progress"` to the `Screen` union.

**`finishRun` hook:** Added `recordProgressForRun(mode, finalBattle.stats.skillProgress)` call immediately after `appendSummary(...)`.

**Title screen:** Added "📊 Progress" button alongside the existing Settings button.

**New `ProgressScreen` component:** A standalone functional component (not a hook consumer of `Page`) rendered when `screen === "progress"`. Features:
- Empty state with helpful message when no sessions recorded
- Per-family cards grouped by skill area
- Per-family latest-accuracy progress bar colored by trend (green/orange/blue)
- Chronological session list per family: `S{n}  date  mode  [bar]  accuracy%  correct/attempts`
- Session bars colored by accuracy: green ≥80%, yellow ≥60%, red <60%
- "Clear History" (with confirmation) and "Back to Title" buttons
- `useState`/`useEffect` only — no dependency on `Page`'s state hooks

---

### 3. `styles/globals.css` Additions

Added `.progress-screen-card`, `.progress-family-*`, `.progress-session-*`, `.progress-bar-*`, `.progress-screen-actions`, and `.danger-btn` styles.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| Separate `progressTracker.ts` from `quizPersistence.ts` | Keeps new code isolated; `quizPersistence.ts` is already large |
| Store per-family entries, not per-session summaries | Allows fine-grained per-family trend analysis; a single session can contribute up to 10 entries |
| `sessionNumber` is a human-readable counter stored separately | Independent of `RunSummary.id`; survives clear of summaries |
| `trend` computed from last 3 sessions, 10% delta threshold | Simple heuristic; avoids over-sensitivity to noise |
| No charting library | Explicit requirement; plain CSS bars are sufficient |
| "Progress" button visible to all (not PIN-locked) | Content is developmental feedback, not sensitive; PIN-locked parental settings remain separate |
| Progress history capped at 200 entries | Prevents unbounded localStorage growth with daily play |

---

## Usage Flow

1. Child completes a quiz session → `finishRun` calls `recordProgressForRun`
2. Parent opens title screen → taps "📊 Progress"
3. Progress screen loads → calls `getProgressByFamily()` → renders per-family cards
4. Each card shows: latest accuracy bar, trend badge, and chronological session list
5. Parent can tap "Clear History" to reset (with confirmation dialog)

---

## Files Changed

| File | Change |
|---|---|
| `lib/game/progressTracker.ts` | **New** — longitudinal progress store |
| `app/page.tsx` | Added import, `progress` screen type, `recordProgressForRun` call, `ProgressScreen` component, title-screen button, JSX block |
| `styles/globals.css` | Added progress screen styles |

---

## Testing Checklist

- [ ] Complete a session → open Progress → see at least one family card
- [ ] Complete 2+ sessions in same family → session list appears in chronological order
- [ ] Trend badge shows correct arrow for improving/declining/stable
- [ ] Bar colors reflect accuracy thresholds (green/yellow/red)
- [ ] Clear History removes all data and shows empty state
- [ ] Build passes (`npm run build`)
