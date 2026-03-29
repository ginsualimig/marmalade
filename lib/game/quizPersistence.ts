import type { StageId } from "@/lib/game/curriculum";

export type DifficultyMode = "sprout" | "spark" | "comet";
export type LearnerLevel = "beginner" | "growing" | "expert";

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
  livesRemaining: number;
};

export type PersistedRun<TBattle> = {
  mode: DifficultyMode;
  level?: LearnerLevel;
  battle: TBattle;
  checkpoint: TBattle | null;
  savedAt: number;
};

/**
 * Power Level: Tracks mastery progression per question family (skill area)
 * Range: 0-100 representing Novice → Apprentice → Adept → Master
 * Increments: +5 per correct answer in family, -1 per wrong answer
 */
export type PowerLevel = {
  level: number; // 0-100
  stage: "novice" | "apprentice" | "adept" | "master";
  experience: number; // raw XP, for future progression tracking
};

export type PowerLevelMap = Record<string, PowerLevel>;

export type PersistedPowerLevels = {
  mode: DifficultyMode;
  familyProgression: PowerLevelMap;
  lastUpdated: number;
};

const SETTINGS_KEY = "marmalade-parent-settings-v1";
const MODE_KEY = "marmalade-mode-v1";
const LEVEL_KEY = "marmalade-level-v1";
const STAGE_KEY = "marmalade-stage-v1";
const HIGH_SCORE_KEY = "marmalade-high-scores-v1";
const SUMMARY_KEY = "marmalade-run-summaries-v1";
const PROGRESS_KEY = "marmalade-progress-v1";
const POWER_LEVELS_KEY = "marmalade-power-levels-v1";

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

export const loadPreferredLevel = (): LearnerLevel | null => {
  if (!isBrowser()) return null;
  const level = window.localStorage.getItem(LEVEL_KEY);
  return level === "beginner" || level === "growing" || level === "expert" ? level : null;
};

export const savePreferredLevel = (level: LearnerLevel) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(LEVEL_KEY, level);
};

export const clearPreferredMode = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(MODE_KEY);
};

export const clearPreferredLevel = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(LEVEL_KEY);
};

export const loadPreferredStage = (): StageId | null => {
  if (!isBrowser()) return null;
  const stage = window.localStorage.getItem(STAGE_KEY);
  return stage === "k1" || stage === "k2" || stage === "p1" || stage === "p2" || stage === "p3" || stage === "p4" || stage === "p5" || stage === "p6"
    ? stage
    : null;
};

export const savePreferredStage = (stage: StageId) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STAGE_KEY, stage);
};

export const clearPreferredStage = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STAGE_KEY);
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

/**
 * Power Level Management
 */
export const getPowerLevelStage = (level: number): PowerLevel["stage"] => {
  if (level >= 80) return "master";
  if (level >= 60) return "adept";
  if (level >= 40) return "apprentice";
  return "novice";
};

export const loadPowerLevels = (mode: DifficultyMode): PowerLevelMap => {
  if (!isBrowser()) return {};
  const raw = safeParse<PersistedPowerLevels | null>(
    window.localStorage.getItem(POWER_LEVELS_KEY),
    null
  );
  if (!raw || raw.mode !== mode) return {};
  return raw.familyProgression || {};
};

export const savePowerLevels = (mode: DifficultyMode, familyProgression: PowerLevelMap) => {
  if (!isBrowser()) return;
  const data: PersistedPowerLevels = {
    mode,
    familyProgression,
    lastUpdated: currentTimestamp()
  };
  window.localStorage.setItem(POWER_LEVELS_KEY, JSON.stringify(data));
};

export const clearPowerLevels = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(POWER_LEVELS_KEY);
};

export const updatePowerLevel = (
  familyId: string,
  current: PowerLevel | undefined,
  wasCorrect: boolean
): PowerLevel => {
  const baseLevel = current?.level ?? 0;
  const baseExp = current?.experience ?? 0;
  
  // +5 per correct, -1 per wrong (but never go below 0)
  const levelDelta = wasCorrect ? 5 : -1;
  const newLevel = Math.max(0, Math.min(100, baseLevel + levelDelta));
  const newExp = baseExp + (wasCorrect ? 5 : 0);
  
  return {
    level: newLevel,
    stage: getPowerLevelStage(newLevel),
    experience: newExp
  };
};

/**
 * PEDAGOGY LAYER: Spaced Repetition, Interleaving, Hints, Growth Messaging
 */

