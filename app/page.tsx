"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PARENT_SETTINGS,
  clearHighScores,
  clearPreferredMode,
  clearProgress,
  clearRunSummaries,
  loadHighScores,
  loadParentSettings,
  loadPreferredMode,
  loadProgress,
  loadRunSummaries,
  saveHighScores,
  saveParentSettings,
  savePreferredMode,
  saveProgress,
  saveRunSummaries,
  currentTimestamp,
  createRunId,
  type DifficultyMode,
  type ParentSettings,
  type RunSummary,
  type StoredHighScores
} from "@/lib/game/quizPersistence";

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

type Question = {
  prompt: string;
  typeLabel: "Spelling" | "Maths";
  options: string[];
  correct: string;
};

type BattleStats = {
  correctAnswers: number;
  wrongAnswers: number;
  spellingCorrect: number;
  mathsCorrect: number;
  bossesDefeated: number;
  streak: number;
  maxStreak: number;
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
    name: "Charlotte",
    avatarClass: "avatar-charlotte",
    colorClass: "boss-charlotte",
    subtitle: "Sparkle Dragon Queen of Tricky Brain Quests",
    taunts: {
      intro: "Kneel before my puzzle crown!",
      hit: "What?! You cracked my royal riddle!",
      attack: "Royal fireball! Mind your maths!",
      defeated: "My crown... outsmarted by a tiny legend!"
    }
  },
  {
    id: "george",
    name: "George",
    avatarClass: "avatar-george",
    colorClass: "boss-george",
    subtitle: "Goofy Dino Captain of Number Nonsense",
    taunts: {
      intro: "RAWR! I attack with silly sums!",
      hit: "Whoa! That answer bonked my snout!",
      attack: "Dino boing-bash incoming!",
      defeated: "Okay okay, you win... can we be pals?"
    }
  }
];

const SPELLING_SETS: Record<DifficultyMode, string[]> = {
  sprout: [
    "cat", "sun", "hat", "fish", "cake", "star", "book", "frog", "smile", "apple",
    "moon", "nest", "lamp", "train", "cloud", "grape", "bread", "chair", "plant", "tiger",
    "beach", "truck", "sheep", "green"
  ],
  spark: [
    "planet", "pencil", "puzzle", "rocket", "dragon", "jungle", "castle", "thunder", "school", "artist",
    "window", "bridge", "garden", "library", "magnet", "blanket", "picture", "kitchen", "harvest", "whisper",
    "bicycle", "captain", "marble", "forest"
  ],
  comet: [
    "adventure", "chocolate", "mountain", "treasure", "triangle", "notebook", "microscope", "elephant", "rainbow", "crocodile",
    "astronaut", "dinosaur", "happiness", "volcano", "diamond", "calendar", "geometry", "algorithm", "satellite", "champion",
    "festival", "landscape", "hurricane", "knowledge"
  ]
};

const MODE_CONFIGS: Record<DifficultyMode, ModeConfig> = {
  sprout: {
    label: "Sprout",
    ageBand: "Ages 4-6",
    subtitle: "Gentle mode: easier words + basic sums",
    playerMaxHp: 120,
    bossMaxHp: 90,
    correctDamage: 22,
    wrongDamage: 11,
    mathMax: 10,
    allowTwoStepMath: false,
    spellingWords: SPELLING_SETS.sprout
  },
  spark: {
    label: "Spark",
    ageBand: "Ages 7-9",
    subtitle: "Balanced mode: bigger words + mixed arithmetic",
    playerMaxHp: 100,
    bossMaxHp: 105,
    correctDamage: 20,
    wrongDamage: 14,
    mathMax: 16,
    allowTwoStepMath: true,
    spellingWords: SPELLING_SETS.spark
  },
  comet: {
    label: "Comet",
    ageBand: "Ages 10+",
    subtitle: "Challenge mode: tougher words + multi-step maths",
    playerMaxHp: 92,
    bossMaxHp: 120,
    correctDamage: 18,
    wrongDamage: 17,
    mathMax: 22,
    allowTwoStepMath: true,
    spellingWords: SPELLING_SETS.comet
  }
};

