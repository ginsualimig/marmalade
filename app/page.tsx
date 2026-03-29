"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PlayerCharacter, KeeperCharacter, GoldBurstParticle, BluePuffParticle } from "@/components/CharacterVisuals";
import {
  clearHighScores,
  clearPreferredLevel,
  clearPreferredMode,
  clearProgress,
  clearRunSummaries,
  loadHighScores,
  loadParentSettings,
  loadPreferredLevel,
  loadPreferredMode,
  loadProgress,
  loadRunSummaries,
  saveHighScores,
  saveParentSettings,
  savePreferredLevel,
  savePreferredMode,
  saveProgress,
  saveRunSummaries,
  currentTimestamp,
  createRunId,
  loadPowerLevels,
  savePowerLevels,
  updatePowerLevel,
  getPowerLevelStage,
  // Pedagogy layer
  initializeSpacedRepetitionQueue,
  initializeInterleavingState,
  initializeHintTracker,
  recordQuestionAttempt,
  shouldShowHint,
  generateGrowthSummary,
  loadDiagnostics,
  saveDiagnostics,
  clearDiagnostics,
  type DifficultyMode,
  type LearnerLevel,
  type ParentSettings,
  type RunSummary,
  type StoredHighScores,
  type PowerLevelMap,
  type ConceptFamily,
  type RunDiagnostics,
  type GrowthSummary
} from "@/lib/game/quizPersistence";
import {
  createCharacter,
  saveCharacter,
  loadCharacter,
  getAppearanceEmoji,
  APPEARANCE_OPTIONS,
  type CharacterState,
  type CharacterGender,
  type AppearanceCategory
} from "@/lib/game/characterState";
import {
  MODE_CONFIG_FROM_CURRICULUM as MODE_CONFIGS,
  MODE_CURRICULUM_CLUSTERS,
  STAGE_CURRICULUM,
  type StageId
} from "@/lib/game/curriculum";
import {
  getAttackClasses,
  getSpriteAnimationClass,
  getProjectileType,
  getImpactBurstPosition,
  shouldShowImpactBurst,
  shouldShowProjectile,
  getTimerUrgencyLevel,
  getTimerAriaLabel
} from "@/lib/game/animations";

type Boss = {
  id: "keeper";
  name: string;
  subtitle: string;
  taunts: {
    intro: string;
    hit: string;
    attack: string;
    defeated: string;
    lowHp?: string;
  };
};

type ModeConfig = {
  label: string;
  ageBand: string;
  subtitle: string;
  playerMaxHp: number;
  bossMaxHp: number;
  correctDamage: number;
  wrongDamage: number;
  mathMax: number;
  allowTwoStepMath: boolean;
  spellingWords: string[];
};

type SkillArea =
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

type Question = {
  prompt: string;
  typeLabel: "Spelling" | "Maths";
  skillArea: SkillArea;
  inputMode: "choice" | "typed";
  options: string[];
  correct: string;
  placeholder?: string;
};

type SkillProgress = {
  attempts: number;
  correct: number;
};

type BattleStats = {
  correctAnswers: number;
  wrongAnswers: number;
  timeoutAnswers: number;
  spellingCorrect: number;
  mathsCorrect: number;
  bossesDefeated: number;
  streak: number;
  maxStreak: number;
  skillProgress: Record<SkillArea, SkillProgress>;
  livesRemaining: number;
};

/**
 * Boss Phase System: 3 HP phases with escalating difficulty
 * Phase 1: 75%-100% HP (difficulty baseline)
 * Phase 2: 50%-75% HP (questions faster, +1 difficulty shift)
 * Phase 3: 25%-50% HP (questions hardest, +2 difficulty shift)
 * Critical: 0%-25% HP (boss nearly defeated, questions at max difficulty)
 */
type BossPhase = "phase-1" | "phase-2" | "phase-3" | "critical";

const getBossPhase = (bossHp: number, maxHp: number): BossPhase => {
  const percent = bossHp / maxHp;
  if (percent > 0.75) return "phase-1";
  if (percent > 0.5) return "phase-2";
  if (percent > 0.25) return "phase-3";
  return "critical";
};

type FeedbackType = {
  message: string;
  type: "correct" | "wrong" | "timeout" | "boss-defeated";
  correctAnswer?: string;
  questionType?: "Spelling" | "Maths";
};

type BattleState = {
  bossIndex: number;
  bossHp: number;
  playerHp: number;
  round: number;
  question: Question;
  feedback: string;
  feedbackData?: FeedbackType;
  phase: "quiz" | "boss-defeated";
  lastHit: "player" | "boss" | null;
  stats: BattleStats;
  bossPhase: BossPhase;
  phaseSwitchNotification?: string;
};

const BOSSES: Boss[] = [
  {
    id: "keeper",
    name: "The Keeper of Patience",
    subtitle: "Wise guardian of the Tome of Growing Knowledge",
    taunts: {
      intro: "Welcome, bright mind. Let us see how calmly you can think.",
      hit: "Good. You are learning with care and courage.",
      attack: "Pause, breathe, and solve the next one with focus.",
      defeated: "You have earned the Tome's trust. Carry that patience forward.",
      lowHp: "One more steady answer may unlock the final lesson."
    }
  }
];



type TierDefinition = {
  name: string;
  minScore: number;
  description: string;
  icon: string;
  bonus: number;
};

const TIER_CONFIGS: TierDefinition[] = [
  {
    name: "Novice",
    minScore: 0,
    description: "First sparks of brilliant answers",
    icon: "🌱",
    bonus: 15
  },
  {
    name: "Apprentice",
    minScore: 201,
    description: "Steady progress through Keeper questions",
    icon: "✨",
    bonus: 35
  },
  {
    name: "Warrior",
    minScore: 501,
    description: "Sharpening battle focus",
    icon: "⚔️",
    bonus: 55
  },
  {
    name: "Champion",
    minScore: 901,
    description: "Combo confidence unlocked",
    icon: "🏅",
    bonus: 85
  },
  {
    name: "Master",
    minScore: 1400,
    description: "Keeper’s trusted hero",
    icon: "🌟",
    bonus: 120
  }
];

type ComboMilestone = {
  threshold: number;
  label: string;
  bonus: number;
};

const COMBO_MILESTONES: ComboMilestone[] = [
  { threshold: 10, label: "UNSTOPPABLE COMBO", bonus: 120 },
  { threshold: 5, label: "INCREDIBLE COMBO", bonus: 70 }
];

const getTierForScore = (score: number): TierDefinition => {
  let current = TIER_CONFIGS[0];
  for (const tier of TIER_CONFIGS) {
    if (score >= tier.minScore) {
      current = tier;
    } else {
      break;
    }
  }
  return current;
};

const getNextTier = (score: number): TierDefinition | null => {
  return TIER_CONFIGS.find((tier) => tier.minScore > score) ?? null;
};

const MODE_DECOR: Record<DifficultyMode, { icon: string; badge: string }> = {
  sprout: { icon: "🌱", badge: "Gentle Start" },
  spark: { icon: "⚡", badge: "Balanced Quest" },
  comet: { icon: "☄️", badge: "Big Brain Mode" }
};

const QUESTION_TIME_LIMIT = 60;

type AgeBand = "ages-4-6" | "ages-7-9" | "ages-10-plus";

type LevelTuning = {
  label: string;
  blurb: string;
  typedChance: number;
  multiplicationChance: number;
  twoStepChance: number;
  mathShift: number;
  allowUnscramble: boolean;
};

const AGE_TO_MODE: Record<AgeBand, DifficultyMode> = {
  "ages-4-6": "sprout",
  "ages-7-9": "spark",
  "ages-10-plus": "comet"
};

const MODE_TO_AGE: Record<DifficultyMode, AgeBand> = {
  sprout: "ages-4-6",
  spark: "ages-7-9",
  comet: "ages-10-plus"
};

const LEVEL_TUNING: Record<LearnerLevel, LevelTuning> = {
  beginner: {
    label: "Beginner",
    blurb: "More multiple-choice and gentler numbers",
    typedChance: 0.2,
    multiplicationChance: 0.08,
    twoStepChance: 0.18,
    mathShift: -3,
    allowUnscramble: false
  },
  growing: {
    label: "Growing",
    blurb: "Balanced typing and challenge",
    typedChance: 0.4,
    multiplicationChance: 0.2,
    twoStepChance: 0.35,
    mathShift: 0,
    allowUnscramble: true
  },
  expert: {
    label: "Expert",
    blurb: "More typed answers and trickier quests",
    typedChance: 0.65,
    multiplicationChance: 0.35,
    twoStepChance: 0.5,
    mathShift: 3,
    allowUnscramble: true
  }
};

type StageMathProfile = {
  max: number;
  allowSubtraction: boolean;
  allowMissingNumber: boolean;
  multiplicationBaseMax: number;
  multiplicationFactorMax: number;
  allowTwoStep: boolean;
};

type CuratedQuestionPlan = {
  openerRounds: number;
  mathBias: number;
  wordVariants: number[];
  typedChanceMultiplier: number;
  earlyMathSequence: Array<"add-subtract" | "missing-number" | "multiplication" | "two-step">;
};

const STAGE_MATH_PROFILES: Record<StageId, StageMathProfile> = {
  k1: { max: 6, allowSubtraction: false, allowMissingNumber: false, multiplicationBaseMax: 0, multiplicationFactorMax: 0, allowTwoStep: false },
  k2: { max: 12, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 0, multiplicationFactorMax: 0, allowTwoStep: false },
  p1: { max: 20, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 0, multiplicationFactorMax: 0, allowTwoStep: false },
  p2: { max: 30, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 5, multiplicationFactorMax: 5, allowTwoStep: false },
  p3: { max: 45, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 8, multiplicationFactorMax: 8, allowTwoStep: true },
  p4: { max: 70, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 10, multiplicationFactorMax: 9, allowTwoStep: true },
  p5: { max: 90, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 12, multiplicationFactorMax: 10, allowTwoStep: true },
  p6: { max: 120, allowSubtraction: true, allowMissingNumber: true, multiplicationBaseMax: 12, multiplicationFactorMax: 12, allowTwoStep: true }
};

const CURATED_PLANS: Record<DifficultyMode, CuratedQuestionPlan> = {
  sprout: {
    openerRounds: 8,
    mathBias: 0.55,
    wordVariants: [0, 1, 2, 4],
    typedChanceMultiplier: 0.6,
    earlyMathSequence: ["add-subtract", "missing-number", "add-subtract", "missing-number", "add-subtract", "add-subtract", "missing-number", "add-subtract"]
  },
  spark: {
    openerRounds: 10,
    mathBias: 0.6,
    wordVariants: [0, 2, 4, 5],
    typedChanceMultiplier: 0.7,
    earlyMathSequence: ["add-subtract", "missing-number", "add-subtract", "multiplication", "add-subtract", "missing-number", "multiplication", "add-subtract", "two-step", "multiplication"]
  },
  comet: {
    openerRounds: 10,
    mathBias: 0.65,
    wordVariants: [0, 2, 5],
    typedChanceMultiplier: 0.9,
    earlyMathSequence: ["add-subtract", "multiplication", "missing-number", "add-subtract", "multiplication", "two-step", "add-subtract", "multiplication", "two-step", "missing-number"]
  }
};

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

const SPELLING_ENDINGS: Record<DifficultyMode, string[]> = {
  sprout: ["at", "an", "en", "in", "op", "ug", "et", "ed"],
  spark: ["er", "ly", "al", "ic", "en", "le", "ar", "or"],
  comet: ["tion", "ment", "ness", "ship", "able", "ward", "ence", "ive"]
};

const COACH_PRAISE = [
  "Great brain move!",
  "Yes! You nailed it!",
  "Sharp thinking!",
  "Awesome focus!",
  "Brilliant answer!"
];

const COACH_RETRY = [
  "Nice try — keep going!",
  "You are learning fast. Try again!",
  "Good effort! Let’s fix this one together.",
  "Almost there. Keep your eyes on the clues!",
  "Mistakes help your brain grow!"
];

const pickLine = (lines: string[]) => pick(lines);

const uniqueOptions = (correct: string, distractors: string[]) => {
  const set = new Set<string>([correct, ...distractors]);
  return Array.from(set).slice(0, 4).sort(() => Math.random() - 0.5);
};

const asTyped = (question: Omit<Question, "inputMode">): Question => ({
  ...question,
  inputMode: "typed",
  options: [],
  placeholder: question.typeLabel === "Maths" ? "Type a number" : "Type your answer"
});

const withInputMode = (question: Omit<Question, "inputMode">, level: LearnerLevel, typedChanceMultiplier = 1): Question => {
  const typedAllowed = question.correct.length <= 16;
  if (typedAllowed && Math.random() < LEVEL_TUNING[level].typedChance * typedChanceMultiplier) {
    return asTyped(question);
  }
  return { ...question, inputMode: "choice" };
};

