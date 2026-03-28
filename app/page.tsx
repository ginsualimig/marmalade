"use client";

import { useEffect, useMemo, useState } from "react";

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
  };
};

type DifficultyMode = "sprout" | "spark" | "comet";

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
  sprout: ["cat", "sun", "hat", "fish", "cake", "star", "book", "frog", "smile", "apple"],
  spark: ["planet", "pencil", "puzzle", "rocket", "dragon", "jungle", "castle", "thunder", "school", "artist"],
  comet: ["adventure", "chocolate", "mountain", "treasure", "triangle", "notebook", "microscope", "elephant", "rainbow", "crocodile"]
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

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const uniqueOptions = (correct: string, distractors: string[]) => {
  const set = new Set<string>([correct, ...distractors]);
  return Array.from(set).slice(0, 4).sort(() => Math.random() - 0.5);
};

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function createSpellingQuestion(config: ModeConfig): Question {
  const word = pick(config.spellingWords);
  const variant = Math.floor(Math.random() * 4);

  if (variant === 0) {
    const blankIndex = Math.max(1, Math.min(word.length - 2, Math.floor(Math.random() * word.length)));
    const correct = word[blankIndex];
    const promptWord = `${word.slice(0, blankIndex)}_${word.slice(blankIndex + 1)}`;
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      typeLabel: "Spelling",
      prompt: `Fill the missing letter: ${promptWord}`,
      correct,
      options: uniqueOptions(correct, distractors)
    };
  }

  if (variant === 1) {
    const correct = word[0];
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      typeLabel: "Spelling",
      prompt: `Which letter starts \"${word}\"?`,
      correct,
      options: uniqueOptions(correct, distractors)
    };
  }

  if (variant === 2) {
    const correct = word.slice(-2);
    const stem = word.slice(0, -2);
    const distractors = ["er", "an", "ly", "oo", "ea", "re", "ed", "or"].filter((x) => x !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      typeLabel: "Spelling",
      prompt: `Complete the word: ${stem}__`,
      correct,
      options: uniqueOptions(correct, distractors)
    };
  }

  const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");
  const distractors = config.spellingWords.filter((w) => w !== word).sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    typeLabel: "Spelling",
    prompt: `Unscramble this word: ${scrambled}`,
    correct: word,
    options: uniqueOptions(word, distractors)
  };
}

function createMathQuestion(boss: Boss, config: ModeConfig): Question {
  const max = config.mathMax;
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;

  if (config.allowTwoStepMath && Math.random() > 0.55) {
    const c = Math.floor(Math.random() * Math.max(4, Math.floor(max / 2))) + 1;
    const plusFirst = Math.random() > 0.5;
    const result = plusFirst ? a + b - c : a + c - b;
    const prompt = plusFirst
      ? `${boss.name} challenge: (${a} + ${b}) - ${c} = ?`
      : `${boss.name} challenge: (${a} + ${c}) - ${b} = ?`;
    const distractors = [result + 1, result - 2, result + 3].map(String);
    return {
      typeLabel: "Maths",
      prompt,
      correct: String(result),
      options: uniqueOptions(String(result), distractors)
    };
  }

  const usePlus = Math.random() > 0.35;
  const result = usePlus ? a + b : Math.max(0, a - Math.min(a, b));
  const prompt = usePlus ? `${a} + ${b} = ?` : `${a} - ${Math.min(a, b)} = ?`;
  const distractors = [result + 1, Math.max(0, result - 1), result + 2].map(String);
  return {
    typeLabel: "Maths",
    prompt,
    correct: String(result),
    options: uniqueOptions(String(result), distractors)
  };
}

function createQuestion(boss: Boss, round: number, config: ModeConfig): Question {
  return round % 2 === 0 ? createSpellingQuestion(config) : createMathQuestion(boss, config);
}

const initialStats = (): BattleStats => ({
  correctAnswers: 0,
  wrongAnswers: 0,
  spellingCorrect: 0,
  mathsCorrect: 0,
  bossesDefeated: 0,
  streak: 0,
  maxStreak: 0
});

