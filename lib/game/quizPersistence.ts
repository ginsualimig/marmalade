export type DifficultyMode = "sprout" | "spark" | "comet";

export type ParentSettings = {
  persistDifficulty: boolean;
  persistProgress: boolean;
  persistHighScore: boolean;
  persistSummaries: boolean;
};

export type StoredHighScores = Record<DifficultyMode, number>;

export type RunSummary = {
  id: string;
  playedAt: number;
  mode: DifficultyMode;
  result: "victory" | "game-over";
  score: number;
  accuracy: number;
  bossesDefeated: number;
  maxStreak: number;
};

export type PersistedRun<TBattle> = {
  mode: DifficultyMode;
  battle: TBattle;
  checkpoint: TBattle | null;
  savedAt: number;
};

const SETTINGS_KEY = "marmalade-parent-settings-v1";
const MODE_KEY = "marmalade-mode-v1";
const HIGH_SCORE_KEY = "marmalade-high-scores-v1";
const SUMMARY_KEY = "marmalade-run-summaries-v1";
const PROGRESS_KEY = "marmalade-progress-v1";

export const DEFAULT_PARENT_SETTINGS: ParentSettings = {
  persistDifficulty: true,
  persistProgress: true,
  persistHighScore: true,
  persistSummaries: true
};

const isBrowser = () => typeof window !== "undefined" && !!window.localStorage;

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const loadParentSettings = (): ParentSettings => {
  if (!isBrowser()) return DEFAULT_PARENT_SETTINGS;
  const raw = safeParse<Partial<ParentSettings>>(window.localStorage.getItem(SETTINGS_KEY), {});
  return {
    persistDifficulty: raw.persistDifficulty ?? DEFAULT_PARENT_SETTINGS.persistDifficulty,
    persistProgress: raw.persistProgress ?? DEFAULT_PARENT_SETTINGS.persistProgress,
    persistHighScore: raw.persistHighScore ?? DEFAULT_PARENT_SETTINGS.persistHighScore,
    persistSummaries: raw.persistSummaries ?? DEFAULT_PARENT_SETTINGS.persistSummaries
  };
};

export const saveParentSettings = (settings: ParentSettings) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadPreferredMode = (): DifficultyMode | null => {
  if (!isBrowser()) return null;
  const mode = window.localStorage.getItem(MODE_KEY);
  return mode === "sprout" || mode === "spark" || mode === "comet" ? mode : null;
};

export const savePreferredMode = (mode: DifficultyMode) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(MODE_KEY, mode);
};

export const clearPreferredMode = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(MODE_KEY);
};

const sanitizeScore = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
};

export const loadHighScores = (): StoredHighScores => {
  if (!isBrowser()) return { sprout: 0, spark: 0, comet: 0 };
  const raw = safeParse<Partial<StoredHighScores>>(window.localStorage.getItem(HIGH_SCORE_KEY), {});
  return {
    sprout: sanitizeScore(raw.sprout),
    spark: sanitizeScore(raw.spark),
    comet: sanitizeScore(raw.comet)
  };
};

export const saveHighScores = (scores: StoredHighScores) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
};

export const clearHighScores = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(HIGH_SCORE_KEY);
};

export const loadRunSummaries = (): RunSummary[] => {
  if (!isBrowser()) return [];
  const raw = safeParse<RunSummary[]>(window.localStorage.getItem(SUMMARY_KEY), []);
  return raw
    .filter((item) => item && (item.result === "victory" || item.result === "game-over"))
    .slice(0, 12);
};

export const saveRunSummaries = (summaries: RunSummary[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(SUMMARY_KEY, JSON.stringify(summaries.slice(0, 12)));
};

export const clearRunSummaries = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SUMMARY_KEY);
};

export const loadProgress = <TBattle>(): PersistedRun<TBattle> | null => {
  if (!isBrowser()) return null;
  return safeParse<PersistedRun<TBattle> | null>(window.localStorage.getItem(PROGRESS_KEY), null);
};

export const saveProgress = <TBattle>(progress: PersistedRun<TBattle>) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const clearProgress = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROGRESS_KEY);
};

export const currentTimestamp = () => Date.now();

export const createRunId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Math.floor(Math.random() * 1_000_000_000)}`;
};