const MODE_DECOR: Record<DifficultyMode, { icon: string; badge: string }> = {
  sprout: { icon: "🌱", badge: "Gentle Start" },
  spark: { icon: "⚡", badge: "Balanced Quest" },
  comet: { icon: "☄️", badge: "Big Brain Mode" }
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

function createSpellingQuestion(config: ModeConfig, mode: DifficultyMode): Question {
  const word = pick(config.spellingWords);
  const variant = Math.floor(Math.random() * 6);

  if (variant === 0) {
    const blankIndex = Math.max(1, Math.min(word.length - 2, Math.floor(Math.random() * word.length)));
    const correct = word[blankIndex];
    const promptWord = `${word.slice(0, blankIndex)}_${word.slice(blankIndex + 1)}`;
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return { typeLabel: "Spelling", prompt: `Letter detective! Fill the missing letter: ${promptWord}`, correct, options: uniqueOptions(correct, distractors) };
  }

  if (variant === 1) {
    const correct = word[0];
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return { typeLabel: "Spelling", prompt: `Which letter starts "${word}"?`, correct, options: uniqueOptions(correct, distractors) };
  }

  if (variant === 2) {
    const endingLength = mode === "comet" && word.length > 7 ? 4 : 2;
    const correct = word.slice(-endingLength);
    const stem = word.slice(0, -endingLength);
    const distractors = SPELLING_ENDINGS[mode].filter((x) => x !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return { typeLabel: "Spelling", prompt: `Word builder: complete ${stem}${"_".repeat(endingLength)}`, correct, options: uniqueOptions(correct, distractors) };
  }

  if (variant === 3) {
    const letters = word.length;
    const distractors = [letters + 1, Math.max(2, letters - 1), letters + 2].map(String);
    return { typeLabel: "Spelling", prompt: `How many letters are in "${word}"?`, correct: String(letters), options: uniqueOptions(String(letters), distractors) };
  }

  if (variant === 4) {
    const vowels = ["a", "e", "i", "o", "u"];
    const vowelIndex = word.split("").findIndex((char) => vowels.includes(char));
    if (vowelIndex > 0) {
      const correct = word[vowelIndex];
      const promptWord = `${word.slice(0, vowelIndex)}_${word.slice(vowelIndex + 1)}`;
      const distractors = vowels.filter((v) => v !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
      return { typeLabel: "Spelling", prompt: `Pick the vowel to finish this word: ${promptWord}`, correct, options: uniqueOptions(correct, distractors) };
    }
  }

  const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");
  const distractors = config.spellingWords.filter((w) => w !== word).sort(() => Math.random() - 0.5).slice(0, 3);
  return { typeLabel: "Spelling", prompt: `Unscramble this word: ${scrambled}`, correct: word, options: uniqueOptions(word, distractors) };
}

function createMathQuestion(boss: Boss, config: ModeConfig, mode: DifficultyMode): Question {
  const max = config.mathMax;
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;

  if (mode !== "sprout" && Math.random() > 0.68) {
    const base = Math.max(2, Math.floor(max / 2));
    const x = Math.floor(Math.random() * base) + 2;
    const y = Math.floor(Math.random() * 6) + 2;
    const result = x * y;
    const distractors = [result + y, Math.max(0, result - y), result + 2].map(String);
    return { typeLabel: "Maths", prompt: `${boss.name} says: ${x} × ${y} = ?`, correct: String(result), options: uniqueOptions(String(result), distractors) };
  }

  if (config.allowTwoStepMath && Math.random() > 0.55) {
    const c = Math.floor(Math.random() * Math.max(4, Math.floor(max / 2))) + 1;
    const plusFirst = Math.random() > 0.5;
    const result = plusFirst ? a + b - c : a + c - b;
    const prompt = plusFirst ? `Step quest: (${a} + ${b}) - ${c} = ?` : `Step quest: (${a} + ${c}) - ${b} = ?`;
    const distractors = [result + 1, Math.max(0, result - 2), result + 3].map(String);
    return { typeLabel: "Maths", prompt, correct: String(result), options: uniqueOptions(String(result), distractors) };
  }

  if (Math.random() > 0.66) {
    const total = a + b;
    const missingLeft = Math.random() > 0.5;
    const prompt = missingLeft ? `? + ${b} = ${total}` : `${a} + ? = ${total}`;
    const correct = missingLeft ? a : b;
    const distractors = [correct + 1, Math.max(0, correct - 1), correct + 2].map(String);
    return { typeLabel: "Maths", prompt, correct: String(correct), options: uniqueOptions(String(correct), distractors) };
  }

  const usePlus = Math.random() > 0.35;
  const result = usePlus ? a + b : Math.max(0, a - Math.min(a, b));
  const prompt = usePlus ? `${a} + ${b} = ?` : `${a} - ${Math.min(a, b)} = ?`;
  const distractors = [result + 1, Math.max(0, result - 1), result + 2].map(String);
  return { typeLabel: "Maths", prompt, correct: String(result), options: uniqueOptions(String(result), distractors) };
}

function createQuestion(boss: Boss, round: number, config: ModeConfig, mode: DifficultyMode): Question {
  return round % 2 === 0 ? createSpellingQuestion(config, mode) : createMathQuestion(boss, config, mode);
}

const initialStats = (): BattleStats => ({ correctAnswers: 0, wrongAnswers: 0, spellingCorrect: 0, mathsCorrect: 0, bossesDefeated: 0, streak: 0, maxStreak: 0 });
const createInitialBattleState = (config: ModeConfig, mode: DifficultyMode): BattleState => ({
  bossIndex: 0,
  bossHp: config.bossMaxHp,
  playerHp: config.playerMaxHp,
  round: 0,
  question: createQuestion(BOSSES[0], 0, config, mode),
  feedback: `Charlotte appears! ${BOSSES[0].taunts.intro}`,
  phase: "quiz",
  lastHit: null,
  stats: initialStats()
});

const createBossCheckpoint = (bossIndex: number, mode: DifficultyMode, playerHp: number, stats: BattleStats): BattleState => {
  const cfg = MODE_CONFIGS[mode];
  const boss = BOSSES[bossIndex];
  return {
    bossIndex,
    bossHp: cfg.bossMaxHp,
    playerHp,
    round: 0,
    question: createQuestion(boss, 0, cfg, mode),
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

const getInitialState = () => {
  const initialSettings = loadParentSettings();
  const preferredMode = loadPreferredMode();
  const initialMode: DifficultyMode = initialSettings.persistDifficulty && preferredMode ? preferredMode : "spark";
  const initialBattle = createInitialBattleState(MODE_CONFIGS[initialMode], initialMode);
  const storedProgress = initialSettings.persistProgress ? loadProgress<BattleState>() : null;
  const validProgress = storedProgress && (storedProgress.mode === "sprout" || storedProgress.mode === "spark" || storedProgress.mode === "comet")
    ? storedProgress
    : null;

  return {
    settings: initialSettings,
    mode: initialMode,
    highScores: loadHighScores(),
    summaries: loadRunSummaries(),
    battle: initialBattle,
    checkpoint: initialBattle,
    resumeRun: validProgress
      ? { mode: validProgress.mode, battle: validProgress.battle, checkpoint: validProgress.checkpoint }
      : null
  };
};

export default function Page() {
  const [initial] = useState(() => getInitialState());

  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<DifficultyMode>(initial.mode);
  const [settings, setSettings] = useState<ParentSettings>(initial.settings);
  const [highScores, setHighScores] = useState<StoredHighScores>(initial.highScores);
  const [summaries, setSummaries] = useState<RunSummary[]>(initial.summaries);
  const [resumeRun, setResumeRun] = useState<{ mode: DifficultyMode; battle: BattleState; checkpoint: BattleState | null } | null>(initial.resumeRun);

  const [battle, setBattle] = useState<BattleState>(initial.battle);
  const [checkpoint, setCheckpoint] = useState<BattleState | null>(initial.checkpoint);
  const [attackMode, setAttackMode] = useState<"none" | "hero" | "boss">("none");
  const [damagePop, setDamagePop] = useState<{ target: "boss" | "player"; amount: number } | null>(null);
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);
  const [result, setResult] = useState<"victory" | "game-over" | null>(null);
  const [voiceLine, setVoiceLine] = useState<string>("Pick a mode and begin your bright quiz quest!");

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
  const learningLevel = accuracy >= 85 ? "Super Scholar" : accuracy >= 70 ? "Rising Rocket" : "Brave Learner";

  useEffect(() => {
    if (settings.persistDifficulty) {
      savePreferredMode(mode);
    }
  }, [mode, settings.persistDifficulty]);

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

  const persistRunProgress = (nextBattle: BattleState, nextCheckpoint: BattleState | null, nextMode: DifficultyMode) => {
    if (!settings.persistProgress) return;
    saveProgress<BattleState>({ mode: nextMode, battle: nextBattle, checkpoint: nextCheckpoint, savedAt: currentTimestamp() });
    setResumeRun({ mode: nextMode, battle: nextBattle, checkpoint: nextCheckpoint });
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
    const freshBattle = createInitialBattleState(config, mode);
    const freshCheckpoint = createInitialBattleState(config, mode);
    setBattle(freshBattle);
    setCheckpoint(freshCheckpoint);
    setAttackMode("none");
    setDamagePop(null);
    setPhaseBanner("Battle Start!");
    setResult(null);
    setScreen("battle");
    if (settings.persistProgress) {
      persistRunProgress(freshBattle, freshCheckpoint, mode);
    }
    speak(`${config.label} mode ready. ${BOSSES[0].name} is entering the arena!`, "start");
  };

  const resumeAdventure = () => {
    if (!resumeRun) return;
    setMode(resumeRun.mode);
    setBattle(resumeRun.battle);
    setCheckpoint(resumeRun.checkpoint);
    setResult(null);
    setScreen("battle");
    setPhaseBanner("Adventure Resumed");
    setAttackMode("none");
    setDamagePop(null);
    speak("Welcome back. Resuming your last adventure.", "start");
  };

  const replayFromCheckpoint = () => {
    if (!checkpoint) return;
    setBattle(checkpoint);
    setResult(null);
    setScreen("battle");
    setPhaseBanner("Retry Boss");
    setAttackMode("none");
    setDamagePop(null);
    if (settings.persistProgress) {
      persistRunProgress(checkpoint, checkpoint, mode);
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
    const nextBattle = createBossCheckpoint(nextIndex, mode, battle.playerHp, nextStats);
    const nextCheckpoint = nextBattle;

    setBattle(nextBattle);
    setCheckpoint(nextCheckpoint);
    setAttackMode("none");
    setDamagePop(null);
    setPhaseBanner(`${next.name} Enters!`);
    if (settings.persistProgress) {
      persistRunProgress(nextBattle, nextCheckpoint, mode);
    }
    speak(`${next.name} is now on stage. Keep your streak alive!`, "start");
  };

  const answer = (choice: string) => {
    if (screen !== "battle" || battle.phase !== "quiz") return;

    const isCorrect = choice === battle.question.correct;
    const nextRound = battle.round + 1;

    if (isCorrect) {
      const newBossHp = Math.max(0, battle.bossHp - config.correctDamage);
      setAttackMode("hero");
      setDamagePop({ target: "boss", amount: config.correctDamage });

      if (newBossHp <= 0) {
        const defeatedBattle: BattleState = {
          ...battle,
          bossHp: 0,
          round: nextRound,
          feedback: `${currentBoss.taunts.defeated} ${battle.question.typeLabel === "Spelling" ? "You used awesome word power!" : "Your maths power-up was perfect!"}`,
          phase: "boss-defeated",
          lastHit: "boss",
          stats: {
            ...battle.stats,
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
          persistRunProgress(defeatedBattle, checkpoint, mode);
        }
        speak(`${currentBoss.name} has been defeated. Brilliant work!`, "bossDown");
        return;
      }

      const nextBattle: BattleState = {
        ...battle,
        bossHp: newBossHp,
        round: nextRound,
        question: createQuestion(currentBoss, nextRound, config, mode),
        feedback: buildCorrectFeedback(currentBoss, battle.question, newBossHp, config),
        lastHit: "boss",
        stats: {
          ...battle.stats,
          correctAnswers: battle.stats.correctAnswers + 1,
          spellingCorrect: battle.stats.spellingCorrect + (battle.question.typeLabel === "Spelling" ? 1 : 0),
          mathsCorrect: battle.stats.mathsCorrect + (battle.question.typeLabel === "Maths" ? 1 : 0),
          streak: battle.stats.streak + 1,
          maxStreak: Math.max(battle.stats.maxStreak, battle.stats.streak + 1)
        }
      };
      setBattle(nextBattle);
      if (settings.persistProgress) {
        persistRunProgress(nextBattle, checkpoint, mode);
      }
      speak("Correct answer. Spark strike launched!", "correct");
      return;
    }

    const newPlayerHp = Math.max(0, battle.playerHp - config.wrongDamage);
    setAttackMode("boss");
    setDamagePop({ target: "player", amount: config.wrongDamage });

    if (newPlayerHp <= 0) {
      const defeatedBattle: BattleState = {
        ...battle,
        playerHp: 0,
        feedback: buildWrongFeedback(currentBoss, battle.question),
        lastHit: "player",
        stats: {
          ...battle.stats,
          wrongAnswers: battle.stats.wrongAnswers + 1,
          streak: 0
        }
      };
      setBattle(defeatedBattle);
      finishRun("game-over", defeatedBattle);
      return;
    }

    const nextBattle: BattleState = {
      ...battle,
      playerHp: newPlayerHp,
      round: nextRound,
      question: createQuestion(currentBoss, nextRound, config, mode),
      feedback: buildWrongFeedback(currentBoss, battle.question),
      lastHit: "player",
      stats: {
        ...battle.stats,
        wrongAnswers: battle.stats.wrongAnswers + 1,
        streak: 0
      }
    };
    setBattle(nextBattle);
    if (settings.persistProgress) {
      persistRunProgress(nextBattle, checkpoint, mode);
    }
    speak("Almost there. Try the next one!", "wrong");
  };

  return (
    <main className="page-wrap">
      <section className="card title-card">
        <div className="title-hero">
          <span className="title-kicker">✨ Kid Quest Arena ✨</span>
          <h1>Marmalade: Quiz Boss Battle</h1>
          <p>Bright battle arena with illustrated heroes, voice cues, and age-based challenge modes.</p>
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
            <button className="ghost-btn" onClick={resumeAdventure}>Resume Saved Adventure ({MODE_CONFIGS[resumeRun.mode].label})</button>
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
        <section className={`card battle-card ${currentBoss.colorClass} ${battle.lastHit === "player" ? "danger-flash" : battle.lastHit === "boss" ? "win-flash" : ""} ${attackMode === "boss" ? "screen-shake" : ""}`}>
          {phaseBanner && <div className="phase-banner">{phaseBanner}</div>}

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
            <div className="quiz-panel">
              <div className="question-type">{battle.question.typeLabel} Challenge</div>
              <h3>{battle.question.prompt}</h3>
              <div className="options-grid">
                {battle.question.options.map((option) => (
                  <button key={option} className="answer-btn" onClick={() => answer(option)}>{option}</button>
                ))}
              </div>
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
          <p>Mode: {config.label} ({config.ageBand})</p>
          <p>Mode high score: {highScores[mode] ?? 0}</p>
          <div className="summary-grid">
            <div><strong>Score</strong><span>{score}</span></div>
            <div><strong>Accuracy</strong><span>{accuracy}%</span></div>
            <div><strong>Correct</strong><span>{battle.stats.correctAnswers}</span></div>
            <div><strong>Mistakes</strong><span>{battle.stats.wrongAnswers}</span></div>
            <div><strong>Spelling wins</strong><span>{battle.stats.spellingCorrect}</span></div>
            <div><strong>Maths wins</strong><span>{battle.stats.mathsCorrect}</span></div>
            <div><strong>Bosses defeated</strong><span>{battle.stats.bossesDefeated}/{BOSSES.length}</span></div>
            <div><strong>Best streak</strong><span>{battle.stats.maxStreak}</span></div>
          </div>
          <p className="level-badge">{learningLevel}</p>
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