const createInitialBattleState = (config: ModeConfig): BattleState => ({
  bossIndex: 0,
  bossHp: config.bossMaxHp,
  playerHp: config.playerMaxHp,
  round: 0,
  question: createQuestion(BOSSES[0], 0, config),
  feedback: `Charlotte appears! ${BOSSES[0].taunts.intro}`,
  phase: "quiz",
  lastHit: null,
  stats: initialStats()
});

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
  seq[tone].forEach((f, i) => {
    window.setTimeout(() => blip(f, 0.13, tone === "wrong" ? "square" : "triangle", 0.06), i * 90);
  });
};

export default function Page() {
  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<DifficultyMode>("spark");
  const [battle, setBattle] = useState<BattleState>(createInitialBattleState(MODE_CONFIGS.spark));
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

  const startGame = () => {
    setBattle(createInitialBattleState(config));
    setAttackMode("none");
    setDamagePop(null);
    setPhaseBanner("Battle Start!");
    setResult(null);
    setScreen("battle");
    speak(`${config.label} mode ready. ${BOSSES[0].name} is entering the arena!`, "start");
  };

  const finishRun = (runResult: "victory" | "game-over") => {
    setResult(runResult);
    setScreen("summary");
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
      finishRun("victory");
      return;
    }

    setBattle((prev) => ({
      ...prev,
      bossIndex: nextIndex,
      bossHp: config.bossMaxHp,
      round: 0,
      phase: "quiz",
      question: createQuestion(next, 0, config),
      feedback: `${next.name} jumps in! ${next.taunts.intro}`,
      lastHit: null
    }));
    setAttackMode("none");
    setDamagePop(null);
    setPhaseBanner(`${next.name} Enters!`);
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
        setBattle((prev) => ({
          ...prev,
          bossHp: 0,
          round: nextRound,
          feedback: currentBoss.taunts.defeated,
          phase: "boss-defeated",
          lastHit: "boss",
          stats: {
            ...prev.stats,
            correctAnswers: prev.stats.correctAnswers + 1,
            spellingCorrect: prev.stats.spellingCorrect + (prev.question.typeLabel === "Spelling" ? 1 : 0),
            mathsCorrect: prev.stats.mathsCorrect + (prev.question.typeLabel === "Maths" ? 1 : 0),
            bossesDefeated: prev.stats.bossesDefeated + 1,
            streak: prev.stats.streak + 1,
            maxStreak: Math.max(prev.stats.maxStreak, prev.stats.streak + 1)
          }
        }));
        setPhaseBanner("Boss Defeated!");
        speak(`${currentBoss.name} has been defeated. Brilliant work!`, "bossDown");
        return;
      }

      setBattle((prev) => ({
        ...prev,
        bossHp: newBossHp,
        round: nextRound,
        question: createQuestion(currentBoss, nextRound, config),
        feedback: `Correct! ${currentBoss.taunts.hit}`,
        lastHit: "boss",
        stats: {
          ...prev.stats,
          correctAnswers: prev.stats.correctAnswers + 1,
          spellingCorrect: prev.stats.spellingCorrect + (prev.question.typeLabel === "Spelling" ? 1 : 0),
          mathsCorrect: prev.stats.mathsCorrect + (prev.question.typeLabel === "Maths" ? 1 : 0),
          streak: prev.stats.streak + 1,
          maxStreak: Math.max(prev.stats.maxStreak, prev.stats.streak + 1)
        }
      }));
      speak("Correct answer. Spark strike launched!", "correct");
      return;
    }

    const newPlayerHp = Math.max(0, battle.playerHp - config.wrongDamage);
    setAttackMode("boss");
    setDamagePop({ target: "player", amount: config.wrongDamage });

    if (newPlayerHp <= 0) {
      setBattle((prev) => ({
        ...prev,
        playerHp: 0,
        feedback: `Oops! ${currentBoss.taunts.attack}`,
        lastHit: "player",
        stats: {
          ...prev.stats,
          wrongAnswers: prev.stats.wrongAnswers + 1,
          streak: 0
        }
      }));
      finishRun("game-over");
      return;
    }

    setBattle((prev) => ({
      ...prev,
      playerHp: newPlayerHp,
      round: nextRound,
      question: createQuestion(currentBoss, nextRound, config),
      feedback: `Not quite! ${currentBoss.taunts.attack}`,
      lastHit: "player",
      stats: {
        ...prev.stats,
        wrongAnswers: prev.stats.wrongAnswers + 1,
        streak: 0
      }
    }));
    speak("Almost there. Try the next one!", "wrong");
  };

  const totalAnswered = battle.stats.correctAnswers + battle.stats.wrongAnswers;
  const accuracy = totalAnswered > 0 ? Math.round((battle.stats.correctAnswers / totalAnswered) * 100) : 0;
  const learningLevel = accuracy >= 85 ? "Super Scholar" : accuracy >= 70 ? "Rising Rocket" : "Brave Learner";

  return (
    <main className="page-wrap">
      <section className="card title-card">
        <h1>Marmalade: Quiz Boss Battle</h1>
        <p>Bright battle arena with illustrated heroes, voice cues, and age-based challenge modes.</p>
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
              return (
                <button
                  key={m}
                  className={`mode-btn ${mode === m ? "selected" : ""}`}
                  onClick={() => {
                    setMode(m);
                    speak(`${modeConfig.label} mode selected. ${modeConfig.subtitle}`, "start");
                  }}
                >
                  <strong>{modeConfig.label}</strong>
                  <span>{modeConfig.ageBand}</span>
                  <small>{modeConfig.subtitle}</small>
                </button>
              );
            })}
          </div>

          <div className="boss-row">
            {BOSSES.map((boss) => (
              <div key={boss.id} className={`boss-preview ${boss.colorClass}`}>
                <div className={`boss-portrait ${boss.avatarClass}`} aria-hidden>
                  <div className="shape body" />
                  <div className="shape head" />
                  <div className="shape eye left" />
                  <div className="shape eye right" />
                  <div className="shape flare" />
                </div>
                <strong>{boss.name}</strong>
                <span>{boss.subtitle}</span>
                <small>“{boss.taunts.intro}”</small>
              </div>
            ))}
          </div>
          <button className="big-btn" onClick={startGame}>
            Start Adventure
          </button>
        </section>
      )}

      {screen === "battle" && (
        <section
          className={`card battle-card ${currentBoss.colorClass} ${battle.lastHit === "player" ? "danger-flash" : battle.lastHit === "boss" ? "win-flash" : ""} ${attackMode === "boss" ? "screen-shake" : ""}`}
        >
          {phaseBanner && <div className="phase-banner">{phaseBanner}</div>}

          <div className="hud-row">
            <div className="hud-box">
              <strong>Hero HP {battle.playerHp}/{config.playerMaxHp}</strong>
              <div className="bar"><span style={{ width: `${(battle.playerHp / config.playerMaxHp) * 100}%` }} /></div>
            </div>
            <div className="hud-box">
              <strong>{currentBoss.name} HP {battle.bossHp}/{config.bossMaxHp}</strong>
              <div className="bar enemy"><span style={{ width: `${(battle.bossHp / config.bossMaxHp) * 100}%` }} /></div>
            </div>
          </div>

          <div className="battle-stage">
            <div className={`hero-sprite ${attackMode === "hero" ? "hero-attack" : ""} ${attackMode === "boss" ? "hero-hurt" : ""}`}>
              <div className="hero-portrait" aria-hidden>
                <div className="shape cape" />
                <div className="shape body" />
                <div className="shape head" />
                <div className="shape eye left" />
                <div className="shape eye right" />
                <div className="shape wand" />
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
                <div className="shape body" />
                <div className="shape head" />
                <div className="shape eye left" />
                <div className="shape eye right" />
                <div className="shape flare" />
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
                  <button key={option} className="answer-btn" onClick={() => answer(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="center-stack">
              <h3>{currentBoss.name} is down!</h3>
              <button className="big-btn" onClick={nextBoss}>
                {battle.bossIndex < BOSSES.length - 1 ? "Next Boss" : "Finish Adventure"}
              </button>
            </div>
          )}
        </section>
      )}

      {screen === "summary" && (
        <section className="card center-stack end-card celebration summary-card">
          <h2>{result === "victory" ? "Learning Victory" : "Learning Summary"}</h2>
          <p>Mode: {config.label} ({config.ageBand})</p>
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
          <button className="big-btn" onClick={startGame}>Play Again</button>
          <button className="ghost-btn" onClick={() => setScreen("title")}>Back to Title</button>
        </section>
      )}
    </main>
  );
}
