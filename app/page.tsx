"use client";

import { useMemo, useState } from "react";

type Boss = {
  id: "charlotte" | "george";
  name: string;
  emoji: string;
  colorClass: string;
  subtitle: string;
};

type Question = {
  prompt: string;
  typeLabel: "Spelling" | "Maths";
  options: string[];
  correct: string;
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
};

const BOSSES: Boss[] = [
  {
    id: "charlotte",
    name: "Charlotte",
    emoji: "👑🐲",
    colorClass: "boss-charlotte",
    subtitle: "Brainy Queen of Big Challenges"
  },
  {
    id: "george",
    name: "George",
    emoji: "🧢🦖",
    colorClass: "boss-george",
    subtitle: "Silly Dino Captain of Easy Maths"
  }
];

const SPELLING_WORDS = ["cat", "fish", "cake", "star", "dino", "apple", "smile", "robot"];

const PLAYER_MAX_HP = 100;
const BOSS_MAX_HP = 100;
const CORRECT_DAMAGE = 20;
const WRONG_DAMAGE = 15;

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const uniqueOptions = (correct: string, distractors: string[]) => {
  const set = new Set<string>([correct, ...distractors]);
  return Array.from(set).slice(0, 4).sort(() => Math.random() - 0.5);
};

function createSpellingQuestion(): Question {
  const word = pick(SPELLING_WORDS);
  const variant = Math.floor(Math.random() * 3);

  if (variant === 0) {
    const blankIndex = Math.max(1, Math.min(word.length - 2, Math.floor(Math.random() * word.length)));
    const correct = word[blankIndex];
    const promptWord = `${word.slice(0, blankIndex)}_ ${word.slice(blankIndex + 1)}`.replace(" ", "");
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);

    return {
      typeLabel: "Spelling",
      prompt: `Fill in the blank: ${promptWord}`,
      correct,
      options: uniqueOptions(correct, distractors)
    };
  }

  if (variant === 1) {
    const correct = word[0];
    const prompt = `First letter challenge: Which letter starts "${word}"?`;
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    const distractors = alphabet.filter((letter) => letter !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      typeLabel: "Spelling",
      prompt,
      correct,
      options: uniqueOptions(correct, distractors)
    };
  }

  const missing = word.slice(-2);
  const stem = word.slice(0, -2);
  const distractors = ["er", "an", "ip", "at", "oo", "op"].filter((x) => x !== missing).sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    typeLabel: "Spelling",
    prompt: `Word completion: ${stem}__`,
    correct: missing,
    options: uniqueOptions(missing, distractors)
  };
}

function createMathQuestion(boss: Boss): Question {
  if (boss.id === "george") {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const plus = Math.random() > 0.35;
    const prompt = plus ? `${a} + ${b} = ?` : `${a + b} - ${b} = ?`;
    const correctNum = plus ? a + b : a;
    const distractors = [correctNum + 1, Math.max(0, correctNum - 1), correctNum + 2].map(String);
    return {
      typeLabel: "Maths",
      prompt,
      correct: String(correctNum),
      options: uniqueOptions(String(correctNum), distractors)
    };
  }

  const a = Math.floor(Math.random() * 15) + 6;
  const b = Math.floor(Math.random() * 10) + 3;
  const c = Math.floor(Math.random() * 10) + 2;
  const useTwoStep = Math.random() > 0.4;

  if (useTwoStep) {
    const result = a + b - c;
    const prompt = `Charlotte challenge: (${a} + ${b}) - ${c} = ?`;
    const distractors = [result + 1, result - 2, result + 3].map(String);
    return {
      typeLabel: "Maths",
      prompt,
      correct: String(result),
      options: uniqueOptions(String(result), distractors)
    };
  }

  const plus = Math.random() > 0.5;
  const result = plus ? a + b : a - Math.min(a - 1, b);
  const prompt = plus ? `${a} + ${b} = ?` : `${a} - ${Math.min(a - 1, b)} = ?`;
  const distractors = [result + 2, result - 1, result + 4].map(String);
  return {
    typeLabel: "Maths",
    prompt,
    correct: String(result),
    options: uniqueOptions(String(result), distractors)
  };
}

function createQuestion(boss: Boss, round: number): Question {
  return round % 2 === 0 ? createSpellingQuestion() : createMathQuestion(boss);
}

const createInitialBattleState = (): BattleState => ({
  bossIndex: 0,
  bossHp: BOSS_MAX_HP,
  playerHp: PLAYER_MAX_HP,
  round: 0,
  question: createQuestion(BOSSES[0], 0),
  feedback: "Charlotte appears! Answer correctly to strike!",
  phase: "quiz",
  lastHit: null
});