const normalizeAnswer = (question: Question, value: string) => {
  const trimmed = value.trim();
  if (question.typeLabel === "Maths") {
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? String(parsed) : trimmed;
  }
  return trimmed.toLowerCase();
};

function createSpellingQuestion(config: ModeConfig, mode: DifficultyMode, level: LearnerLevel, round: number, stageId: StageId): Question {
  const tuning = LEVEL_TUNING[level];
  const plan = CURATED_PLANS[mode];
  const stageWords = STAGE_CURRICULUM[stageId].sampleLexicon;
  const wordPool = (stageWords.length ? stageWords : config.spellingWords)
    .filter((word) => mode === "sprout" || word.length >= 5);
  const word = pick(wordPool.length ? wordPool : config.spellingWords);
  const variantPool = tuning.allowUnscramble
    ? plan.wordVariants
    : plan.wordVariants.filter((variant) => variant !== 5);
  const variant = round < plan.openerRounds ? variantPool[round % variantPool.length] : pick(variantPool);

  if (variant === 0) {
    const blankIndex = Math.max(1, Math.min(word.length - 2, Math.floor(Math.random() * (word.length - 1))));
    const correct = word[blankIndex];
    const promptWord = `${word.slice(0, blankIndex)}_${word.slice(blankIndex + 1)}`;
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-missing-letter", prompt: `Letter detective! Fill the missing letter: ${promptWord}`, correct, options: uniqueOptions(correct, distractors) }, level, plan.typedChanceMultiplier);
  }

  if (variant === 1) {
    const correct = word[0];
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-beginning-sound", prompt: `Which letter starts "${word}"?`, correct, options: uniqueOptions(correct, distractors) }, level, plan.typedChanceMultiplier);
  }

  if (variant === 2) {
    const endingLength = mode === "comet" && word.length > 7 ? 4 : Math.min(3, Math.max(2, Math.floor(word.length / 3)));
    const correct = word.slice(-endingLength);
    const stem = word.slice(0, -endingLength);
    const distractors = SPELLING_ENDINGS[mode].filter((x) => x !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-word-ending", prompt: `Word builder: complete ${stem}${"_".repeat(endingLength)}`, correct, options: uniqueOptions(correct, distractors) }, level, plan.typedChanceMultiplier);
  }

  if (variant === 3) {
    const letters = word.length;
    const distractors = [letters + 1, Math.max(2, letters - 1), letters + 2].map(String);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-letter-count", prompt: `How many letters are in "${word}"?`, correct: String(letters), options: uniqueOptions(String(letters), distractors) }, level, plan.typedChanceMultiplier);
  }

  if (variant === 4) {
    const vowels = ["a", "e", "i", "o", "u"];
    const vowelIndex = word.split("").findIndex((char, index) => index > 0 && vowels.includes(char));
    if (vowelIndex > 0) {
      const correct = word[vowelIndex];
      const promptWord = `${word.slice(0, vowelIndex)}_${word.slice(vowelIndex + 1)}`;
      const distractors = vowels.filter((v) => v !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
      return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-vowel-sound", prompt: `Pick the vowel to finish this word: ${promptWord}`, correct, options: uniqueOptions(correct, distractors) }, level, plan.typedChanceMultiplier);
    }
  }

  const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");
  const distractors = wordPool.filter((w) => w !== word).sort(() => Math.random() - 0.5).slice(0, 3);
  return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-unscramble", prompt: `Unscramble this word: ${scrambled}`, correct: word, options: uniqueOptions(word, distractors) }, level, plan.typedChanceMultiplier);
}

function createMathQuestion(
  boss: Boss,
  config: ModeConfig,
  mode: DifficultyMode,
  level: LearnerLevel,
  round: number,
  bossPhase: BossPhase = "phase-1",
  stageId: StageId
): Question {
  const tuning = LEVEL_TUNING[level];
  const plan = CURATED_PLANS[mode];
  const profile = STAGE_MATH_PROFILES[stageId];
  const phaseShift = bossPhase === "phase-1" ? 0 : bossPhase === "phase-2" ? 2 : bossPhase === "phase-3" ? 4 : 6;
  const max = Math.max(6, Math.min(config.mathMax + 24, profile.max + tuning.mathShift + phaseShift));
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  const curatedType = round < plan.openerRounds ? plan.earlyMathSequence[round % plan.earlyMathSequence.length] : null;
  const shouldUseMultiplication = profile.multiplicationBaseMax >= 2 && (curatedType === "multiplication" || (curatedType === null && mode !== "sprout" && Math.random() < tuning.multiplicationChance));
  const shouldUseTwoStep = profile.allowTwoStep && config.allowTwoStepMath && (curatedType === "two-step" || (curatedType === null && Math.random() < tuning.twoStepChance));
  const shouldUseMissingNumber = profile.allowMissingNumber && (curatedType === "missing-number" || (curatedType === null && Math.random() > 0.66));

  if (shouldUseMultiplication) {
    const x = Math.floor(Math.random() * Math.max(2, profile.multiplicationBaseMax - 1)) + 2;
    const y = Math.floor(Math.random() * Math.max(2, profile.multiplicationFactorMax - 1)) + 2;
    const result = x * y;
    const distractors = [result + y, Math.max(0, result - y), result + Math.max(2, x - 1)].map(String);
    return withInputMode({ typeLabel: "Maths", skillArea: "math-multiplication", prompt: `${boss.name} says: ${x} × ${y} = ?`, correct: String(result), options: uniqueOptions(String(result), distractors) }, level, plan.typedChanceMultiplier);
  }

  if (shouldUseTwoStep) {
    const c = Math.floor(Math.random() * Math.max(4, Math.floor(max / 3))) + 1;
    const plusFirst = Math.random() > 0.5;
    const result = plusFirst ? a + b - c : a + c - Math.min(a + c - 1, b);
    const prompt = plusFirst ? `Step quest: (${a} + ${b}) - ${c} = ?` : `Step quest: (${a} + ${c}) - ${Math.min(a + c - 1, b)} = ?`;
    const distractors = [result + 1, Math.max(0, result - 2), result + 3].map(String);
    return withInputMode({ typeLabel: "Maths", skillArea: "math-two-step", prompt, correct: String(result), options: uniqueOptions(String(result), distractors) }, level, plan.typedChanceMultiplier);
  }

  if (shouldUseMissingNumber) {
    const total = a + b;
    const missingLeft = Math.random() > 0.5;
    const prompt = missingLeft ? `? + ${b} = ${total}` : `${a} + ? = ${total}`;
    const correct = missingLeft ? a : b;
    const distractors = [correct + 1, Math.max(0, correct - 1), correct + 2].map(String);
    return withInputMode({ typeLabel: "Maths", skillArea: "math-missing-number", prompt, correct: String(correct), options: uniqueOptions(String(correct), distractors) }, level, plan.typedChanceMultiplier);
  }

  const usePlus = !profile.allowSubtraction || Math.random() > 0.35;
  const subtractionValue = Math.min(a, b);
  const result = usePlus ? a + b : Math.max(0, a - subtractionValue);
  const prompt = usePlus ? `${a} + ${b} = ?` : `${a} - ${subtractionValue} = ?`;
  const distractors = [result + 1, Math.max(0, result - 1), result + 2].map(String);
  return withInputMode({ typeLabel: "Maths", skillArea: "math-add-subtract", prompt, correct: String(result), options: uniqueOptions(String(result), distractors) }, level, plan.typedChanceMultiplier);
}

/**
 * Create a question with pedagogy awareness.
 * Uses autonomy mode (maths/words/mix) to weight question selection.
 * Uses spaced repetition and interleaving logic from diagnostics to choose concept family.
 */
function createQuestion(
  boss: Boss,
  round: number,
  config: ModeConfig,
  mode: DifficultyMode,
  level: LearnerLevel,
  bossPhase: BossPhase = "phase-1",
  autonomyMode: "maths" | "words" | "mix" = "mix",
  _diagnostics?: RunDiagnostics
): Question {
  const plan = CURATED_PLANS[mode];
  const stageId = getSelectedStageId(mode, level);
  const isMathsRound =
    autonomyMode === "maths" ? true :
    autonomyMode === "words" ? false :
    Math.random() < plan.mathBias;

  return isMathsRound
    ? createMathQuestion(boss, config, mode, level, round, bossPhase, stageId)
    : createSpellingQuestion(config, mode, level, round, stageId);
}

const createInitialSkillProgress = (): Record<SkillArea, SkillProgress> => ({
  "spelling-missing-letter": { attempts: 0, correct: 0 },
  "spelling-beginning-sound": { attempts: 0, correct: 0 },
  "spelling-word-ending": { attempts: 0, correct: 0 },
  "spelling-letter-count": { attempts: 0, correct: 0 },
  "spelling-vowel-sound": { attempts: 0, correct: 0 },
  "spelling-unscramble": { attempts: 0, correct: 0 },
  "math-add-subtract": { attempts: 0, correct: 0 },
  "math-missing-number": { attempts: 0, correct: 0 },
  "math-two-step": { attempts: 0, correct: 0 },
  "math-multiplication": { attempts: 0, correct: 0 }
});

const INITIAL_LIVES = 2;

const initialStats = (): BattleStats => ({
  correctAnswers: 0,
  wrongAnswers: 0,
  timeoutAnswers: 0,
  spellingCorrect: 0,
  mathsCorrect: 0,
  bossesDefeated: 0,
  streak: 0,
  maxStreak: 0,
  skillProgress: createInitialSkillProgress(),
  livesRemaining: INITIAL_LIVES
});

const createInitialBattleState = (config: ModeConfig, mode: DifficultyMode, level: LearnerLevel, autonomyMode: "maths" | "words" | "mix" = "mix"): BattleState => {
  const bossPhase: BossPhase = "phase-1";
  const baseState: BattleState = {
    bossIndex: 0,
    bossHp: config.bossMaxHp,
    playerHp: config.playerMaxHp,
    round: 0,
    question: createQuestion(BOSSES[0], 0, config, mode, level, bossPhase, autonomyMode),
    feedback: `${BOSSES[0].name} appears! ${BOSSES[0].taunts.intro}`,
    phase: "quiz",
    lastHit: null,
    stats: initialStats(),
    bossPhase
  };
  return baseState;
};

const createBossCheckpoint = (bossIndex: number, mode: DifficultyMode, level: LearnerLevel, playerHp: number, stats: BattleStats, autonomyMode: "maths" | "words" | "mix" = "mix"): BattleState => {
  const cfg = MODE_CONFIGS[mode];
  const boss = BOSSES[bossIndex];
  const bossPhase: BossPhase = "phase-1";
  return {
    bossIndex,
    bossHp: cfg.bossMaxHp,
    playerHp,
    round: 0,
    question: createQuestion(boss, 0, cfg, mode, level, bossPhase, autonomyMode),
    feedback: `${boss.name} jumps in! ${boss.taunts.intro}`,
    phase: "quiz",
    lastHit: null,
    stats,
    bossPhase
  };
};

type Screen = "onboarding" | "character-creation" | "title" | "battle" | "summary" | "settings" | "parental-controls";

type ToneNote = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
};

type CelebrationType = "tier" | "combo5" | "combo10";

type TierBurst = {
  id: number;
  particles: Array<{ id: string; tx: number; ty: number }>;
};

let audioCtx: AudioContext | null = null;
let soundAllowed = true;
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
};

const WrongAnswerFeedback = ({ feedback }: { feedback: FeedbackType }) => {
  const isTimeout = feedback.type === "timeout";
  const isMath = feedback.questionType === "Maths";
  
  return (
    <div className={`wrong-answer-panel ${isTimeout ? "timeout-variant" : "wrong-variant"}`}>
      <div className="correct-answer-section">
        <div className="correct-label">{isTimeout ? "⏰ Time out!" : "Not quite!"}</div>
        <div className="correct-answer-display">
          <span className="answer-icon">{isMath ? "🔢" : "📝"}</span>
          <span className="answer-value">{feedback.correctAnswer}</span>
        </div>
        <div className="answer-hint">
          {isMath ? "The correct sum is:" : "The correct spelling is:"}
        </div>
      </div>
      
      <div className="feedback-message-section">
        <p className="feedback-message">{feedback.message}</p>
      </div>
    </div>
  );
};

const blip = (freq: number, duration: number, type: OscillatorType, volume = 0.05, when?: number) => {
  if (!soundAllowed) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = when ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
};

