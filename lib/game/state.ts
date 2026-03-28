export type GameState = {
  bossIndex: number;
  score: number;
  playerHP: number;
  playerMP: number;
  combo: number;
  isGameOver: boolean;
};

export const globalGameState: GameState = {
  bossIndex: 0,
  score: 0,
  playerHP: 100,
  playerMP: 50,
  combo: 0,
  isGameOver: false
};

export const resetGameState = () => {
  globalGameState.bossIndex = 0;
  globalGameState.score = 0;
  globalGameState.playerHP = 100;
  globalGameState.playerMP = 50;
  globalGameState.combo = 0;
  globalGameState.isGameOver = false;
};

export const advanceBossIndex = () => {
  globalGameState.bossIndex += 1;
};