export type SkillArea =
  | "spelling-missing-letter"
  | "spelling-beginning-sound"
  | "spelling-word-ending"
  | "spelling-letter-count"
  | "spelling-vowel-sound"
  | "spelling-unscramble"
  | "math-add-subtract"
  | "math-missing-number"
  | "math-two-step"
  | "math-multiplication";

export type ConceptFamily = SkillArea; // aliases for clarity

/**
 * Spaced Repetition Queue: Tracks question slot reservations.
 * Questions from learned concepts are reserved at 8–12 turn intervals.
 */
export type SpacedRepetitionSlot = {
  familyId: ConceptFamily;
  reservedAtTurn: number;
  targetTurn: number; // turn when this family should reappear (8–12 after reserved)
  lastAskedAt?: number; // turn number when question was last asked
  confidenceLevel: number; // 0-100, drives spacing intervals
};

export type SpacedRepetitionQueue = {
  slots: SpacedRepetitionSlot[];
  currentTurn: number;
};

/**
 * Interleaving State: Tracks consecutive questions from same family
 * and triggers diversity injection after 3 from one family.
 */
export type InterleavingState = {
  consecutiveFromFamily: ConceptFamily | null;
  consecutiveCount: number;
  lastFamilyAsked: ConceptFamily | null;
};

/**
 * Hint Tracker: Records wrong answer counts per family.
 * Shows hint (optional visual scaffold) after 2 wrong answers on a concept.
 */
export type HintTracker = Record<ConceptFamily, number>; // wrong answer count

/**
 * Question Answer Record: Used for growth messaging diagnostics.
 */
export type QuestionAnswerRecord = {
  familyId: ConceptFamily;
  turnNumber: number;
  wasCorrect: boolean;
  attemptCount: number; // 1=first try, 2+=needed help
};

/**
 * Run Diagnostics: Collected during game session for post-run growth messaging.
 */
export type RunDiagnostics = {
  sessionStartedAt: number;
  mode: DifficultyMode;
  autonomyMode: "maths" | "words" | "mix"; // learner autonomy choice
  totalQuestionsAsked: number;
  recordsByFamily: Map<ConceptFamily, QuestionAnswerRecord[]>;
  hintTracker: HintTracker;
  spacedRepetitionQueue: SpacedRepetitionQueue;
  interleavingState: InterleavingState;
};

/**
 * Growth Summary: Post-run insights shown to learner.
 */
export type GrowthSummary = {
  accuracyByFamily: Record<ConceptFamily, { correct: number; total: number; percentage: number }>;
  strugglingFamilies: ConceptFamily[]; // orange-flagged (< 60% accuracy)
  masteringFamilies: ConceptFamily[]; // green (>= 80% accuracy)
  actionableInsight: string; // one key takeaway
  hintsShown: number;
  interleavingInjections: number; // how many times diversity was forced
};

const PEDAGOGY_QUEUE_KEY = "marmalade-spaced-rep-queue-v1";
const PEDAGOGY_INTERLEAVE_KEY = "marmalade-interleave-state-v1";
const PEDAGOGY_HINTS_KEY = "marmalade-hints-tracker-v1";
const PEDAGOGY_DIAGNOSTICS_KEY = "marmalade-run-diagnostics-v1";

/**
 * Initialize spaced repetition queue for a session.
 */
export const initializeSpacedRepetitionQueue = (): SpacedRepetitionQueue => {
  return {
    slots: [],
    currentTurn: 0
  };
};

/**
 * Initialize interleaving state for a session.
 */
export const initializeInterleavingState = (): InterleavingState => {
  return {
    consecutiveFromFamily: null,
    consecutiveCount: 0,
    lastFamilyAsked: null
  };
};

/**
 * Initialize hint tracker for a session.
 */
export const initializeHintTracker = (): HintTracker => {
  return {} as HintTracker;
};

/**
 * Record a question being asked and answered.
 * Updates spaced repetition queue, interleaving state, and hint tracker.
 */
