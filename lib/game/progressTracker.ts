/**
 * ProgressTracker — Longitudinal progress store
 *
 * Stores a rolling history of per-session accuracy by skill family.
 * Used by parents to see improvement over multiple sessions.
 */

import type { SkillArea, DifficultyMode } from "./quizPersistence";

export type ProgressHistoryEntry = {
  id: string;
  sessionNumber: number; // human-readable session counter (1-based)
  playedAt: number;
  mode: DifficultyMode;
  familyId: SkillArea;
  attempts: number;
  correct: number;
  accuracy: number; // 0-100
};

export type ProgressHistory = ProgressHistoryEntry[];

const PROGRESS_HISTORY_KEY = "marmalade-progress-history-v1";
const SESSION_COUNTER_KEY = "marmalade-session-counter-v1";
const MAX_HISTORY_ENTRIES = 200; // cap to avoid unbounded growth

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const createEntryId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

/** Load the full progress history from localStorage */
export const loadProgressHistory = (): ProgressHistory => {
  if (!isBrowser()) return [];
  return safeParse<ProgressHistory>(window.localStorage.getItem(PROGRESS_HISTORY_KEY), []);
};

/** Save the full progress history to localStorage */
const saveProgressHistory = (history: ProgressHistory): void => {
  if (!isBrowser()) return;
  // Keep only the most recent MAX_HISTORY_ENTRIES
  const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
  window.localStorage.setItem(PROGRESS_HISTORY_KEY, JSON.stringify(trimmed));
};

/** Get and increment the human-readable session counter */
const nextSessionNumber = (): number => {
  if (!isBrowser()) return 1;
  const current = safeParse<number>(window.localStorage.getItem(SESSION_COUNTER_KEY), 0);
  const next = current + 1;
  window.localStorage.setItem(SESSION_COUNTER_KEY, String(next));
  return next;
};

/**
 * Record per-family accuracy for a completed run.
 * Call this from appendSummary (or finishRun) after saving RunSummary.
 *
 * @param mode         - The difficulty mode played
 * @param skillProgress - The skillProgress map from BattleStats
 */
export const recordProgressForRun = (
  mode: DifficultyMode,
  skillProgress: Record<SkillArea, { attempts: number; correct: number }>
): void => {
  const history = loadProgressHistory();
  const sessionNumber = nextSessionNumber();
  const playedAt = Date.now();

  for (const [familyId, stats] of Object.entries(skillProgress)) {
    if (stats.attempts === 0) continue; // skip families not attempted
    const accuracy = Math.round((stats.correct / stats.attempts) * 100);
    history.push({
      id: createEntryId(),
      sessionNumber,
      playedAt,
      mode,
      familyId: familyId as SkillArea,
      attempts: stats.attempts,
      correct: stats.correct,
      accuracy
    });
  }

  saveProgressHistory(history);
};

/** Clear all progress history (for parental reset) */
export const clearProgressHistory = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROGRESS_HISTORY_KEY);
  window.localStorage.removeItem(SESSION_COUNTER_KEY);
};

/** Group history entries by familyId, sorted by sessionNumber descending (most recent first) */
export type FamilyProgressGroup = {
  familyId: SkillArea;
  entries: ProgressHistoryEntry[];
  latestSession: number; // highest sessionNumber for this family
  sessionCount: number;
  latestAccuracy: number; // from the most recent session
  trend: "improving" | "declining" | "stable"; // based on last 3 sessions
};

export const getProgressByFamily = (): FamilyProgressGroup[] => {
  const history = loadProgressHistory();
  if (history.length === 0) return [];

  // Group by familyId
  const groups: Record<string, ProgressHistoryEntry[]> = {};
  for (const entry of history) {
    if (!groups[entry.familyId]) groups[entry.familyId] = [];
    groups[entry.familyId].push(entry);
  }

  const result: FamilyProgressGroup[] = [];

  for (const [familyId, entries] of Object.entries(groups)) {
    // Sort by sessionNumber ascending (chronological)
    entries.sort((a, b) => a.sessionNumber - b.sessionNumber);

    const latestSession = Math.max(...entries.map((e) => e.sessionNumber));
    const latestEntry = entries.find((e) => e.sessionNumber === latestSession)!;
    const recentEntries = entries.slice(-3);

    // Determine trend from last 3 sessions
    let trend: FamilyProgressGroup["trend"] = "stable";
    if (recentEntries.length >= 2) {
      const first = recentEntries[0].accuracy;
      const last = recentEntries[recentEntries.length - 1].accuracy;
      if (last - first >= 10) trend = "improving";
      else if (first - last >= 10) trend = "declining";
    }

    result.push({
      familyId: familyId as SkillArea,
      entries,
      latestSession,
      sessionCount: entries.length,
      latestAccuracy: latestEntry?.accuracy ?? 0,
      trend
    });
  }

  // Sort by latestSession descending (most recently played families first)
  result.sort((a, b) => b.latestSession - a.latestSession);

  return result;
};