export default function Page() {
  const [screen, setScreen] = useState<"title" | "battle" | "victory" | "game-over">("title");
  const [battle, setBattle] = useState<BattleState>(createInitialBattleState);

  const currentBoss = BOSSES[battle.bossIndex];
  const score = useMemo(() => {
    const defeated = battle.bossIndex * 5;
    const progress = Math.floor((BOSS_MAX_HP - battle.bossHp) / CORRECT_DAMAGE);
    return (defeated + progress) * 100;
  }, [battle.bossHp, battle.bossIndex]);

  const startGame = () => {
    setBattle(createInitialBattleState());
    setScreen("battle");
  };

  const nextBoss = () => {
    const nextIndex = battle.bossIndex + 1;
    const next = BOSSES[nextIndex];
    if (!next) {
      setScreen("victory");
      return;
    }

    setBattle((prev) => ({
      ...prev,
      bossIndex: nextIndex,
      bossHp: BOSS_MAX_HP,
      round: 0,
      phase: "quiz",
      question: createQuestion(next, 0),
      feedback: `${next.name} jumps in! Keep solving spelling and maths!`,
      lastHit: null
    }));
  };

  const answer = (choice: string) => {
    if (screen !== "battle" || battle.phase !== "quiz") return;

    const isCorrect = choice === battle.question.correct;
    const nextRound = battle.round + 1;

    if (isCorrect) {
      const newBossHp = Math.max(0, battle.bossHp - CORRECT_DAMAGE);
      if (newBossHp <= 0) {
        setBattle((prev) => ({
          ...prev,
          bossHp: 0,
          round: nextRound,
          feedback: `Boom! ${currentBoss.name} is defeated!`,
          phase: "boss-defeated",
          lastHit: "boss"
        }));
        return;
      }

      setBattle((prev) => ({
        ...prev,
        bossHp: newBossHp,
        round: nextRound,
        question: createQuestion(currentBoss, nextRound),
        feedback: "Correct! Huge hit to the boss!",
        lastHit: "boss"
      }));
      return;
    }

    const newPlayerHp = Math.max(0, battle.playerHp - WRONG_DAMAGE);
    if (newPlayerHp <= 0) {
      setBattle((prev) => ({
        ...prev,
        playerHp: 0,
        feedback: "Oops! You ran out of hearts.",
        lastHit: "player"
      }));
      setScreen("game-over");
      return;
    }

    setBattle((prev) => ({
      ...prev,
      playerHp: newPlayerHp,
      round: nextRound,
      question: createQuestion(currentBoss, nextRound),
      feedback: "Not quite! The boss hit back.",
      lastHit: "player"
    }));
  };

  return (
    <main className="page-wrap">
      <section className="card title-card">
        <h1>Marmalade: Quiz Boss Battle</h1>
        <p>Answer spelling and maths questions to defeat Charlotte and George.</p>
      </section>

      {screen === "title" && (
        <section className="card center-stack">
          <div className="boss-row">
            {BOSSES.map((boss) => (
              <div key={boss.id} className={`boss-preview ${boss.colorClass}`}>
                <div className="emoji">{boss.emoji}</div>
                <strong>{boss.name}</strong>
                <span>{boss.subtitle}</span>
              </div>
            ))}
          </div>
          <button className="big-btn" onClick={startGame}>
            ▶ Start Adventure
          </button>
        </section>
      )}

      {screen === "battle" && (
        <section className={`card battle-card ${currentBoss.colorClass} ${battle.lastHit === "player" ? "danger-flash" : battle.lastHit === "boss" ? "win-flash" : ""}`}>
          <div className="hud-row">
            <div className="hud-box">
              <strong>Hero HP ❤️ {battle.playerHp}/100</strong>
              <div className="bar"><span style={{ width: `${battle.playerHp}%` }} /></div>
            </div>
            <div className="hud-box">
              <strong>{currentBoss.name} HP 💥 {battle.bossHp}/100</strong>
              <div className="bar enemy"><span style={{ width: `${battle.bossHp}%` }} /></div>
            </div>
          </div>

          <div className="boss-stage">
            <div className="boss-emoji">{currentBoss.emoji}</div>
            <div>
              <h2>{currentBoss.name}</h2>
              <p>{currentBoss.subtitle}</p>
              <p className="feedback">{battle.feedback}</p>
            </div>
            <div className="score">Score ⭐ {score}</div>
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

      {screen === "victory" && (
        <section className="card center-stack end-card">
          <h2>🏆 You Win!</h2>
          <p>You defeated Charlotte and George with spelling and maths power.</p>
          <button className="big-btn" onClick={startGame}>Play Again</button>
        </section>
      )}

      {screen === "game-over" && (
        <section className="card center-stack end-card">
          <h2>💤 Game Over</h2>
          <p>Charlotte and George were too tough this time. Try again!</p>
          <button className="big-btn" onClick={startGame}>Retry</button>
        </section>
      )}
    </main>
  );
}
