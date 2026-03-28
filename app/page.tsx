"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  type DifficultyMode,
  type LearnerLevel,
  type ParentSettings,
  type RunSummary,
  type StoredHighScores
} from "@/lib/game/quizPersistence";
import {
  MODE_CONFIG_FROM_CURRICULUM as MODE_CONFIGS,
  MODE_CURRICULUM_CLUSTERS,
  STAGE_CURRICULUM
} from "@/lib/game/curriculum";

type Boss = {
  id: "charlotte" | "george";
  name: string;
  avatarClass: string;
  colorClass: string;
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
};

type BattleState = {
  bossIndex: number;
  bossHp: number;
  playerHp: number;
  round: number;
  question: Question;
  feedback: string;
  phase: "quiz" | "boss-defeated";
  lastHit: "player" | "boss" | null;
  stats: BattleStats;
};

const BOSSES: Boss[] = [
  {
    id: "charlotte",
    name: "Moonlight Manticore Lyra",
    avatarClass: "avatar-charlotte",
    colorClass: "boss-charlotte",
    subtitle: "Sparkly Sky Manticore with Riddle Magic",
    taunts: {
      intro: "Twinkle-twist! My moon riddles will spin your brain!",
      hit: "Oh stars! You cracked my moon riddle!",
      attack: "Stardust spiral attack! Quick, use your maths power!",
      defeated: "My moon magic is fading... you outsmarted me!"
    }
  },
  {
    id: "george",
    name: "Starwhirl Kraken Orion",
    avatarClass: "avatar-george",
    colorClass: "boss-george",
    subtitle: "Gentle Sea Kraken Who Swirls Number Storms",
    taunts: {
      intro: "Splashy swirl! Time for tidal number magic!",
      hit: "Whoa! That answer calmed my wild tide!",
      attack: "Kraken whirl bash incoming!",
      defeated: "You win, hero. My sea storm is officially over!"
    }
  }
];


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