export const recordQuestionAttempt = (
  diagnostics: RunDiagnostics,
  familyId: ConceptFamily,
  wasCorrect: boolean
): void => {
  // Record the attempt
  if (!diagnostics.recordsByFamily.has(familyId)) {
    diagnostics.recordsByFamily.set(familyId, []);
  }
  
  const records = diagnostics.recordsByFamily.get(familyId)!;
  const attemptCount = records.filter(r => r.turnNumber === diagnostics.totalQuestionsAsked).length + 1;
  
  records.push({
    familyId,
    turnNumber: diagnostics.totalQuestionsAsked,
    wasCorrect,
    attemptCount
  });
  
  // Update hint tracker (cumulative — wrong answers accumulate across the session)
  if (!wasCorrect) {
    diagnostics.hintTracker[familyId] = (diagnostics.hintTracker[familyId] ?? 0) + 1;
  }
  // NOTE: do NOT reset on correct — hints should be cumulative per family
  
  // Update interleaving state
  if (familyId === diagnostics.interleavingState.consecutiveFromFamily) {
    diagnostics.interleavingState.consecutiveCount++;
  } else {
    diagnostics.interleavingState.consecutiveFromFamily = familyId;
    diagnostics.interleavingState.consecutiveCount = 1;
  }
  diagnostics.interleavingState.lastFamilyAsked = familyId;
  
  // Update spaced repetition queue — increment at the START of the attempt
  // so currentTurn represents the turn the question was asked on,
  // making slot.targetTurn <= currentTurn checks land on the right turn.
  diagnostics.spacedRepetitionQueue.currentTurn++;
  const turn = diagnostics.spacedRepetitionQueue.currentTurn;

  // If correct, reserve this family for a future slot (8–12 turns out)
  if (wasCorrect && records.length >= 3) { // Mark as "learned" after 3 correct
    const existingSlot = diagnostics.spacedRepetitionQueue.slots.find(s => s.familyId === familyId);
    const spacingInterval = 8 + Math.floor(Math.random() * 5); // 8–12
    const targetTurn = turn + spacingInterval;
    
    if (existingSlot) {
      existingSlot.targetTurn = targetTurn;
      existingSlot.lastAskedAt = turn;
      existingSlot.confidenceLevel = Math.min(100, existingSlot.confidenceLevel + 10);
    } else {
      diagnostics.spacedRepetitionQueue.slots.push({
        familyId,
        reservedAtTurn: turn,
        targetTurn,
        lastAskedAt: turn,
        confidenceLevel: 50
      });
    }
  }
};

/**
 * Check if a hint should be shown for a family.
 * Returns true after 1 or more cumulative wrong answers for that family in the session.
 */
export const shouldShowHint = (diagnostics: RunDiagnostics, familyId: ConceptFamily): boolean => {
  return (diagnostics.hintTracker[familyId] ?? 0) >= 1;
};

/**
 * Determine if interleaving should inject a different concept.
 * Returns true after 3 consecutive questions from same family.
 */
export const shouldInjectDiversity = (diagnostics: RunDiagnostics): boolean => {
  return diagnostics.interleavingState.consecutiveCount >= 3;
};

/**
 * Get the next family to ask based on spaced repetition and interleaving.
 * @param availableFamilies - all families available in this stage/mode
 * @param diagnostics - current session diagnostics
 * @returns the family to ask next, or null to let caller choose
 */
export const getNextFamilyByPedagogy = (
  availableFamilies: ConceptFamily[],
  diagnostics: RunDiagnostics
): ConceptFamily | null => {
  const turn = diagnostics.spacedRepetitionQueue.currentTurn;
  
  // Rule 1: If interleaving says we need diversity, pick a different family
  if (shouldInjectDiversity(diagnostics)) {
    const currentFamily = diagnostics.interleavingState.consecutiveFromFamily;
    const alternatives = availableFamilies.filter(f => f !== currentFamily);
    if (alternatives.length > 0) {
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    }
  }
  
  // Rule 2: Check if any spaced repetition slots are due
  const dueSlots = diagnostics.spacedRepetitionQueue.slots.filter(slot => slot.targetTurn <= turn);
  if (dueSlots.length > 0) {
    const slotToUse = dueSlots[0];
    return slotToUse.familyId;
  }
  
  // Rule 3: Default to null, let caller use random or curriculum-based selection
  return null;
};

/**
 * Generate post-run growth summary from diagnostics.
 */