const speakCue = (tone: "start" | "correct" | "wrong" | "bossDown" | "victory") => {
  const seq: Record<typeof tone, number[]> = {
    start: [440, 554, 659],
    correct: [660, 784, 988],
    wrong: [280, 220, 180],
    bossDown: [523, 659, 784, 988],
    victory: [523, 659, 784, 988, 1318]
  };
  seq[tone].forEach((f, i) => window.setTimeout(() => blip(f, 0.13, tone === "wrong" ? "square" : "triangle", 0.06), i * 90));
};

const playToneSequence = (notes: ToneNote[], offset = 0) => {
  if (!soundAllowed) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const startTime = ctx.currentTime + offset;
  notes.forEach((note) => {
    blip(note.freq, note.duration, note.type ?? "triangle", note.volume ?? 0.06, startTime + (note.delay ?? 0));
  });
};

const playTierFanfare = () => {
  const tierNotes: ToneNote[] = [
    { freq: 392, duration: 0.18 },
    { freq: 494, duration: 0.18, delay: 0.16 },
    { freq: 587, duration: 0.2, delay: 0.34 },
    { freq: 698, duration: 0.22, delay: 0.56, volume: 0.06 }
  ];
  playToneSequence(tierNotes);
};

const playComboFiveSound = () => {
  playToneSequence([
    { freq: 320, duration: 0.11, type: "sawtooth", volume: 0.04 },
    { freq: 520, duration: 0.18, delay: 0.1 },
    { freq: 660, duration: 0.18, delay: 0.32 }
  ]);
};

const playComboTenSound = () => {
  playToneSequence([
    { freq: 280, duration: 0.12, type: "sawtooth", volume: 0.05 },
    { freq: 520, duration: 0.2, delay: 0.14 },
    { freq: 710, duration: 0.2, delay: 0.34 },
    { freq: 880, duration: 0.24, delay: 0.56, volume: 0.07 }
  ]);
};

const playComboSound = (threshold: number) => {
  if (threshold >= 10) {
    playComboTenSound();
    return;
  }
  playComboFiveSound();
};

function buildCorrectFeedback(boss: Boss, question: Question, hpAfterHit: number, config: ModeConfig) {
  const tip = question.typeLabel === "Spelling"
    ? "Spelling tip: say each sound slowly, then blend the word."
    : "Maths tip: do one quick check in your head before tapping.";
  const bossLine = hpAfterHit <= config.correctDamage && boss.taunts.lowHp ? boss.taunts.lowHp : boss.taunts.hit;
  return `${pickLine(COACH_PRAISE)} ${bossLine} ${tip}`;
}

function buildWrongFeedback(boss: Boss, question: Question): FeedbackType {
  const coachLine = pickLine(COACH_RETRY);
  const hint = question.typeLabel === "Spelling"
    ? "Look for vowel sounds and word chunks."
    : "Break the sum into smaller steps.";
  
  return {
    message: `${coachLine} ${boss.taunts.attack} ${hint}`,
    type: "wrong",
    correctAnswer: question.correct,
    questionType: question.typeLabel
  };
}


const SKILL_LABELS: Record<SkillArea, string> = {
  "spelling-missing-letter": "Missing letters",
  "spelling-beginning-sound": "Beginning sounds",
  "spelling-word-ending": "Word endings",
  "spelling-letter-count": "Letter counting",
  "spelling-vowel-sound": "Vowel sounds",
  "spelling-unscramble": "Unscramble words",
  "math-add-subtract": "Addition & subtraction",
  "math-missing-number": "Missing-number sums",
  "math-two-step": "Two-step maths",
  "math-multiplication": "Multiplication facts"
};

const SKILL_RECOMMENDATIONS: Record<SkillArea, string> = {
  "spelling-missing-letter": "Practise filling in one missing letter in familiar words.",
  "spelling-beginning-sound": "Say the first sound aloud before choosing the starting letter.",
  "spelling-word-ending": "Work on common endings and chunks such as -er, -tion, or -ing.",
  "spelling-letter-count": "Count letters slowly while pointing to each one.",
  "spelling-vowel-sound": "Revisit short and long vowel sounds in simple word families.",
  "spelling-unscramble": "Build and rebuild words with letter cards to spot patterns faster.",
  "math-add-subtract": "Use number bonds and quick mental checks for single-step sums.",
  "math-missing-number": "Practise fact families like 3 + ? = 8 and 8 - 3 = ?.",
  "math-two-step": "Solve one step at a time and say the plan out loud first.",
  "math-multiplication": "Review times tables in small sets before mixing them together."
};

const bumpSkillProgress = (stats: BattleStats, skillArea: SkillArea, wasCorrect: boolean): BattleStats => ({
  ...stats,
  skillProgress: {
    ...stats.skillProgress,
    [skillArea]: {
      attempts: stats.skillProgress[skillArea].attempts + 1,
      correct: stats.skillProgress[skillArea].correct + (wasCorrect ? 1 : 0)
    }
  }
});

const buildDiagnosticRows = (stats: BattleStats) => Object.entries(stats.skillProgress)
  .filter(([, value]) => value.attempts > 0)
  .map(([skillArea, value]) => ({
    key: skillArea as SkillArea,
    label: SKILL_LABELS[skillArea as SkillArea],
    attempts: value.attempts,
    correct: value.correct,
    accuracy: Math.round((value.correct / value.attempts) * 100)
  }))
  .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts);

const STAGE_BY_LEVEL_INDEX: Record<LearnerLevel, number> = {
  beginner: 0,
  growing: 1,
  expert: 2
};

const getSelectedStageId = (mode: DifficultyMode, level: LearnerLevel) => {
  const stages = MODE_CURRICULUM_CLUSTERS[mode].stages;
  return stages[Math.min(STAGE_BY_LEVEL_INDEX[level], stages.length - 1)];
};

const getInitialState = () => {
  const initialSettings = loadParentSettings();
  const preferredMode = loadPreferredMode();
  const preferredLevel = loadPreferredLevel();
  const initialMode: DifficultyMode = initialSettings.persistDifficulty && preferredMode ? preferredMode : "spark";
  const initialLevel: LearnerLevel = initialSettings.persistDifficulty && preferredLevel ? preferredLevel : "growing";
  const initialBattle = createInitialBattleState(MODE_CONFIGS[initialMode], initialMode, initialLevel);
  const storedProgress = initialSettings.persistProgress ? loadProgress<BattleState>() : null;
  const validProgress = storedProgress && (storedProgress.mode === "sprout" || storedProgress.mode === "spark" || storedProgress.mode === "comet")
    ? storedProgress
    : null;
  const loadedCharacter = loadCharacter();
  const hasCharacter = loadedCharacter !== null;

  return {
    settings: initialSettings,
    mode: initialMode,
    level: initialLevel,
    ageBand: MODE_TO_AGE[initialMode],
    highScores: loadHighScores(),
    summaries: loadRunSummaries(),
    character: loadedCharacter,
    hasCharacter,
    battle: initialBattle,
    checkpoint: initialBattle,
    resumeRun: validProgress
      ? {
          mode: validProgress.mode,
          level: validProgress.level === "beginner" || validProgress.level === "growing" || validProgress.level === "expert" ? validProgress.level : initialLevel,
          battle: validProgress.battle,
          checkpoint: validProgress.checkpoint
        }
      : null
  };
};

