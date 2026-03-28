import type PhaserModule from "phaser";
import { getHighScore } from "@/lib/game/persistence";
import { globalGameState, resetGameState } from "@/lib/game/state";

export default function createGameOverScene(Phaser: typeof PhaserModule) {
  return class GameOverScene extends Phaser.Scene {
    constructor() {
      super({ key: "GameOverScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor(0x050014);
      this.add
        .text(this.scale.width / 2, 200, "Game Over", {
          fontSize: "38px",
          fontStyle: "bold",
          color: "#ff5c8d"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 280, `Score: ${globalGameState.score}`, {
          fontSize: "22px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      const highScore = getHighScore();
      this.add
        .text(this.scale.width / 2, 320, `High Score: ${highScore}`, {
          fontSize: "18px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 340, "Tap or press R to retry", {
          fontSize: "18px",
          color: "#ffffff80"
        })
        .setOrigin(0.5);

      this.input.once("pointerdown", () => this.restart());
      this.input.keyboard.once("keydown-R", () => this.restart());
    }

    private restart() {
      resetGameState();
      this.scene.start("TitleScene");
    }
  };
}