const withInputMode = (question: Omit<Question, "inputMode">, level: LearnerLevel): Question => {
  const typedAllowed = question.correct.length <= 16;
  if (typedAllowed && Math.random() < LEVEL_TUNING[level].typedChance) {
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

function createSpellingQuestion(config: ModeConfig, mode: DifficultyMode, level: LearnerLevel): Question {
  const word = pick(config.spellingWords);
  const tuning = LEVEL_TUNING[level];
  const variantPool = tuning.allowUnscramble ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4];
  const variant = pick(variantPool);

  if (variant === 0) {
    const blankIndex = Math.max(1, Math.min(word.length - 2, Math.floor(Math.random() * word.length)));
    const correct = word[blankIndex];
    const promptWord = `${word.slice(0, blankIndex)}_${word.slice(blankIndex + 1)}`;
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-missing-letter", prompt: `Letter detective! Fill the missing letter: ${promptWord}`, correct, options: uniqueOptions(correct, distractors) }, level);
  }

  if (variant === 1) {
    const correct = word[0];
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-beginning-sound", prompt: `Which letter starts "${word}"?`, correct, options: uniqueOptions(correct, distractors) }, level);
  }

  if (variant === 2) {
    const endingLength = mode === "comet" && word.length > 7 ? 4 : 2;
    const correct = word.slice(-endingLength);
    const stem = word.slice(0, -endingLength);
    const distractors = SPELLING_ENDINGS[mode].filter((x) => x !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-word-ending", prompt: `Word builder: complete ${stem}${"_".repeat(endingLength)}`, correct, options: uniqueOptions(correct, distractors) }, level);
  }

  if (variant === 3) {
    const letters = word.length;
    const distractors = [letters + 1, Math.max(2, letters - 1), letters + 2].map(String);
    return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-letter-count", prompt: `How many letters are in "${word}"?`, correct: String(letters), options: uniqueOptions(String(letters), distractors) }, level);
  }

  if (variant === 4) {
    const vowels = ["a", "e", "i", "o", "u"];
    const vowelIndex = word.split("").findIndex((char) => vowels.includes(char));
    if (vowelIndex > 0) {
      const correct = word[vowelIndex];
      const promptWord = `${word.slice(0, vowelIndex)}_${word.slice(vowelIndex + 1)}`;
      const distractors = vowels.filter((v) => v !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
      return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-vowel-sound", prompt: `Pick the vowel to finish this word: ${promptWord}`, correct, options: uniqueOptions(correct, distractors) }, level);
    }
  }

  const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");
  const distractors = config.spellingWords.filter((w) => w !== word).sort(() => Math.random() - 0.5).slice(0, 3);
  return withInputMode({ typeLabel: "Spelling", skillArea: "spelling-unscramble", prompt: `Unscramble this word: ${scrambled}`, correct: word, options: uniqueOptions(word, distractors) }, level);
}

function createMathQuestion(boss: Boss, config: ModeConfig, mode: DifficultyMode, level: LearnerLevel): Question {
  const tuning = LEVEL_TUNING[level];
  const max = Math.max(6, config.mathMax + tuning.mathShift);
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;

  if (mode !== "sprout" && Math.random() < tuning.multiplicationChance) {
    const base = Math.max(2, Math.floor(max / 2));
    const x = Math.floor(Math.random() * base) + 2;
    const y = Math.floor(Math.random() * (level === "expert" ? 8 : 6)) + 2;
    const result = x * y;
    const distractors = [result + y, Math.max(0, result - y), result + 2].map(String);
    return withInputMode({ typeLabel: "Maths", skillArea: "math-multiplication", prompt: `${boss.name} says: ${x} × ${y} = ?`, correct: String(result), options: uniqueOptions(String(result), distractors) }, level);
  }

  if (config.allowTwoStepMath && Math.random() < tuning.twoStepChance) {
    const c = Math.floor(Math.random() * Math.max(4, Math.floor(max / 2))) + 1;
    const plusFirst = Math.random() > 0.5;
    const result = plusFirst ? a + b - c : a + c - b;
    const prompt = plusFirst ? `Step quest: (${a} + ${b}) - ${c} = ?` : `Step quest: (${a} + ${c}) - ${b} = ?`;
    const distractors = [result + 1, Math.max(0, result - 2), result + 3].map(String);
    return withInputMode({ typeLabel: "Maths", skillArea: "math-two-step", prompt, correct: String(result), options: uniqueOptions(String(result), distractors) }, level);
  }

  if (Math.random() > 0.66) {
    const total = a + b;
    const missingLeft = Math.random() > 0.5;
    const prompt = missingLeft ? `? + ${b} = ${total}` : `${a} + ? = ${total}`;
    const correct = missingLeft ? a : b;
    const distractors = [correct + 1, Math.max(0, correct - 1), correct + 2].map(String);
    return withInputMode({ typeLabel: "Maths", skillArea: "math-missing-number", prompt, correct: String(correct), options: uniqueOptions(String(correct), distractors) }, level);
  }

  const usePlus = Math.random() > 0.35;
  const result = usePlus ? a + b : Math.max(0, a - Math.min(a, b));
  const prompt = usePlus ? `${a} + ${b} = ?` : `${a} - ${Math.min(a, b)} = ?`;
  const distractors = [result + 1, Math.max(0, result - 1), result + 2].map(String);
  return withInputMode({ typeLabel: "Maths", skillArea: "math-add-subtract", prompt, correct: String(result), options: uniqueOptions(String(result), distractors) }, level);
}

function createQuestion(boss: Boss, round: number, config: ModeConfig, mode: DifficultyMode, level: LearnerLevel): Question {
  return round % 2 === 0 ? createSpellingQuestion(config, mode, level) : createMathQuestion(boss, config, mode, level);
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

const initialStats = (): BattleStats => ({
  correctAnswers: 0,
  wrongAnswers: 0,
  timeoutAnswers: 0,
  spellingCorrect: 0,
  mathsCorrect: 0,
  bossesDefeated: 0,
  streak: 0,
  maxStreak: 0,
  skillProgress: createInitialSkillProgress()
});
const createInitialBattleState = (config: ModeConfig, mode: DifficultyMode, level: LearnerLevel): BattleState => ({
  bossIndex: 0,
  bossHp: config.bossMaxHp,
  playerHp: config.playerMaxHp,
  round: 0,
  question: createQuestion(BOSSES[0], 0, config, mode, level),
  feedback: `${BOSSES[0].name} appears! ${BOSSES[0].taunts.intro}`,
  phase: "quiz",
  lastHit: null,
  stats: initialStats()
});

const createBossCheckpoint = (bossIndex: number, mode: DifficultyMode, level: LearnerLevel, playerHp: number, stats: BattleStats): BattleState => {
  const cfg = MODE_CONFIGS[mode];
  const boss = BOSSES[bossIndex];
  return {
    bossIndex,
    bossHp: cfg.bossMaxHp,
    playerHp,
    round: 0,
    question: createQuestion(boss, 0, cfg, mode, level),
    feedback: `${boss.name} jumps in! ${boss.taunts.intro}`,
    phase: "quiz",
    lastHit: null,
    stats
  };
};

type Screen = "title" | "battle" | "summary";

let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
};

const blip = (freq: number, duration: number, type: OscillatorType, volume = 0.05) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
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

function buildCorrectFeedback(boss: Boss, question: Question, hpAfterHit: number, config: ModeConfig) {
  const tip = question.typeLabel === "Spelling"
    ? "Spelling tip: say each sound slowly, then blend the word."
    : "Maths tip: do one quick check in your head before tapping.";
  const bossLine = hpAfterHit <= config.correctDamage && boss.taunts.lowHp ? boss.taunts.lowHp : boss.taunts.hit;
  return `${pickLine(COACH_PRAISE)} ${bossLine} ${tip}`;
}

function buildWrongFeedback(boss: Boss, question: Question) {
  const learning = question.typeLabel === "Spelling"
    ? `Correct answer: ${question.correct}. Look for vowel sounds and word chunks.`
    : `Correct answer: ${question.correct}. Break the sum into smaller steps.`;
  return `${pickLine(COACH_RETRY)} ${boss.taunts.attack} ${learning}`;
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

  return {
    settings: initialSettings,
    mode: initialMode,
    level: initialLevel,
    ageBand: MODE_TO_AGE[initialMode],
    highScores: loadHighScores(),
    summaries: loadRunSummaries(),
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

  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<DifficultyMode>(initial.mode);
  const [ageBand, setAgeBand] = useState<AgeBand>(initial.ageBand);
  const [level, setLevel] = useState<LearnerLevel>(initial.level);
  const [settings, setSettings] = useState<ParentSettings>(initial.settings);
  const [highScores, setHighScores] = useState<StoredHighScores>(initial.highScores);
  const [summaries, setSummaries] = useState<RunSummary[]>(initial.summaries);
  const [resumeRun, setResumeRun] = useState<{ mode: DifficultyMode; level: LearnerLevel; battle: BattleState; checkpoint: BattleState | null } | null>(initial.resumeRun);

  const [battle, setBattle] = useState<BattleState>(initial.battle);
  const [checkpoint, setCheckpoint] = useState<BattleState | null>(initial.checkpoint);
  const [attackMode, setAttackMode] = useState<"none" | "hero" | "boss">("none");
  const [damagePop, setDamagePop] = useState<{ target: "boss" | "player"; amount: number } | null>(null);
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>("");
  const [result, setResult] = useState<"victory" | "game-over" | null>(null);
  const [voiceLine, setVoiceLine] = useState<string>("Pick a mode and begin your bright quiz quest!");
  const handledTimeoutKeyRef = useRef<string | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);
  const [timeoutFlash, setTimeoutFlash] = useState<boolean>(false);

  const config = MODE_CONFIGS[mode];
  const currentBoss = BOSSES[battle.bossIndex];

  const score = useMemo(() => {
    const defeated = battle.stats.bossesDefeated * 220;
    const correctScore = battle.stats.correctAnswers * 70;
    const streakBonus = battle.stats.maxStreak * 25;
    const hpBonus = Math.floor((battle.playerHp / config.playerMaxHp) * 100);
    return defeated + correctScore + streakBonus + hpBonus;
  }, [battle.playerHp, battle.stats, config.playerMaxHp]);

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
  const timerUrgent = questionTimeLeft <= 15;
  const timerCritical = questionTimeLeft <= 7;

  useEffect(() => {
    if (settings.persistDifficulty) {
      savePreferredMode(mode);
      savePreferredLevel(level);
    }
  }, [mode, level, settings.persistDifficulty]);

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

  const resetQuestionTimer = () => {
    handledTimeoutKeyRef.current = null;
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setTimeoutFlash(false);
  };

  const speak = (line: string, cue: "start" | "correct" | "wrong" | "bossDown" | "victory") => {
    setVoiceLine(line);
    speakCue(cue);
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
      maxStreak: finalBattle.stats.maxStreak
    };
    const next = [entry, ...summaries].slice(0, 8);
    setSummaries(next);
    saveRunSummaries(next);
  };

  const startGame = () => {
    const freshBattle = createInitialBattleState(config, mode, level);
    const freshCheckpoint = createInitialBattleState(config, mode, level);
    setBattle(freshBattle);
    setCheckpoint(freshCheckpoint);
    setAttackMode("none");
    setDamagePop(null);
    setTypedAnswer("");
    setPhaseBanner("Battle Start!");
    resetQuestionTimer();
    setResult(null);
    setScreen("battle");
    if (settings.persistProgress) {
      persistRunProgress(freshBattle, freshCheckpoint, mode, level);
    }
    speak(`${config.label} mode ready for ${LEVEL_TUNING[level].label} learners. ${BOSSES[0].name} is entering the arena!`, "start");
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
    setPhaseBanner("Retry Boss");
    setTypedAnswer("");
    setAttackMode("none");
    setDamagePop(null);
    resetQuestionTimer();
    if (settings.persistProgress) {
      persistRunProgress(checkpoint, checkpoint, mode, level);
    }
    speak("Checkpoint loaded. Try that boss again!", "start");
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

    if (settings.persistProgress) {
      clearProgress();
      setResumeRun(null);
    }

    if (runResult === "victory") {
      speak("Legendary win! Every boss cleared.", "victory");
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
    const newPlayerHp = Math.max(0, battle.playerHp - config.wrongDamage);
    const timeoutFeedback = `${currentBoss.taunts.attack} ⏰ Time out! Correct answer: ${battle.question.correct}.`;
    setAttackMode("boss");
    setDamagePop({ target: "player", amount: config.wrongDamage });
    if (isTimeout) {
      setQuestionTimeLeft(-1);
      setTimeoutFlash(true);
      setPhaseBanner("Time Up!");
    }

    if (newPlayerHp <= 0) {
      const defeatedBattle: BattleState = {
        ...battle,
        playerHp: 0,
        feedback: isTimeout ? timeoutFeedback : buildWrongFeedback(currentBoss, battle.question),
        lastHit: "player",
        stats: {
          ...bumpSkillProgress(battle.stats, battle.question.skillArea, false),
          wrongAnswers: battle.stats.wrongAnswers + 1,
          timeoutAnswers: battle.stats.timeoutAnswers + (isTimeout ? 1 : 0),
          streak: 0
        }
      };
      setBattle(defeatedBattle);
      finishRun("game-over", defeatedBattle);
      return;
    }

    const nextRound = battle.round + 1;
    const nextBattle: BattleState = {
      ...battle,
      playerHp: newPlayerHp,
      round: nextRound,
      question: createQuestion(currentBoss, nextRound, config, mode, level),
      feedback: isTimeout ? timeoutFeedback : buildWrongFeedback(currentBoss, battle.question),
      lastHit: "player",
      stats: {
        ...bumpSkillProgress(battle.stats, battle.question.skillArea, false),
        wrongAnswers: battle.stats.wrongAnswers + 1,
        timeoutAnswers: battle.stats.timeoutAnswers + (isTimeout ? 1 : 0),
        streak: 0
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

    if (isCorrect) {
      const newBossHp = Math.max(0, battle.bossHp - config.correctDamage);
      setAttackMode("hero");
      setDamagePop({ target: "boss", amount: config.correctDamage });
      setPhaseBanner(battle.stats.streak + 1 >= 3 ? `Combo x${battle.stats.streak + 1}!` : "Direct Hit!");

      if (newBossHp <= 0) {
        const defeatedBattle: BattleState = {
          ...battle,
          bossHp: 0,
          round: nextRound,
          feedback: `${currentBoss.taunts.defeated} ${battle.question.typeLabel === "Spelling" ? "You used awesome word power!" : "Your maths power-up was perfect!"}`,
          phase: "boss-defeated",
          lastHit: "boss",
          stats: {
            ...bumpSkillProgress(battle.stats, battle.question.skillArea, true),
            correctAnswers: battle.stats.correctAnswers + 1,
            spellingCorrect: battle.stats.spellingCorrect + (battle.question.typeLabel === "Spelling" ? 1 : 0),
            mathsCorrect: battle.stats.mathsCorrect + (battle.question.typeLabel === "Maths" ? 1 : 0),
            bossesDefeated: battle.stats.bossesDefeated + 1,
            streak: battle.stats.streak + 1,
            maxStreak: Math.max(battle.stats.maxStreak, battle.stats.streak + 1)
          }
        };
        setBattle(defeatedBattle);
        setPhaseBanner("Boss Defeated!");
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
        question: createQuestion(currentBoss, nextRound, config, mode, level),
        feedback: buildCorrectFeedback(currentBoss, battle.question, newBossHp, config),
        lastHit: "boss",
        stats: {
          ...bumpSkillProgress(battle.stats, battle.question.skillArea, true),
          correctAnswers: battle.stats.correctAnswers + 1,
          spellingCorrect: battle.stats.spellingCorrect + (battle.question.typeLabel === "Spelling" ? 1 : 0),
          mathsCorrect: battle.stats.mathsCorrect + (battle.question.typeLabel === "Maths" ? 1 : 0),
          streak: battle.stats.streak + 1,
          maxStreak: Math.max(battle.stats.maxStreak, battle.stats.streak + 1)
        }
      };
      resetQuestionTimer();
      setBattle(nextBattle);
      if (settings.persistProgress) {
        persistRunProgress(nextBattle, checkpoint, mode, level);
      }
      speak("Correct answer. Spark strike launched!", "correct");
      return;
    }

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
    <main className="page-wrap">
      <section className="card title-card">
        <div className="title-hero">
          <span className="title-kicker">✨ Kid Quest Arena ✨</span>
          <h1>Marmalade: Mythic Monster Quiz Showdown</h1>
          <p>Bright battle arena with illustrated heroes, voice cues, and kid-friendly mythic monster adventures.</p>
          <div className="title-badges" aria-hidden>
            <span>🎨 Storybook Art</span>
            <span>🧠 Spelling + Maths</span>
            <span>🏆 Boss Battles</span>
          </div>
        </div>
      </section>

      <section className="card voice-card" aria-live="polite">
        <strong>Coach Comet says:</strong>
        <p>{voiceLine}</p>
      </section>

      {screen === "title" && (
        <section className="card center-stack">
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
            {BOSSES.map((boss) => (
              <div key={boss.id} className={`boss-preview ${boss.colorClass}`}>
                <div className={`boss-portrait ${boss.avatarClass}`} aria-hidden>
                  <div className="shape body" /><div className="shape head" /><div className="shape eye left" /><div className="shape eye right" /><div className="shape flare" />
                </div>
                <strong>{boss.name}</strong>
                <span>{boss.subtitle}</span>
                <small>“{boss.taunts.intro}”</small>
              </div>
            ))}
          </div>
          <button className="big-btn" onClick={startGame}>Start Adventure</button>
        </section>
      )}

      {screen === "battle" && (
        <section className={`card battle-card ${currentBoss.colorClass} ${battle.lastHit === "player" ? "danger-flash" : battle.lastHit === "boss" ? "win-flash" : ""} ${attackMode === "boss" ? "screen-shake" : ""} ${attackMode === "hero" ? "hero-zoom" : ""} ${timeoutFlash ? "timeout-blast" : ""}`}>
          {phaseBanner && <div className="phase-banner">{phaseBanner}</div>}
          <div className={`impact-overlay ${attackMode === "hero" ? "hero" : attackMode === "boss" ? "boss" : ""}`} aria-hidden />

          <div className="hud-row">
            <div className="hud-box"><strong>Hero HP {battle.playerHp}/{config.playerMaxHp}</strong><div className="bar"><span style={{ width: `${(battle.playerHp / config.playerMaxHp) * 100}%` }} /></div></div>
            <div className="hud-box"><strong>{currentBoss.name} HP {battle.bossHp}/{config.bossMaxHp}</strong><div className="bar enemy"><span style={{ width: `${(battle.bossHp / config.bossMaxHp) * 100}%` }} /></div></div>
          </div>

          <div className="battle-stage">
            <div className="versus-badge" aria-hidden>VS</div>
            <div className={`hero-sprite ${attackMode === "hero" ? "hero-attack" : ""} ${attackMode === "boss" ? "hero-hurt" : ""}`}>
              <div className="hero-portrait" aria-hidden>
                <div className="shape cape" /><div className="shape body" /><div className="shape head" /><div className="shape eye left" /><div className="shape eye right" /><div className="shape wand" />
              </div>
              <div className="sprite-label">You</div>
              {damagePop?.target === "player" && <div className="damage-pop">-{damagePop.amount}</div>}
            </div>

            <div className="projectile-lane" aria-hidden>
              {attackMode === "hero" && <div className="projectile hero-shot" />}
              {attackMode === "boss" && <div className="projectile boss-shot" />}
              {attackMode === "hero" && <div className="impact-burst right" />}
              {attackMode === "boss" && <div className="impact-burst left" />}
            </div>

            <div className={`boss-sprite ${attackMode === "boss" ? "boss-attack" : ""} ${attackMode === "hero" ? "boss-hurt" : ""}`}>
              <div className={`boss-portrait large ${currentBoss.avatarClass}`} aria-hidden>
                <div className="shape body" /><div className="shape head" /><div className="shape eye left" /><div className="shape eye right" /><div className="shape flare" />
              </div>
              <div className="sprite-label">{currentBoss.name}</div>
              {damagePop?.target === "boss" && <div className="damage-pop">-{damagePop.amount}</div>}
            </div>
          </div>

          <div className="boss-stage">
            <div>
              <h2>{currentBoss.name}</h2>
              <p>{currentBoss.subtitle}</p>
              <p className="feedback">{battle.feedback}</p>
            </div>
            <div className="score">Score {score}</div>
          </div>

          {battle.phase === "quiz" ? (
            <div className="quiz-panel" role="group" aria-label={`${battle.question.typeLabel} question`}>
              <div className="question-header">
                <div className="question-type">{battle.question.typeLabel} Challenge · {battle.question.inputMode === "typed" ? "Type" : "Pick one"}</div>
                <div className="question-count">Question {battle.round + 1}</div>
              </div>
              <div className={`question-timer ${timerUrgent ? "urgent" : ""} ${timerCritical ? "critical" : ""}`} role="timer" aria-live="assertive" aria-label={`Time left: ${Math.max(0, questionTimeLeft)} seconds`}>
                <div className="timer-top-row">
                  <strong>⏱️ {Math.max(0, questionTimeLeft)}s</strong>
                  <span>{timerCritical ? "HURRY!" : timerUrgent ? "Quick answer" : "60-second challenge"}</span>
                </div>
                <div className="timer-track"><span style={{ width: `${timerPercent}%` }} /></div>
              </div>
              <h3>{battle.question.prompt}</h3>
              {battle.question.inputMode === "choice" ? (
                <>
                  <p className="question-hint" aria-hidden>Tap one big answer button below:</p>
                  <div className="options-grid">
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
                </>
              ) : (
                <form
                  className="typed-answer-form"
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
                  <button type="submit" className="big-btn">Submit Answer</button>
                </form>
              )}
            </div>
          ) : (
            <div className="center-stack">
              <h3>{currentBoss.name} is down!</h3>
              <button className="big-btn" onClick={nextBoss}>{battle.bossIndex < BOSSES.length - 1 ? "Next Boss" : "Finish Adventure"}</button>
            </div>
          )}
        </section>
      )}

      {screen === "summary" && (
        <section className="card center-stack end-card celebration summary-card">
          <h2>{result === "victory" ? "Learning Victory" : "Learning Summary"}</h2>
          <p>{scorecardHeadline} {config.label} mode · {config.ageBand} · {LEVEL_TUNING[level].label} track.</p>
          <p>Mode high score: {highScores[mode] ?? 0}</p>
          <div className="summary-grid">
            <div><strong>Score</strong><span>{score}</span></div>
            <div><strong>Accuracy</strong><span>{accuracy}%</span></div>
            <div><strong>Correct</strong><span>{battle.stats.correctAnswers}</span></div>
            <div><strong>Mistakes</strong><span>{battle.stats.wrongAnswers}</span></div>
            <div><strong>Timeouts</strong><span>{timeoutAnswers}</span></div>
            <div><strong>Spelling wins</strong><span>{battle.stats.spellingCorrect}</span></div>
            <div><strong>Maths wins</strong><span>{battle.stats.mathsCorrect}</span></div>
            <div><strong>Bosses defeated</strong><span>{battle.stats.bossesDefeated}/{BOSSES.length}</span></div>
            <div><strong>Best streak</strong><span>{battle.stats.maxStreak}</span></div>
          </div>
          <p className="level-badge">{learningLevel}</p>

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
            <button className="big-btn" onClick={startGame}>Replay Same Mode</button>
            {result === "game-over" && checkpoint && <button className="ghost-btn" onClick={replayFromCheckpoint}>Retry Last Boss</button>}
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