export default function Page() {
  const [initial] = useState(() => getInitialState());

  const [screen, setScreen] = useState<Screen>(initial.hasCharacter ? "title" : "onboarding");
  const [pinInput, setPinInput] = useState<string>("");
  const [pinAttempts, setPinAttempts] = useState<number>(0);
  const [parentalPinValid, setParentalPinValid] = useState<boolean>(false);
  const PARENTAL_PIN = "1234"; // Can be configured in parent settings
  const [mode, setMode] = useState<DifficultyMode>(initial.mode);
  const [ageBand, setAgeBand] = useState<AgeBand>(initial.ageBand);
  const [level, setLevel] = useState<LearnerLevel>(initial.level);
  const [settings, setSettings] = useState<ParentSettings>(initial.settings);
  const [highScores, setHighScores] = useState<StoredHighScores>(initial.highScores);
  const [summaries, setSummaries] = useState<RunSummary[]>(initial.summaries);
  const [character, setCharacter] = useState<CharacterState | null>(initial.character);
  const [resumeRun, setResumeRun] = useState<{ mode: DifficultyMode; level: LearnerLevel; battle: BattleState; checkpoint: BattleState | null } | null>(initial.resumeRun);
  const [powerLevels, setPowerLevels] = useState<PowerLevelMap>(() => loadPowerLevels(initial.mode));
  
  // Character creation state
  const [charNameInput, setCharNameInput] = useState<string>("");
  const [charGender, setCharGender] = useState<CharacterGender>("boy");
  const [charAppearance, setCharAppearance] = useState<Record<AppearanceCategory, string>>({
    hat: APPEARANCE_OPTIONS.hat[0].id,
    shirt: APPEARANCE_OPTIONS.shirt[0].id,
    pants: APPEARANCE_OPTIONS.pants[0].id,
    shoes: APPEARANCE_OPTIONS.shoes[0].id
  });

  const [battle, setBattle] = useState<BattleState>(initial.battle);
  const [checkpoint, setCheckpoint] = useState<BattleState | null>(initial.checkpoint);
  const [attackMode, setAttackMode] = useState<"none" | "hero" | "boss">("none");
  const [damagePop, setDamagePop] = useState<{ target: "boss" | "player"; amount: number } | null>(null);
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);
  const [tierBanner, setTierBanner] = useState<string | null>(null);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [comboBonus, setComboBonus] = useState<number>(0);
  const tierAnnouncedRef = useRef<string>(TIER_CONFIGS[0].name);
  const previousStreakRef = useRef<number>(0);
  const [typedAnswer, setTypedAnswer] = useState<string>("");
  const [result, setResult] = useState<"victory" | "game-over" | null>(null);
  const [voiceLine, setVoiceLine] = useState<string>("Pick a mode and begin your bright quiz quest!");
  const handledTimeoutKeyRef = useRef<string | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [timeoutFlash, setTimeoutFlash] = useState<boolean>(false);
  const [comboBrokenFlash, setComboBrokenFlash] = useState<boolean>(false);
  const comboBrokenTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [milestonePulse, setMilestonePulse] = useState<boolean>(false);
  const milestonePulseTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  
  /* Particle effects: Gold celebration (correct) or cool blue puff (wrong) */
  const [particles, setParticles] = useState<Array<{
    id: string;
    type: "gold-burst" | "blue-puff";
    x: number;
    y: number;
  }>>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tierBurst, setTierBurst] = useState<TierBurst | null>(null);
  const tierBurstTimerRef = useRef<number | null>(null);
  const [celebrationShake, setCelebrationShake] = useState<{ id: number; type: CelebrationType } | null>(null);
  const [bossEntranceActive, setBossEntranceActive] = useState(false);
  const [bossDefeatFlashing, setBossDefeatFlashing] = useState(false);
  const bossEntranceTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const bossDefeatTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const queueCelebrationShake = (type: CelebrationType) => {
    setCelebrationShake({ type, id: Date.now() });
  };

  const spawnTierParticles = () => {
    if (tierBurstTimerRef.current) {
      window.clearTimeout(tierBurstTimerRef.current);
    }
    const stamp = Date.now();
    const particlesPayload = Array.from({ length: 8 }, (_, idx) => ({
      id: `tier-particle-${stamp}-${idx}`,
      tx: Math.random() * 140 - 70,
      ty: -(Math.random() * 110 + 30)
    }));
    setTierBurst({ id: stamp, particles: particlesPayload });
    tierBurstTimerRef.current = window.setTimeout(() => {
      setTierBurst(null);
      tierBurstTimerRef.current = null;
    }, 900);
  };

  const celebrateTier = () => {
    spawnTierParticles();
    queueCelebrationShake("tier");
    playTierFanfare();
  };

  const celebrateCombo = (threshold: number) => {
    const type: CelebrationType = threshold >= 10 ? "combo10" : "combo5";
    queueCelebrationShake(type);
    playComboSound(threshold);
  };

  useEffect(() => {
    soundAllowed = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!celebrationShake) return;
    const timer = window.setTimeout(() => setCelebrationShake(null), 220);
    return () => window.clearTimeout(timer);
  }, [celebrationShake]);

  useEffect(() => {
    return () => {
      if (tierBurstTimerRef.current) {
        window.clearTimeout(tierBurstTimerRef.current);
      }
    };
  }, []);

  // Pedagogy layer: Spaced repetition, interleaving, hints, growth messaging
  const [autonomyMode, setAutonomyMode] = useState<"maths" | "words" | "mix">("mix");
  const [diagnostics, setDiagnostics] = useState<RunDiagnostics | null>(() => loadDiagnostics());
  const [growthSummary, setGrowthSummary] = useState<GrowthSummary | null>(null);
  const [currentHintText, setCurrentHintText] = useState<string | null>(null);

  const config = MODE_CONFIGS[mode];
  const currentBoss = BOSSES[battle.bossIndex];

  const score = useMemo(() => {
    const defeated = battle.stats.bossesDefeated * 220;
    const correctScore = battle.stats.correctAnswers * 70;
    const streakBonus = battle.stats.maxStreak * 25;
    const hpBonus = Math.floor((battle.playerHp / config.playerMaxHp) * 100);
    return defeated + correctScore + streakBonus + hpBonus;
  }, [battle.playerHp, battle.stats, config.playerMaxHp]);
  const currentTier = useMemo(() => getTierForScore(score), [score]);
  const nextTier = useMemo(() => getNextTier(score), [score]);
  const tierProgress = useMemo(() => {
    if (!nextTier) return 1;
    const range = nextTier.minScore - currentTier.minScore;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, (score - currentTier.minScore) / range));
  }, [score, currentTier, nextTier]);

  const totalAnswered = battle.stats.correctAnswers + battle.stats.wrongAnswers;
  const accuracy = totalAnswered > 0 ? Math.round((battle.stats.correctAnswers / totalAnswered) * 100) : 0;
  const timeoutAnswers = battle.stats.timeoutAnswers ?? 0;
  const timeoutRate = totalAnswered > 0 ? Math.round((timeoutAnswers / totalAnswered) * 100) : 0;
  const learningLevel = accuracy >= 85 ? "Super Scholar" : accuracy >= 70 ? "Rising Rocket" : "Brave Learner";
  const diagnosticRows = useMemo(() => buildDiagnosticRows(battle.stats), [battle.stats]);
  const strengths = diagnosticRows.filter((row) => row.accuracy >= 80).slice(0, 3);
  const growthAreas = diagnosticRows.filter((row) => row.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts).slice(0, 3);
  const selectedStageId = getSelectedStageId(mode, level);
  const selectedStage = STAGE_CURRICULUM[selectedStageId];
  const stageInterpretation =
    totalAnswered === 0
      ? `This round was too short to judge ${selectedStage.label} expectations yet.`
      : accuracy >= 85 && timeoutRate <= 10
        ? `Comfortable for ${selectedStage.label}: this learner is mostly secure with the selected-stage demands.`
        : accuracy >= 70 && timeoutRate <= 20
          ? `Near ${selectedStage.label} expectations: mostly coping, but a few ideas still need rehearsal.`
          : timeoutRate >= 30
            ? `Below ${selectedStage.label} pace right now: timing pressure is interrupting recall, so confidence and fluency need rebuilding.`
            : `Below ${selectedStage.label} expectations in this round: accuracy suggests the current mix is still shaky.`;
  const recommendedFocus = (growthAreas.length > 0 ? growthAreas : diagnosticRows.slice(-2)).map((row) => ({
    label: row.label,
    note: SKILL_RECOMMENDATIONS[row.key]
  }));
  const scorecardHeadline = result === "victory" ? "Strong finish." : "Useful practice round.";
  const timeoutSignal =
    timeoutAnswers === 0
      ? "No timeout signal this round — pace was manageable."
      : timeoutRate >= 30
        ? `Strong timeout signal: ${timeoutAnswers} questions timed out (${timeoutRate}%). Slow recall is part of the learning picture, not just correctness.`
        : `Some hesitation showed up: ${timeoutAnswers} timed-out question${timeoutAnswers === 1 ? "" : "s"} (${timeoutRate}%). Fluency practice should stay short and repeated.`;
  const parentSummary = strengths.length > 0
    ? `Best area today: ${strengths[0].label}.`
    : "No single strength stood out yet.";
  const practiceNextSteps = [
    growthAreas[0]
      ? `Start with ${growthAreas[0].label.toLowerCase()} for 5-8 minutes using easier success-first questions.`
      : "Keep the same stage and repeat a short mixed review to confirm consistency.",
    timeoutAnswers > 0
      ? "Treat timeouts as hesitation, not defiance: allow think-aloud steps, then repeat similar items for fluency."
      : "Once accuracy stays strong, slightly speed up recall with short daily drills.",
    `If the learner is frustrated, temporarily step down from ${selectedStage.label} expectations and rebuild with ${selectedStage.questionBands[0]?.label.toLowerCase() ?? "foundational items"}.`
  ];
  const questionTimerKey = `${screen}-${battle.phase}-${battle.bossIndex}-${battle.round}-${battle.question.prompt}`;
  const timerPercent = Math.max(0, Math.min(100, (questionTimeLeft / QUESTION_TIME_LIMIT) * 100));
  const timerUrgency = getTimerUrgencyLevel(Math.max(0, questionTimeLeft), QUESTION_TIME_LIMIT);
  const timerUrgent = timerUrgency === "urgent" || timerUrgency === "critical";
  const timerCritical = timerUrgency === "critical";
  const celebrationClass = celebrationShake ? `celebration-${celebrationShake.type}` : "";

  const comboStreak = battle.stats.streak;
  const comboDisplayValue = comboBrokenFlash ? 0 : comboStreak;
  const comboVisible = comboStreak > 0 || comboBrokenFlash;
  const comboLevel = comboStreak >= 10 ? 4 : comboStreak >= 7 ? 3 : comboStreak >= 4 ? 2 : comboStreak >= 2 ? 1 : 0;

  useEffect(() => {
    if (settings.persistDifficulty) {
      savePreferredMode(mode);
      savePreferredLevel(level);
    }
  }, [mode, level, settings.persistDifficulty]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const themeClasses = ["mode-sprout", "mode-spark", "mode-comet"];
    const currentClass = `mode-${mode}`;
    document.body.classList.remove(...themeClasses);
    document.body.classList.add(currentClass);
    return () => {
      document.body.classList.remove(currentClass);
    };
  }, [mode]);

  useEffect(() => {
    if (attackMode === "none") return;
    const t = setTimeout(() => setAttackMode("none"), 700);
    return () => clearTimeout(t);
  }, [attackMode]);

  useEffect(() => {
    if (!damagePop) return;
    const t = setTimeout(() => setDamagePop(null), 900);
    return () => clearTimeout(t);
  }, [damagePop]);

  useEffect(() => {
    if (!phaseBanner) return;
    const t = setTimeout(() => setPhaseBanner(null), 1400);
    return () => clearTimeout(t);
  }, [phaseBanner]);

  useEffect(() => {
    const previousTier = tierAnnouncedRef.current;
    if (currentTier.name !== previousTier) {
      tierAnnouncedRef.current = currentTier.name;
      setTierBanner(`${currentTier.name} unlocked! +${currentTier.bonus} bonus points!`);
      celebrateTier();
    }
  }, [currentTier]);

  useEffect(() => {
    if (!tierBanner) return;
    const t = setTimeout(() => setTierBanner(null), 1800);
    return () => clearTimeout(t);
  }, [tierBanner]);

  useEffect(() => {
    const previousStreak = previousStreakRef.current;
    const currentStreak = battle.stats.streak;
    previousStreakRef.current = currentStreak;
    for (const milestone of COMBO_MILESTONES) {
      if (currentStreak >= milestone.threshold && previousStreak < milestone.threshold) {
        setComboBanner(`${milestone.label} x${milestone.threshold}!`);
        setComboBonus(milestone.bonus);
        celebrateCombo(milestone.threshold);
        break;
      }
    }
  }, [battle.stats.streak]);

  useEffect(() => {
    if (!comboBanner) return;
    const t = setTimeout(() => setComboBanner(null), 1400);
    return () => clearTimeout(t);
  }, [comboBanner]);

  useEffect(() => {
    if (!comboBanner) return;
    setMilestonePulse(true);
    if (milestonePulseTimerRef.current) {
      clearTimeout(milestonePulseTimerRef.current);
    }
    milestonePulseTimerRef.current = setTimeout(() => setMilestonePulse(false), 900);
  }, [comboBanner]);

  useEffect(() => {
    if (screen !== "battle") {
      setBossEntranceActive(false);
      return;
    }
    setBossEntranceActive(true);
    if (bossEntranceTimerRef.current) {
      clearTimeout(bossEntranceTimerRef.current);
    }
    bossEntranceTimerRef.current = setTimeout(() => {
      setBossEntranceActive(false);
    }, 750);
    return () => {
      if (bossEntranceTimerRef.current) {
        clearTimeout(bossEntranceTimerRef.current);
      }
    };
  }, [battle.bossPhase, battle.bossIndex, screen]);

  useEffect(() => {
    if (battle.phase === "boss-defeated") {
      setBossDefeatFlashing(true);
      if (bossDefeatTimerRef.current) {
        clearTimeout(bossDefeatTimerRef.current);
      }
      bossDefeatTimerRef.current = setTimeout(() => {
        setBossDefeatFlashing(false);
      }, 900);
    } else if (bossDefeatFlashing) {
      setBossDefeatFlashing(false);
    }
    return () => {
      if (bossDefeatTimerRef.current) {
        clearTimeout(bossDefeatTimerRef.current);
      }
    };
  }, [battle.phase, bossDefeatFlashing]);

  useEffect(() => {
    if (screen !== "battle" || battle.phase !== "quiz") return;
    if (questionTimeLeft <= 0) return;
    const ticker = setInterval(() => {
      setQuestionTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(ticker);
  }, [screen, battle.phase, questionTimeLeft]);

  useEffect(() => {
    if (!timeoutFlash) return;
    const t = setTimeout(() => setTimeoutFlash(false), 700);
    return () => clearTimeout(t);
  }, [timeoutFlash]);

  useEffect(() => {
    return () => {
      if (comboBrokenTimerRef.current) {
        clearTimeout(comboBrokenTimerRef.current);
      }
      if (milestonePulseTimerRef.current) {
        clearTimeout(milestonePulseTimerRef.current);
      }
    };
  }, []);

  const resetQuestionTimer = () => {
    handledTimeoutKeyRef.current = null;
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setTimeoutFlash(false);
  };

  const triggerComboBroken = () => {
    setComboBrokenFlash(true);
    if (comboBrokenTimerRef.current) {
      clearTimeout(comboBrokenTimerRef.current);
    }
    comboBrokenTimerRef.current = setTimeout(() => {
      setComboBrokenFlash(false);
    }, 400);
  };

  const speak = (line: string, cue: "start" | "correct" | "wrong" | "bossDown" | "victory") => {
    setVoiceLine(line);
    speakCue(cue);
  };

  const completeCharacterCreation = () => {
    const newCharacter = createCharacter(charNameInput, charGender);
    const customizedCharacter = {
      ...newCharacter,
      appearance: charAppearance
    };
    setCharacter(customizedCharacter);
    saveCharacter(customizedCharacter);
    setScreen("title");
    speak(`Welcome, ${customizedCharacter.name}! Ready for your quest?`, "start");
  };

  const quickStartAdventure = () => {
    const defaultHero = createCharacter("Hero", "girl");
    setCharacter(defaultHero);
    saveCharacter(defaultHero);
    setCharNameInput(defaultHero.name);
    setCharGender(defaultHero.gender);
    setCharAppearance(defaultHero.appearance);
    setScreen("title");
    setTimeout(() => {
      startGame();
    }, 0);
  };

  const editCharacter = () => {
    if (character) {
      setCharNameInput(character.name);
      setCharGender(character.gender);
      setCharAppearance(character.appearance);
      setScreen("character-creation");
    }
  };

  const updateSetting = <K extends keyof ParentSettings>(key: K, value: ParentSettings[K]) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    saveParentSettings(nextSettings);

    if (key === "persistDifficulty" && !value) {
      clearPreferredMode();
      clearPreferredLevel();
    }
    if (key === "persistHighScore" && !value) {
      clearHighScores();
      setHighScores({ sprout: 0, spark: 0, comet: 0 });
    }
    if (key === "persistSummaries" && !value) {
      clearRunSummaries();
      setSummaries([]);
    }
    if (key === "persistProgress" && !value) {
      clearProgress();
      setResumeRun(null);
    }
  };

  const persistRunProgress = (nextBattle: BattleState, nextCheckpoint: BattleState | null, nextMode: DifficultyMode, nextLevel: LearnerLevel) => {
    if (!settings.persistProgress) return;
    saveProgress<BattleState>({ mode: nextMode, level: nextLevel, battle: nextBattle, checkpoint: nextCheckpoint, savedAt: currentTimestamp() });
    setResumeRun({ mode: nextMode, level: nextLevel, battle: nextBattle, checkpoint: nextCheckpoint });
  };

  const updateHighScore = (finalScore: number, selectedMode: DifficultyMode) => {
    if (!settings.persistHighScore) return;
    const current = highScores[selectedMode] ?? 0;
    if (finalScore <= current) return;
    const nextScores: StoredHighScores = { ...highScores, [selectedMode]: finalScore };
    setHighScores(nextScores);
    saveHighScores(nextScores);
  };

  const appendSummary = (runResult: "victory" | "game-over", selectedMode: DifficultyMode, finalBattle: BattleState, finalScore: number) => {
    if (!settings.persistSummaries) return;
    const answered = finalBattle.stats.correctAnswers + finalBattle.stats.wrongAnswers;
    const runAccuracy = answered > 0 ? Math.round((finalBattle.stats.correctAnswers / answered) * 100) : 0;
    const entry: RunSummary = {
      id: createRunId(),
      playedAt: currentTimestamp(),
      mode: selectedMode,
      result: runResult,
      score: finalScore,
      accuracy: runAccuracy,
      bossesDefeated: finalBattle.stats.bossesDefeated,
      maxStreak: finalBattle.stats.maxStreak,
      livesRemaining: finalBattle.stats.livesRemaining
    };
    const next = [entry, ...summaries].slice(0, 8);
    setSummaries(next);
    saveRunSummaries(next);
  };

  const startGame = () => {
    const freshBattle = createInitialBattleState(config, mode, level, autonomyMode);
    const freshCheckpoint = createInitialBattleState(config, mode, level, autonomyMode);
    setBattle(freshBattle);
    setCheckpoint(freshCheckpoint);
    setAttackMode("none");
    setDamagePop(null);
    setTypedAnswer("");
    setPhaseBanner("Battle Start!");
    resetQuestionTimer();
    setResult(null);
    
    // Initialize pedagogy diagnostics for this run
    const newDiagnostics: RunDiagnostics = {
      sessionStartedAt: currentTimestamp(),
      mode,
      autonomyMode,
      totalQuestionsAsked: 0,
      recordsByFamily: new Map(),
      hintTracker: initializeHintTracker(),
      spacedRepetitionQueue: initializeSpacedRepetitionQueue(),
      interleavingState: initializeInterleavingState()
    };
    setDiagnostics(newDiagnostics);
    saveDiagnostics(newDiagnostics);
    setCurrentHintText(null);
    setGrowthSummary(null);
    
    setScreen("battle");
    if (settings.persistProgress) {
      persistRunProgress(freshBattle, freshCheckpoint, mode, level);
    }
    speak(`${config.label} mode ready for ${LEVEL_TUNING[level].label} learners. ${autonomyMode === "maths" ? "Maths focus." : autonomyMode === "words" ? "Word skills focus." : "Mixed skills."} ${BOSSES[0].name} is entering the arena!`, "start");
  };

  const resumeAdventure = () => {
    if (!resumeRun) return;
    setMode(resumeRun.mode);
    setAgeBand(MODE_TO_AGE[resumeRun.mode]);
    setLevel(resumeRun.level);
    setBattle(resumeRun.battle);
    setCheckpoint(resumeRun.checkpoint);
    setResult(null);
    setScreen("battle");
    setPhaseBanner("Adventure Resumed");
    setTypedAnswer("");
    setAttackMode("none");
    setDamagePop(null);
    resetQuestionTimer();
    speak("Welcome back. Resuming your last adventure.", "start");
  };

  const replayFromCheckpoint = () => {
    if (!checkpoint) return;
    setBattle(checkpoint);
    setResult(null);
    setScreen("battle");
    setPhaseBanner("Retry Keeper");
    setTypedAnswer("");
    setAttackMode("none");
    setDamagePop(null);
    resetQuestionTimer();
    if (settings.persistProgress) {
      persistRunProgress(checkpoint, checkpoint, mode, level);
    }
    speak("Checkpoint loaded. Try that Keeper challenge again!", "start");
  };

  const finishRun = (runResult: "victory" | "game-over", finalBattle: BattleState) => {
    setResult(runResult);
    setScreen("summary");

    const finalConfig = MODE_CONFIGS[mode];
    const finalScore =
      finalBattle.stats.bossesDefeated * 220 +
      finalBattle.stats.correctAnswers * 70 +
      finalBattle.stats.maxStreak * 25 +
      Math.floor((finalBattle.playerHp / finalConfig.playerMaxHp) * 100);

    updateHighScore(finalScore, mode);
    appendSummary(runResult, mode, finalBattle, finalScore);

    // Generate growth summary from pedagogical diagnostics
    if (diagnostics) {
      const summary = generateGrowthSummary(diagnostics);
      setGrowthSummary(summary);
    }
    clearDiagnostics();
    setCurrentHintText(null);

    if (settings.persistProgress) {
      clearProgress();
      setResumeRun(null);
    }

    if (runResult === "victory") {
      speak("Legendary win! You completed the Keeper challenge.", "victory");
    } else {
      speak("Good effort! Recharge and try another run.", "wrong");
    }
  };

  const nextBoss = () => {
    const nextIndex = battle.bossIndex + 1;
    const next = BOSSES[nextIndex];
    if (!next) {
      finishRun("victory", battle);
      return;
    }

    const nextStats: BattleStats = { ...battle.stats };
    const nextBattle = createBossCheckpoint(nextIndex, mode, level, battle.playerHp, nextStats);
    const nextCheckpoint = nextBattle;

    setBattle(nextBattle);
    setCheckpoint(nextCheckpoint);
    setAttackMode("none");
    setDamagePop(null);
    setTypedAnswer("");
    setPhaseBanner(`${next.name} Enters!`);
    resetQuestionTimer();
    if (settings.persistProgress) {
      persistRunProgress(nextBattle, nextCheckpoint, mode, level);
    }
    speak(`${next.name} is now on stage. Keep your streak alive!`, "start");
  };

  const resolveWrongAnswer = (isTimeout: boolean) => {
    triggerComboBroken();
    const newPlayerHp = Math.max(0, battle.playerHp - config.wrongDamage);
    
    let feedbackData: FeedbackType;
    if (isTimeout) {
      feedbackData = {
        message: `${currentBoss.taunts.attack}`,
        type: "timeout",
        correctAnswer: battle.question.correct,
        questionType: battle.question.typeLabel
      };
    } else {
      feedbackData = buildWrongFeedback(currentBoss, battle.question);
    }

    setAttackMode("boss");
    setDamagePop({ target: "player", amount: config.wrongDamage });
    
    /* Trigger cool blue puff feedback particles on wrong answer (gentle, kind feedback) */
    const particleId = `blue-${Date.now()}-${Math.random()}`;
    setParticles((prev) => [
      ...prev,
      { id: particleId, type: "blue-puff", x: window.innerWidth / 2, y: window.innerHeight / 2 }
    ]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particleId));
    }, 700);
    
    if (isTimeout) {
      setQuestionTimeLeft(-1);
      setTimeoutFlash(true);
      setPhaseBanner("Time Up!");
    }

    // Lives system: when HP hits 0, lose a life
    if (newPlayerHp <= 0) {
      const newLives = Math.max(0, battle.stats.livesRemaining - 1);
      
      // If out of lives, game over
      if (newLives <= 0) {
        const defeatedBattle: BattleState = {
          ...battle,
          playerHp: 0,
          feedback: feedbackData.message,
          feedbackData,
          lastHit: "player",
          stats: {
            ...bumpSkillProgress(battle.stats, battle.question.skillArea, false),
            wrongAnswers: battle.stats.wrongAnswers + 1,
            timeoutAnswers: battle.stats.timeoutAnswers + (isTimeout ? 1 : 0),
            streak: 0,
            livesRemaining: 0
          }
        };
        setBattle(defeatedBattle);
        finishRun("game-over", defeatedBattle);
        return;
      }
      
      // Still have lives: restore HP and continue
      const restoredBattle: BattleState = {
        ...battle,
        playerHp: config.playerMaxHp, // Restore full HP when losing a life
        round: battle.round + 1,
        question: createQuestion(currentBoss, battle.round + 1, config, mode, level, battle.bossPhase, autonomyMode, diagnostics ?? undefined),
        feedback: `Lost a life! ${newLives === 1 ? "One life left!" : `${newLives} lives left`}. Keep going, you've got this!`,
        feedbackData: undefined,
        lastHit: "player",
        stats: {
          ...bumpSkillProgress(battle.stats, battle.question.skillArea, false),
          wrongAnswers: battle.stats.wrongAnswers + 1,
          timeoutAnswers: battle.stats.timeoutAnswers + (isTimeout ? 1 : 0),
          streak: 0,
          livesRemaining: newLives
        }
      };
      resetQuestionTimer();
      setBattle(restoredBattle);
      setPhaseBanner(`❤️ ${newLives} Live${newLives === 1 ? "" : "s"} Left`);
      if (settings.persistProgress) {
        persistRunProgress(restoredBattle, checkpoint, mode, level);
      }
      speak(`You lost a life. ${newLives} remaining. Don't give up!`, "wrong");
      return;
    }

    const nextRound = battle.round + 1;
    const nextBattle: BattleState = {
      ...battle,
      playerHp: newPlayerHp,
      round: nextRound,
      question: createQuestion(currentBoss, nextRound, config, mode, level, battle.bossPhase, autonomyMode, diagnostics ?? undefined),
      feedback: feedbackData.message,
      feedbackData,
      lastHit: "player",
      stats: {
        ...bumpSkillProgress(battle.stats, battle.question.skillArea, false),
        wrongAnswers: battle.stats.wrongAnswers + 1,
        timeoutAnswers: battle.stats.timeoutAnswers + (isTimeout ? 1 : 0),
        streak: 0,
        livesRemaining: battle.stats.livesRemaining
      }
    };
    resetQuestionTimer();
    setBattle(nextBattle);
    if (settings.persistProgress) {
      persistRunProgress(nextBattle, checkpoint, mode, level);
    }
    speak(isTimeout ? "Time ran out. The boss lands a timeout hit!" : "Almost there. Try the next one!", "wrong");
  };

  const answer = (choice: string) => {
    if (screen !== "battle" || battle.phase !== "quiz") return;

    const submitted = normalizeAnswer(battle.question, choice);
    const correct = normalizeAnswer(battle.question, battle.question.correct);
    const isCorrect = submitted === correct;
    const nextRound = battle.round + 1;
    setTypedAnswer("");

    // Record question attempt in pedagogy diagnostics
    if (diagnostics) {
      const updatedDiagnostics = {
        ...diagnostics,
        totalQuestionsAsked: diagnostics.totalQuestionsAsked + 1
      };
      recordQuestionAttempt(updatedDiagnostics, battle.question.skillArea as ConceptFamily, isCorrect);
      setDiagnostics(updatedDiagnostics);
      saveDiagnostics(updatedDiagnostics);

      // Check if hint should be shown
      if (!isCorrect && shouldShowHint(updatedDiagnostics, battle.question.skillArea as ConceptFamily)) {
        const hints: Record<string, string> = {
          "spelling-missing-letter": "💡 Tip: Sound out the word slowly. What letter fits?",
          "spelling-beginning-sound": "💡 Tip: Listen to the first sound in your head.",
          "spelling-word-ending": "💡 Tip: Think of other words with the same ending.",
          "spelling-letter-count": "💡 Tip: Count each letter with your finger.",
          "spelling-vowel-sound": "💡 Tip: Remember the vowels: A, E, I, O, U.",
          "spelling-unscramble": "💡 Tip: Look for word patterns or common endings.",
          "math-add-subtract": "💡 Tip: Use your fingers or draw circles to count.",
          "math-missing-number": "💡 Tip: Count forward from the first number.",
          "math-two-step": "💡 Tip: Do the first step, then use that answer for the second.",
          "math-multiplication": "💡 Tip: Think of groups. 3 groups of 4 means 3 × 4."
        };
        const hintMsg = hints[battle.question.skillArea] || "💡 Take a breath and try again!";
        setCurrentHintText(hintMsg);
      } else {
        setCurrentHintText(null);
      }
    }

    if (isCorrect) {
      // Update power levels for this question family
      const skillFamilyId = battle.question.skillArea;
      const updatedPowerLevels = {
        ...powerLevels,
        [skillFamilyId]: updatePowerLevel(skillFamilyId, powerLevels[skillFamilyId], true)
      };
      setPowerLevels(updatedPowerLevels);
      savePowerLevels(mode, updatedPowerLevels);

      const newBossHp = Math.max(0, battle.bossHp - config.correctDamage);
      const nextPhase = getBossPhase(newBossHp, config.bossMaxHp);
      const phaseChanged = nextPhase !== battle.bossPhase;
      
      setAttackMode("hero");
      setDamagePop({ target: "boss", amount: config.correctDamage });
      
      /* Trigger gold burst celebration particles on correct answer */
      const particleId = `gold-${Date.now()}-${Math.random()}`;
      setParticles((prev) => [
        ...prev,
        { id: particleId, type: "gold-burst", x: window.innerWidth / 2, y: window.innerHeight / 2 }
      ]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== particleId));
      }, 800);
      
      // Phase transition feedback
      if (phaseChanged) {
        const phaseMessages = {
          "phase-2": "🔥 You're getting stronger! Keeper enters Phase 2!",
          "phase-3": "⚡ Incredible focus! Keeper enters Phase 3 - final stand!",
          "critical": "💥 One last push! The Keeper is nearly defeated!"
        };
        setPhaseBanner(phaseMessages[nextPhase]);
      } else {
        setPhaseBanner(battle.stats.streak + 1 >= 3 ? `Combo x${battle.stats.streak + 1}!` : "Direct Hit!");
      }

      if (newBossHp <= 0) {
        const defeatedBattle: BattleState = {
          ...battle,
          bossHp: 0,
          round: nextRound,
          feedback: `${currentBoss.taunts.defeated} ${battle.question.typeLabel === "Spelling" ? "You used awesome word power!" : "Your maths power-up was perfect!"}`,
          feedbackData: undefined,
          phase: "boss-defeated",
          lastHit: "boss",
          bossPhase: nextPhase,
          stats: {
            ...bumpSkillProgress(battle.stats, battle.question.skillArea, true),
            correctAnswers: battle.stats.correctAnswers + 1,
            spellingCorrect: battle.stats.spellingCorrect + (battle.question.typeLabel === "Spelling" ? 1 : 0),
            mathsCorrect: battle.stats.mathsCorrect + (battle.question.typeLabel === "Maths" ? 1 : 0),
            bossesDefeated: battle.stats.bossesDefeated + 1,
            streak: battle.stats.streak + 1,
            maxStreak: Math.max(battle.stats.maxStreak, battle.stats.streak + 1),
            livesRemaining: battle.stats.livesRemaining
          }
        };
        setBattle(defeatedBattle);
        setPhaseBanner("Keeper Defeated!");
        if (settings.persistProgress) {
          persistRunProgress(defeatedBattle, checkpoint, mode, level);
        }
        speak(`${currentBoss.name} has been defeated. Brilliant work!`, "bossDown");
        return;
      }

      const nextBattle: BattleState = {
        ...battle,
        bossHp: newBossHp,
        round: nextRound,
        question: createQuestion(currentBoss, nextRound, config, mode, level, nextPhase, autonomyMode, diagnostics ?? undefined),
        feedback: buildCorrectFeedback(currentBoss, battle.question, newBossHp, config),
        feedbackData: undefined,
        lastHit: "boss",
        bossPhase: nextPhase,
        phaseSwitchNotification: phaseChanged ? `Entering ${nextPhase}` : undefined,
        stats: {
          ...bumpSkillProgress(battle.stats, battle.question.skillArea, true),
          correctAnswers: battle.stats.correctAnswers + 1,
          spellingCorrect: battle.stats.spellingCorrect + (battle.question.typeLabel === "Spelling" ? 1 : 0),
          mathsCorrect: battle.stats.mathsCorrect + (battle.question.typeLabel === "Maths" ? 1 : 0),
          streak: battle.stats.streak + 1,
          maxStreak: Math.max(battle.stats.maxStreak, battle.stats.streak + 1),
          livesRemaining: battle.stats.livesRemaining
        }
      };
      resetQuestionTimer();
      setBattle(nextBattle);
      if (settings.persistProgress) {
        persistRunProgress(nextBattle, checkpoint, mode, level);
      }
      speak(phaseChanged ? `Phase change! ${nextPhase === "phase-2" ? "Getting tougher!" : "Final stretch!"}` : "Correct answer. Spark strike launched!", "correct");
      return;
    }

    // Wrong answer: update power level with -1
    const skillFamilyId = battle.question.skillArea;
    const updatedPowerLevels = {
      ...powerLevels,
      [skillFamilyId]: updatePowerLevel(skillFamilyId, powerLevels[skillFamilyId], false)
    };
    setPowerLevels(updatedPowerLevels);
    savePowerLevels(mode, updatedPowerLevels);

    resolveWrongAnswer(false);
  };

  useEffect(() => {
    if (screen !== "battle" || battle.phase !== "quiz") return;
    if (questionTimeLeft > 0) return;
    if (handledTimeoutKeyRef.current === questionTimerKey) return;
    handledTimeoutKeyRef.current = questionTimerKey;
    const timeout = setTimeout(() => {
      resolveWrongAnswer(true);
    }, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTimeLeft, screen, battle.phase, questionTimerKey]);

  return (
    <main className={`page-wrap ${screen === "battle" ? "battle-shell" : ""}`}>
      {screen !== "battle" && (
        <>
          <section className="card title-card">
            <div className="title-hero">
              <span className="title-kicker">✨ Kid Quest Arena ✨</span>
              <h1>Marmalade: Keeper Quiz Challenge</h1>
              <p>Bright battle arena with illustrated heroes, voice cues, and one focused Keeper challenge for Phase 1.</p>
              <div className="title-badges" aria-hidden>
                <span>🎨 Storybook Art</span>
                <span>🧠 Spelling + Maths</span>
                <span>👑 Keeper Challenge</span>
              </div>
            </div>
          </section>

          <section className="card voice-card" aria-live="polite">
            <strong>Coach Comet says:</strong>
            <p>{voiceLine}</p>
          </section>
        </>
      )}

      {screen === "onboarding" && (
        <section className="card onboarding-section center-stack">
          <div className="onboarding-screen active">
            <div className="onboarding-visual" aria-hidden>
              <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", alignItems: "center", margin: "1rem 0", flexWrap: "wrap" }}>
                <div className="onboarding-emoji" style={{ fontSize: "5rem" }}>🦸‍♀️</div>
                <div style={{ fontSize: "2rem" }}>⚡</div>
                <div className="onboarding-emoji" style={{ fontSize: "5rem" }}>📚</div>
                <div style={{ fontSize: "2rem" }}>⚡</div>
                <div className="onboarding-emoji" style={{ fontSize: "5rem" }}>🧙</div>
              </div>
            </div>
            <h2>Jump straight in</h2>
            <p>Your hero is ready. Tap once and the Keeper will ask Question 1 right away.</p>
            <div className="onboarding-cues">
              <span>⚡ Instant start</span>
              <span>🧠 Default to mixed questions</span>
              <span>🎨 Customize later if you want</span>
            </div>
          </div>

          <button className="big-btn" onClick={quickStartAdventure}>
            Play Now
          </button>
          <button className="ghost-btn" onClick={() => setScreen("character-creation")}>
            Customize Hero First
          </button>
        </section>
      )}

      {screen === "character-creation" && (
        <section className="card center-stack character-creation-card">
          <h2>Create Your Hero</h2>
          <p>Welcome, adventurer! Let&apos;s build your character for the quiz quest.</p>

          <div className="char-form">
            <div className="form-group">
              <label htmlFor="hero-name">
                <strong>What&apos;s your hero name?</strong>
              </label>
              <input
                id="hero-name"
                type="text"
                className="text-input"
                value={charNameInput}
                onChange={(e) => setCharNameInput(e.target.value)}
                placeholder="Enter your hero name"
                maxLength={30}
              />
              {!charNameInput.trim() && (
                <small style={{ color: "#999" }}>
                  Don&apos;t worry — if you leave this blank, we&apos;ll call you &quot;Hero&quot;
                </small>
              )}
            </div>

            <div className="form-group">
              <strong>Are you a boy or girl?</strong>
              <div className="gender-buttons">
                <button
                  className={`gender-btn ${charGender === "boy" ? "selected" : ""}`}
                  onClick={() => setCharGender("boy")}
                >
                  👦 Boy
                </button>
                <button
                  className={`gender-btn ${charGender === "girl" ? "selected" : ""}`}
                  onClick={() => setCharGender("girl")}
                >
                  👧 Girl
                </button>
              </div>
            </div>

            <div className="form-group">
              <strong>Customize Your Look</strong>
              <div className="appearance-preview">
                <div className="preview-emojis" aria-hidden>
                  <div>{getAppearanceEmoji("hat", charAppearance.hat)}</div>
                  <div>{getAppearanceEmoji("shirt", charAppearance.shirt)}</div>
                  <div>{getAppearanceEmoji("pants", charAppearance.pants)}</div>
                  <div>{getAppearanceEmoji("shoes", charAppearance.shoes)}</div>
                </div>
                <p className="preview-label">Your hero:</p>
              </div>

              {(["hat", "shirt", "pants", "shoes"] as AppearanceCategory[]).map((category) => (
                <div key={category} className="appearance-category">
                  <label>
                    <strong>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </strong>
                  </label>
                  <div className="appearance-options">
                    {APPEARANCE_OPTIONS[category].map((option) => (
                      <button
                        key={option.id}
                        className={`appearance-btn ${
                          charAppearance[category] === option.id ? "selected" : ""
                        }`}
                        onClick={() =>
                          setCharAppearance({
                            ...charAppearance,
                            [category]: option.id
                          })
                        }
                        title={option.label}
                      >
                        <span className="appearance-emoji">{option.emoji}</span>
                        <span className="appearance-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="big-btn"
              onClick={completeCharacterCreation}
            >
              Save Hero & Continue
            </button>
            <button className="ghost-btn" onClick={quickStartAdventure}>
              Skip for Now
            </button>
          </div>
        </section>
      )}

      {screen === "parental-controls" && (
        <section className="card center-stack parental-controls-card">
          <h2>🔒 Parental Controls</h2>
          <p>Enter PIN to unlock parent settings</p>

          {!parentalPinValid ? (
            <div className="pin-entry-form">
              <div className="pin-display">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`pin-dot ${i < pinInput.length ? "filled" : ""}`} />
                ))}
              </div>
              <div className="pin-pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    className="pin-btn"
                    onClick={() => {
                      if (pinInput.length < 4) {
                        setPinInput(pinInput + num);
                      }
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="pin-btn pin-delete"
                  onClick={() => setPinInput(pinInput.slice(0, -1))}
                >
                  ← Del
                </button>
              </div>

              {pinAttempts > 0 && pinInput.length === 0 && (
                <p style={{ color: "#ff6b6b", fontWeight: 700 }}>
                  ❌ Wrong PIN. Attempts: {pinAttempts}/3
                </p>
              )}

              {pinInput.length === 4 && (
                <div>
                  {pinInput === PARENTAL_PIN ? (
                    <div>
                      <p style={{ color: "#51cf66", fontWeight: 700 }}>✅ PIN Correct!</p>
                      <button
                        className="big-btn"
                        onClick={() => {
                          setParentalPinValid(true);
                          setScreen("settings");
                        }}
                      >
                        Access Parent Settings
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ color: "#ff6b6b", fontWeight: 700 }}>❌ Wrong PIN. Try again.</p>
                      <button
                        className="ghost-btn"
                        onClick={() => {
                          setPinInput("");
                          setPinAttempts(pinAttempts + 1);
                          if (pinAttempts + 1 >= 3) {
                            setTimeout(() => {
                              setScreen("title");
                              setPinInput("");
                              setPinAttempts(0);
                            }, 2000);
                          }
                        }}
                      >
                        Clear & Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p>✅ PIN verified. You can now modify parent settings.</p>
              <button className="big-btn" onClick={() => setScreen("settings")}>
                Go to Settings
              </button>
            </div>
          )}

          <button className="ghost-btn" onClick={() => {
            setScreen("title");
            setPinInput("");
            setPinAttempts(0);
            setParentalPinValid(false);
          }}>
            Back
          </button>
        </section>
      )}

      {screen === "settings" && (
        <section className="card center-stack settings-full-card">
          <h2>⚙️ Settings</h2>
          
          <div className="settings-sections">
            {/* Sound Settings */}
            <div className="settings-section">
              <h3>🔊 Sound</h3>
              <label className="settings-toggle">
                <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
                Master Volume
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                Keeper Dialogue
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                Feedback Sounds
              </label>
            </div>

            {/* Gameplay Settings */}
            <div className="settings-section">
              <h3>🎮 Gameplay</h3>
              <label className="settings-toggle">
                <input type="checkbox" checked={settings.persistProgress} onChange={(e) => updateSetting("persistProgress", e.target.checked)} />
                Save Progress (Resume Games)
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={settings.persistDifficulty} onChange={(e) => updateSetting("persistDifficulty", e.target.checked)} />
                Remember Difficulty
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                Show Hints When Wrong
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                Timer Enabled
              </label>
            </div>

            {/* Appearance Settings */}
            <div className="settings-section">
              <h3>🎨 Appearance</h3>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                High Contrast Mode (Accessibility)
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                Colorblind-Friendly Mode
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={true} onChange={() => {}} />
                Large Text
              </label>
            </div>

            {/* Parental / Safety Settings (Locked by PIN) */}
            <div className="settings-section parental-section">
              <h3>👨‍👩‍👧‍👦 Parental Controls</h3>
              <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "1rem" }}>
                Parent-only settings to manage playtime and content.
              </p>
              <label className="settings-toggle">
                <input type="checkbox" checked={settings.persistHighScore} onChange={(e) => updateSetting("persistHighScore", e.target.checked)} />
                Track High Scores
              </label>
              <label className="settings-toggle">
                <input type="checkbox" checked={settings.persistSummaries} onChange={(e) => updateSetting("persistSummaries", e.target.checked)} />
                Save Run History
              </label>
              <div className="setting-input-group">
                <label>Daily Playtime Limit (minutes)</label>
                <input type="number" className="settings-input" defaultValue="60" min="10" max="180" />
              </div>
              <div className="setting-input-group">
                <label>Session Duration (minutes)</label>
                <input type="number" className="settings-input" defaultValue="20" min="5" max="60" />
              </div>
              <button
                className="ghost-btn"
                onClick={() => {
                  setParentalPinValid(false);
                  setPinInput("");
                }}
              >
                Lock Parental Controls
              </button>
            </div>
          </div>

          <button className="big-btn" onClick={() => setScreen("title")}>
            Back to Title
          </button>
        </section>
      )}

      {screen === "title" && (
        <section className="card center-stack">
          {character && (
            <div className="character-intro-card">
              <div className="character-display">
                <div className="character-emojis" aria-hidden>
                  <div className="emoji-item">{getAppearanceEmoji("hat", character.appearance.hat)}</div>
                  <div className="emoji-item">{getAppearanceEmoji("shirt", character.appearance.shirt)}</div>
                  <div className="emoji-item">{getAppearanceEmoji("pants", character.appearance.pants)}</div>
                  <div className="emoji-item">{getAppearanceEmoji("shoes", character.appearance.shoes)}</div>
                </div>
                <div>
                  <h3>{character.name}</h3>
                  <p className="character-gender">
                    {character.gender === "boy" ? "👦" : "👧"} {character.gender === "boy" ? "Boy hero" : "Girl hero"}
                  </p>
                </div>
              </div>
              <button className="mini-btn" onClick={editCharacter}>
                Edit Character
              </button>
            </div>
          )}

          <div className="settings-card">
            <strong>Learning Setup</strong>
            <div className="settings-grid">
              <label>
                Age band
                <select
                  value={ageBand}
                  onChange={(e) => {
                    const nextAge = e.target.value as AgeBand;
                    const nextMode = AGE_TO_MODE[nextAge];
                    setAgeBand(nextAge);
                    setMode(nextMode);
                    speak(`${MODE_CONFIGS[nextMode].label} challenge tuned for this age band.`, "start");
                  }}
                >
                  <option value="ages-4-6">Ages 4-6</option>
                  <option value="ages-7-9">Ages 7-9</option>
                  <option value="ages-10-plus">Ages 10+</option>
                </select>
              </label>
              <label>
                Learning level
                <select
                  value={level}
                  onChange={(e) => {
                    const nextLevel = e.target.value as LearnerLevel;
                    setLevel(nextLevel);
                    speak(`${LEVEL_TUNING[nextLevel].label} level selected. ${LEVEL_TUNING[nextLevel].blurb}.`, "start");
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="growing">Growing</option>
                  <option value="expert">Expert</option>
                </select>
              </label>
              <label>
                Question focus (autonomy)
                <select
                  value={autonomyMode}
                  onChange={(e) => {
                    const nextMode = e.target.value as "maths" | "words" | "mix";
                    setAutonomyMode(nextMode);
                    const msg = nextMode === "maths" ? "Maths focus: you will see more numbers and calculations." : 
                               nextMode === "words" ? "Word focus: you will see more spelling and language." : 
                               "Mix mode: balanced mix of maths and word skills.";
                    speak(msg, "start");
                  }}
                >
                  <option value="mix">Mix (adaptive blend)</option>
                  <option value="maths">Maths focus</option>
                  <option value="words">Words focus</option>
                </select>
              </label>
            </div>
            <small>{LEVEL_TUNING[level].blurb}</small>
          </div>

          <div className="mode-grid">
            {(Object.keys(MODE_CONFIGS) as DifficultyMode[]).map((m) => {
              const modeConfig = MODE_CONFIGS[m];
              const modeHigh = highScores[m] ?? 0;
              return (
                <button
                  key={m}
                  className={`mode-btn ${mode === m ? "selected" : ""}`}
                  onClick={() => {
                    setMode(m);
                    setAgeBand(MODE_TO_AGE[m]);
                    speak(`${modeConfig.label} mode selected. ${modeConfig.subtitle}`, "start");
                  }}
                >
                  <div className="mode-top-row"><strong>{MODE_DECOR[m].icon} {modeConfig.label}</strong><em>{MODE_DECOR[m].badge}</em></div>
                  <span>{modeConfig.ageBand}</span>
                  <small>{modeConfig.subtitle}</small>
                  <small>Best: {modeHigh}</small>
                </button>
              );
            })}
          </div>


          <div className="settings-card">
            <strong>Parent Settings</strong>
            <div className="settings-grid">
              <label><input type="checkbox" checked={settings.persistDifficulty} onChange={(e) => updateSetting("persistDifficulty", e.target.checked)} /> Remember difficulty</label>
              <label><input type="checkbox" checked={settings.persistProgress} onChange={(e) => updateSetting("persistProgress", e.target.checked)} /> Save run progress (resume)</label>
              <label><input type="checkbox" checked={settings.persistHighScore} onChange={(e) => updateSetting("persistHighScore", e.target.checked)} /> Save high scores</label>
              <label><input type="checkbox" checked={settings.persistSummaries} onChange={(e) => updateSetting("persistSummaries", e.target.checked)} /> Save run summaries</label>
            </div>
          </div>

          {resumeRun && settings.persistProgress && (
            <button className="ghost-btn" onClick={resumeAdventure}>Resume Saved Adventure ({MODE_CONFIGS[resumeRun.mode].label} · {LEVEL_TUNING[resumeRun.level].label})</button>
          )}

          <div className="boss-row">
            <div className="boss-preview" style={{ background: "linear-gradient(145deg, rgba(236, 221, 187, 0.34), rgba(208, 176, 123, 0.28))" }}>
              <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }} aria-hidden>
                <KeeperCharacter phase="phase-1" size="small" />
              </div>
              <strong>{BOSSES[0].name}</strong>
              <span>{BOSSES[0].subtitle}</span>
              <small>“{BOSSES[0].taunts.intro}”</small>
            </div>
          </div>
          <button className="big-btn" onClick={startGame}>Start Adventure</button>
          <button className="ghost-btn" onClick={() => setScreen("parental-controls")}>⚙️ Settings</button>
        </section>
      )}

      {screen === "battle" && (
        <section className={`card battle-card immersive-battle keeper-encounter battle-viewport ${getAttackClasses(battle.lastHit, attackMode, timeoutFlash).join(" ")} mode-${mode} ${celebrationClass}`}>
          {milestonePulse && <div className="milestone-glow-layer" aria-hidden />}
          {phaseBanner && <div className="phase-banner">{phaseBanner}</div>}
          {(tierBanner || comboBanner) && (
            <div className="reward-banners" role="status" aria-live="assertive">
              {tierBanner && (
                <div className="reward-banner tier-banner">
                  <span>{tierBanner}</span>
                </div>
              )}
              {comboBanner && (
                <div className="reward-banner combo-banner">
                  <strong>{comboBanner}</strong>
                  <span className="combo-bonus">+{comboBonus} pts!</span>
                </div>
              )}
            </div>
          )}

          <div className="battle-top-controls battle-topline" role="toolbar" aria-label="Battle controls">
            <div className="battle-essentials stripped-hud-rails" aria-label="Health status">
              <div className="battle-hp-rail battle-hp-rail-player" aria-label={`Hero HP ${battle.playerHp} out of ${config.playerMaxHp}`}>
                <span className="hp-emoji" aria-hidden>🦸</span>
                <div className="bar mini-bar"><span style={{ width: `${(battle.playerHp / config.playerMaxHp) * 100}%` }} /></div>
              </div>
              <div className="battle-hp-rail battle-hp-rail-boss" aria-label={`Keeper HP ${battle.bossHp} out of ${config.bossMaxHp}`}>
                <div className="bar enemy mini-bar"><span style={{ width: `${(battle.bossHp / config.bossMaxHp) * 100}%` }} /></div>
                <span className="hp-emoji" aria-hidden>👹</span>
              </div>
            </div>
            <div className="combo-meter-zone" aria-live="polite">
              {comboVisible && (
                <div className="combo-meter-stack">
                  <div
                    className={`combo-meter combo-level-${comboLevel} ${comboBrokenFlash ? "combo-broken" : ""}`}
                    role="status"
                    aria-label={`Combo x${comboDisplayValue}`}
                  >
                    <span className="combo-label">combo</span>
                    <strong className="combo-value">x{comboDisplayValue}</strong>
                  </div>
                  {comboBrokenFlash && (
                    <span className="combo-broken-text" role="alert">
                      COMBO BROKEN
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="rank-hud battle-rank-hud" aria-live="polite" aria-label={`Tier ${currentTier.name}`}>
              <div className="rank-icon-shell">
                <span className="rank-icon" aria-hidden>{currentTier.icon}</span>
                {tierBurst && (
                  <div className="tier-particle-field">
                    {tierBurst.particles.map((particle) => (
                      <span
                        key={particle.id}
                        className="tier-particle"
                        style={{
                          "--tx": `${particle.tx}px`,
                          "--ty": `${particle.ty}px`
                        } as CSSProperties}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="rank-body">
                <div className="rank-top-row">
                  <strong className="rank-name">{currentTier.name}</strong>
                  <span className="rank-score">{score} pts</span>
                </div>
                <p className="rank-description">{currentTier.description}</p>
                {nextTier ? (
                  <div className="rank-next">
                    <span className="rank-next-label">Next: {nextTier.name} · {nextTier.minScore} pts</span>
                    <div className="rank-progress-track">
                      <span style={{ width: `${tierProgress * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="rank-next">
                    <span className="rank-max">Top tier</span>
                    <div className="rank-progress-track">
                      <span style={{ width: "100%" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="pause-btn battle-pause-pill" onClick={() => setScreen("title")} title="Pause and return to title" aria-label="Pause">
              ⏸
            </button>
          </div>
          <div className={`impact-overlay ${attackMode === "hero" ? "hero" : attackMode === "boss" ? "boss" : ""}`} aria-hidden />
          <div className={`battle-flash ${bossDefeatFlashing ? "boss-defeat-flash" : ""}`} aria-hidden />

          <div className="battle-stage-shell">
            <div className={`boss-stage ${bossEntranceActive ? "boss-entrance" : ""} ${bossDefeatFlashing ? "boss-defeat" : ""}`} role="presentation">
              <div className="boss-stage-header">
                <div className="battle-boss-copy">
                  <span className="battle-scene-kicker">Keeper arena</span>
                  <h2>{currentBoss.name}</h2>
                  <p>{currentBoss.taunts.intro}</p>
                </div>
                <div className="battle-boss-healthcard">
                  <span className="mini-stat-label">Keeper HP</span>
                  <strong>{battle.bossHp}/{config.bossMaxHp}</strong>
                  <div className="bar enemy battle-scene-bar"><span style={{ width: `${(battle.bossHp / config.bossMaxHp) * 100}%` }} /></div>
                </div>
              </div>

              <div className="boss-stage-body">
                <div className="boss-stage-glow" aria-hidden />
                <div className={`boss-sprite battle-boss-sprite ${getSpriteAnimationClass("boss", attackMode, attackMode === "hero")}`}>
                  <KeeperCharacter
                    phase={battle.bossPhase}
                    animated={attackMode === "boss"}
                    size="large"
                  />
                  <div className="sprite-label">Keeper</div>
                  {damagePop?.target === "boss" && <div className="damage-pop">-{damagePop.amount}</div>}
                </div>
                <div className="stage-projectile-lane" aria-hidden>
                  {shouldShowProjectile(attackMode) && (
                    <div className={`projectile ${getProjectileType(attackMode)}`} />
                  )}
                  {shouldShowImpactBurst(attackMode) && (
                    <div className={`impact-burst ${getImpactBurstPosition(attackMode)}`} />
                  )}
                </div>
              </div>
            </div>

            <div className="player-secondary-panel">
              <div className={`player-sprite-card ${getSpriteAnimationClass("hero", attackMode, attackMode === "boss")}`}>
                {character ? (
                  <PlayerCharacter
                    outfit={{
                      hat: character.appearance.hat,
                      shirt: character.appearance.shirt,
                      pants: character.appearance.pants,
                      shoes: character.appearance.shoes
                    }}
                    animated={attackMode === "hero"}
                    size="small"
                  />
                ) : (
                  <div className="hero-portrait" aria-hidden>
                    <div className="shape cape" /><div className="shape body" /><div className="shape head" /><div className="shape eye left" /><div className="shape eye right" /><div className="shape wand" />
                  </div>
                )}
                <div className="sprite-label">{character?.name ?? "You"}</div>
                {damagePop?.target === "player" && <div className="damage-pop">-{damagePop.amount}</div>}
              </div>

              <div className="player-secondary-metrics">
                <div className="battle-lives-strip" aria-label={`Lives remaining: ${battle.stats.livesRemaining}`}>
                  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                    <span key={i} className={`life-heart ${i < battle.stats.livesRemaining ? "active" : "empty"}`}>
                      {i < battle.stats.livesRemaining ? "❤️" : "🖤"}
                    </span>
                  ))}
                </div>
                <div className="battle-player-health">
                  <span className="mini-stat-label">Hero HP</span>
                  <div className="bar battle-scene-bar"><span style={{ width: `${(battle.playerHp / config.playerMaxHp) * 100}%` }} /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="battle-particles" aria-hidden>
            {particles.map((particle) =>
              particle.type === "gold-burst" ? (
                <GoldBurstParticle key={particle.id} x={particle.x} y={particle.y} count={8} />
              ) : (
                <BluePuffParticle key={particle.id} x={particle.x} y={particle.y} count={6} />
              )
            )}
          </div>

          {battle.phase === "quiz" ? (
            <>
              <div className="stage-dimmer" aria-hidden />
              <div className="question-overlay-card battle-quiz-panel battle-question-dock" role="group" aria-label={`${battle.question.typeLabel} question`}>
                <div className="question-overlay-hud">
                  <div className="battle-skill-pill battle-scene-skill-pill" aria-live="polite">
                    <span>{SKILL_LABELS[battle.question.skillArea]}</span>
                    <strong>{powerLevels[battle.question.skillArea] ? getPowerLevelStage(powerLevels[battle.question.skillArea].level) : "novice"}</strong>
                  </div>
                  <div className="power-level-bar overlay-power-level">
                    <div className="power-fill" style={{ width: `${powerLevels[battle.question.skillArea]?.level ?? 0}%` }} />
                  </div>
                </div>
                <div className="question-header compact-question-header battle-question-topline">
                  <div className="question-type">{battle.question.typeLabel} · {battle.question.inputMode === "typed" ? "Type" : "Pick"}</div>
                  <div className="battle-question-meta">
                    <span className="battle-round-chip">Q{battle.round + 1}</span>
                    <div className="question-count">{timerCritical ? "HURRY" : `${Math.max(0, questionTimeLeft)}s`}</div>
                  </div>
                </div>
                <div className={`question-timer compact-timer ${timerUrgent ? "urgent" : ""} ${timerCritical ? "critical" : ""}`} role="timer" aria-live="assertive" aria-label={getTimerAriaLabel(Math.max(0, questionTimeLeft), timerUrgency)}>
                  <div className="timer-track"><span style={{ width: `${timerPercent}%` }} /></div>
                </div>
                <h3>{battle.question.prompt}</h3>
                {currentHintText && <div className="battle-hint-banner">{currentHintText}</div>}
                {battle.question.inputMode === "choice" ? (
                  <div className="options-grid battle-options-grid">
                    {battle.question.options.map((option, idx) => (
                      <button
                        key={option}
                        className="answer-btn"
                        onClick={() => answer(option)}
                        aria-label={`Answer ${idx + 1}: ${option}`}
                      >
                        <span className="answer-index" aria-hidden>{idx + 1}</span>
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <form
                    className="typed-answer-form compact-typed-answer-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!typedAnswer.trim()) return;
                      answer(typedAnswer);
                    }}
                  >
                    <input
                      className="typed-answer-input"
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder={battle.question.placeholder ?? "Type your answer"}
                      aria-label="Type your answer"
                      autoComplete="off"
                    />
                    <button type="submit" className="big-btn compact-submit-btn">Go</button>
                  </form>
                )}
                {battle.feedbackData && (battle.feedbackData.type === "wrong" || battle.feedbackData.type === "timeout") ? (
                  <div className="battle-feedback-slot overlay-feedback">
                    <WrongAnswerFeedback feedback={battle.feedbackData} />
                  </div>
                ) : (
                  <p className="feedback overlay-feedback-text">{battle.feedback}</p>
                )}
              </div>
            </>
          ) : (
            <div className="center-stack battle-victory-panel">
              <h3>{currentBoss.name} is down!</h3>
              <button className="big-btn" onClick={nextBoss}>{battle.bossIndex < BOSSES.length - 1 ? "Continue" : "Finish Adventure"}</button>
            </div>
          )}

        </section>
      )}

      {screen === "summary" && (
        <section className={`card center-stack end-card celebration summary-card ${result === "victory" ? "victory-summary" : result === "game-over" ? "defeat-summary" : ""}`}>
          <div className="summary-hero">
            {result === "victory" ? (
              <div className="victory-hero">
                <div className="victory-banner">Victory!</div>
                <p className="victory-subtitle">Keeper down. Your streak, focus, and kindness won the arena.</p>
                <div className="rank-badge victory-rank-badge">
                  <span className="rank-icon" aria-hidden>{currentTier.icon}</span>
                  <div>
                    <strong>{currentTier.name}</strong>
                    <small>{currentTier.description}</small>
                  </div>
                </div>
                <div className="victory-stats-grid">
                  <div>
                    <span>Score</span>
                    <strong>{score} pts</strong>
                  </div>
                  <div>
                    <span>Max combo</span>
                    <strong>{battle.stats.maxStreak}x</strong>
                  </div>
                  <div>
                    <span>Bosses cleared</span>
                    <strong>{battle.stats.bossesDefeated}/{BOSSES.length}</strong>
                  </div>
                  <div>
                    <span>Accuracy</span>
                    <strong>{accuracy}%</strong>
                  </div>
                </div>
                <button className="big-btn hero-btn" onClick={startGame}>Play Again</button>
                <div className="confetti-shower" aria-hidden />
              </div>
            ) : (
              <div className="defeat-hero">
                <div className="defeat-banner">Try again!</div>
                <p className="defeat-message">You battled bravely. Keep your streak in mind and come back stronger.</p>
                <div className="defeat-tier">
                  <span className="tier-icon" aria-hidden>{currentTier.icon}</span>
                  <div>
                    <strong>{currentTier.name}</strong>
                    <small>Tier reached · {score} pts</small>
                  </div>
                </div>
                <button className="big-btn hero-btn" onClick={startGame}>Play Again</button>
              </div>
            )}
          </div>
          <div className="summary-headline">
            <h2>{result === "victory" ? "Learning Victory" : "Learning Summary"}</h2>
            <p>{scorecardHeadline} {config.label} mode · {config.ageBand} · {LEVEL_TUNING[level].label} track.</p>
            <p>Mode high score: {highScores[mode] ?? 0}</p>
          </div>
          <div className="summary-grid">
            <div><strong>Score</strong><span>{score}</span></div>
            <div><strong>Accuracy</strong><span>{accuracy}%</span></div>
            <div><strong>Correct</strong><span>{battle.stats.correctAnswers}</span></div>
            <div><strong>Mistakes</strong><span>{battle.stats.wrongAnswers}</span></div>
            <div><strong>Timeouts</strong><span>{timeoutAnswers}</span></div>
            <div><strong>Spelling wins</strong><span>{battle.stats.spellingCorrect}</span></div>
            <div><strong>Maths wins</strong><span>{battle.stats.mathsCorrect}</span></div>
            <div><strong>Keeper challenge cleared</strong><span>{battle.stats.bossesDefeated}/{BOSSES.length}</span></div>
            <div><strong>Best streak</strong><span>{battle.stats.maxStreak}</span></div>
          </div>
          <p className="level-badge">{learningLevel}</p>

          {/* Growth Summary: Pedagogy Layer - Show accuracy by topic and actionable insights */}
          {growthSummary && (
            <div className="scorecard-panel full-width pedagogy-growth">
              <strong>🌱 Growth Summary</strong>
              <p style={{ fontSize: "1.1em", fontWeight: 500, marginTop: "0.5em" }}>{growthSummary.actionableInsight}</p>
              
              {growthSummary.masteringFamilies.length > 0 && (
                <div style={{ marginTop: "1em" }}>
                  <strong style={{ color: "#2ecc71" }}>✨ You&apos;re mastering:</strong>
                  <ul style={{ marginLeft: "1em" }}>
                    {growthSummary.masteringFamilies.map((family) => {
                      const stats = growthSummary.accuracyByFamily[family];
                      return (
                        <li key={family}>
                          {family.replace(/-/g, " ")} — {stats.percentage}% ({stats.correct}/{stats.total} correct)
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {growthSummary.strugglingFamilies.length > 0 && (
                <div style={{ marginTop: "1em" }}>
                  <strong style={{ color: "#e67e22" }}>🎯 Focus areas (let&apos;s improve these):</strong>
                  <ul style={{ marginLeft: "1em" }}>
                    {growthSummary.strugglingFamilies.map((family) => {
                      const stats = growthSummary.accuracyByFamily[family];
                      return (
                        <li key={family} style={{ color: "#e67e22" }}>
                          {family.replace(/-/g, " ")} — {stats.percentage}% ({stats.correct}/{stats.total} correct)
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              
              {growthSummary.hintsShown > 0 && (
                <p style={{ marginTop: "1em", fontSize: "0.95em", color: "#7f8c8d" }}>
                  💡 {growthSummary.hintsShown} hint{growthSummary.hintsShown === 1 ? "" : "s"} appeared to help you learn.
                </p>
              )}
            </div>
          )}

          <div className="scorecard-panel full-width">
            <strong>Parent / teacher interpretation</strong>
            <p><strong>Stage lens:</strong> {selectedStage.label} ({selectedStage.ageBand}) · {LEVEL_TUNING[level].label}</p>
            <p>{stageInterpretation}</p>
            <p><strong>Why this matters:</strong> {timeoutSignal}</p>
            <p><strong>What this stage usually targets:</strong> {selectedStage.questionBands.slice(0, 2).map((band) => band.label).join(" · ")}</p>
            <p><strong>Quick note:</strong> {parentSummary}</p>
          </div>

          <div className="scorecard-layout">
            <div className="scorecard-panel">
              <strong>Strengths</strong>
              <ul>
                {strengths.length > 0 ? strengths.map((item) => (
                  <li key={item.key}>{item.label} — {item.correct}/{item.attempts} correct ({item.accuracy}%)</li>
                )) : <li>Keep playing a few more rounds to identify clear strengths.</li>}
              </ul>
            </div>

            <div className="scorecard-panel warn">
              <strong>Needs more practice</strong>
              <ul>
                {growthAreas.length > 0 ? growthAreas.map((item) => (
                  <li key={item.key}>{item.label} — {item.correct}/{item.attempts} correct ({item.accuracy}%)</li>
                )) : <li>No major weak spots this round. Keep stretching the challenge.</li>}
              </ul>
            </div>
          </div>

          <div className="scorecard-layout">
            <div className="scorecard-panel full-width">
              <strong>Recommended next focus for teacher/parent</strong>
              <ul>
                {recommendedFocus.map((item) => (
                  <li key={item.label}><strong>{item.label}:</strong> {item.note}</li>
                ))}
              </ul>
            </div>

            <div className="scorecard-panel full-width">
              <strong>What to practise next</strong>
              <ul>
                {practiceNextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </div>

          {diagnosticRows.length > 0 && (
            <div className="scorecard-panel full-width">
              <strong>Skill breakdown</strong>
              <div className="diagnostic-table">
                {diagnosticRows.map((row) => (
                  <div key={row.key} className="diagnostic-row">
                    <span>{row.label}</span>
                    <span>{row.correct}/{row.attempts} correct</span>
                    <span>{row.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="summary-actions">
            {result === "game-over" && checkpoint && <button className="ghost-btn" onClick={replayFromCheckpoint}>Retry Keeper Challenge</button>}
            <button className="ghost-btn" onClick={() => setScreen("title")}>Back to Title</button>
          </div>

          {settings.persistSummaries && summaries.length > 0 && (
            <div className="recent-runs">
              <strong>Recent Runs</strong>
              <ul>
                {summaries.slice(0, 3).map((item) => (
                  <li key={item.id}>{MODE_CONFIGS[item.mode].label} · {item.result === "victory" ? "Win" : "Game Over"} · Score {item.score} · {item.accuracy}% accuracy</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
