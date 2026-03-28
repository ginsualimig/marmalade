import type PhaserModule from "phaser";
import { globalGameState, resetGameState } from "@/lib/game/state";

export default function createVictoryScene(Phaser: typeof PhaserModule) {
  return class VictoryScene extends Phaser.Scene {
    constructor() {
      super({ key: "VictoryScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor(0x050014);
      this.add
        .text(this.scale.width / 2, 220, "Victory!", {
          fontSize: "38px",
          color: "#ffd37f",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 280, `Final score: ${globalGameState.score}`, {
          fontSize: "22px",
          color: "#91e7ff"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 360, "Tap anywhere to restart", {
          fontSize: "18px",
          color: "#ffffff"
        })
        .setOrigin(0.5);

      this.input.once("pointerdown", () => {
        resetGameState();
        this.scene.start("TitleScene");
      });
    }
  };
}