export const generateGrowthSummary = (diagnostics: RunDiagnostics): GrowthSummary => {
  const accuracyByFamily: Record<ConceptFamily, { correct: number; total: number; percentage: number }> = {
    "spelling-missing-letter": { correct: 0, total: 0, percentage: 0 },
    "spelling-beginning-sound": { correct: 0, total: 0, percentage: 0 },
    "spelling-word-ending": { correct: 0, total: 0, percentage: 0 },
    "spelling-letter-count": { correct: 0, total: 0, percentage: 0 },
    "spelling-vowel-sound": { correct: 0, total: 0, percentage: 0 },
    "spelling-unscramble": { correct: 0, total: 0, percentage: 0 },
    "math-add-subtract": { correct: 0, total: 0, percentage: 0 },
    "math-missing-number": { correct: 0, total: 0, percentage: 0 },
    "math-two-step": { correct: 0, total: 0, percentage: 0 },
    "math-multiplication": { correct: 0, total: 0, percentage: 0 }
  };
  let hintsShown = 0;
  const interleavingInjections = 0;
  
  // Tally accuracy per family
  diagnostics.recordsByFamily.forEach((records, familyId) => {
    const correct = records.filter(r => r.wasCorrect).length;
    const total = records.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    accuracyByFamily[familyId] = { correct, total, percentage };
  });
  
  // Count hints shown: sum total wrong attempts across families
  // (hint triggers after 1st wrong per family, so total wrongs ≈ total hint opportunities)
  Object.values(diagnostics.hintTracker).forEach(count => {
    hintsShown += count;
  });
  
  // Count interleaving injections (rough estimate: times consecutive count reset)
  const injectionCount = 0;
  // This would require more detailed tracking; for now, estimate based on diversity
  
  // Identify struggling and mastering families
  const strugglingFamilies = Object.entries(accuracyByFamily)
    .filter(([_, stats]) => stats.percentage < 60)
    .map(([familyId, _]) => familyId as ConceptFamily)
    .sort((a, b) => (accuracyByFamily[a].percentage - accuracyByFamily[b].percentage));
  
  const masteringFamilies = Object.entries(accuracyByFamily)
    .filter(([_, stats]) => stats.percentage >= 80)
    .map(([familyId, _]) => familyId as ConceptFamily);
  
  // Generate actionable insight
  let actionableInsight = "Keep practicing! You're building confidence.";
  if (strugglingFamilies.length > 0) {
    const toFocus = strugglingFamilies[0];
    actionableInsight = `Focus on ${toFocus.replace(/-/g, " ")} next time. It's the area where you can grow most.`;
  } else if (masteringFamilies.length > 0) {
    actionableInsight = `You've mastered ${masteringFamilies[0].replace(/-/g, " ")}! Time to challenge yourself with harder problems.`;
  }
  
  return {
    accuracyByFamily,
    strugglingFamilies,
    masteringFamilies,
    actionableInsight,
    hintsShown,
    interleavingInjections
  };
};

/**
 * Save/load diagnostics for session persistence.
 */
export const saveDiagnostics = (diagnostics: RunDiagnostics) => {
  if (!isBrowser()) return;
  // Convert Map to serializable format
  const recordsByFamilyObj = Object.fromEntries(diagnostics.recordsByFamily);
  const data = {
    sessionStartedAt: diagnostics.sessionStartedAt,
    mode: diagnostics.mode,
    autonomyMode: diagnostics.autonomyMode,
    totalQuestionsAsked: diagnostics.totalQuestionsAsked,
    recordsByFamily: recordsByFamilyObj,
    hintTracker: diagnostics.hintTracker,
    spacedRepetitionQueue: diagnostics.spacedRepetitionQueue,
    interleavingState: diagnostics.interleavingState
  };
  window.localStorage.setItem(PEDAGOGY_DIAGNOSTICS_KEY, JSON.stringify(data));
};

export const loadDiagnostics = (): RunDiagnostics | null => {
  if (!isBrowser()) return null;
  const raw = safeParse<Record<string, unknown> | null>(window.localStorage.getItem(PEDAGOGY_DIAGNOSTICS_KEY), null);
  if (!raw) return null;

  const recordsByFamily = raw.recordsByFamily && typeof raw.recordsByFamily === "object"
    ? new Map(Object.entries(raw.recordsByFamily as Record<string, QuestionAnswerRecord[]>)) as Map<ConceptFamily, QuestionAnswerRecord[]>
    : new Map<ConceptFamily, QuestionAnswerRecord[]>();

  return {
    sessionStartedAt: typeof raw.sessionStartedAt === "number" ? raw.sessionStartedAt : 0,
    mode: raw.mode === "sprout" || raw.mode === "spark" || raw.mode === "comet" ? raw.mode : "spark",
    autonomyMode: raw.autonomyMode === "maths" || raw.autonomyMode === "words" || raw.autonomyMode === "mix" ? raw.autonomyMode : "mix",
    totalQuestionsAsked: typeof raw.totalQuestionsAsked === "number" ? raw.totalQuestionsAsked : 0,
    recordsByFamily,
    hintTracker: (raw.hintTracker as RunDiagnostics["hintTracker"]) || initializeHintTracker(),
    spacedRepetitionQueue: (raw.spacedRepetitionQueue as RunDiagnostics["spacedRepetitionQueue"]) || initializeSpacedRepetitionQueue(),
    interleavingState: (raw.interleavingState as RunDiagnostics["interleavingState"]) || initializeInterleavingState()
  };
};

export const clearDiagnostics = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PEDAGOGY_DIAGNOSTICS_KEY);
};
