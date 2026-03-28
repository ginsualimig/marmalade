import type PhaserModule from "phaser";
import { getHighScore } from "@/lib/game/persistence";
import { globalGameState, resetGameState } from "@/lib/game/state";

export default function createGameOverScene(Phaser: typeof PhaserModule) {
  return class GameOverScene extends Phaser.Scene {
    constructor() {
      super({ key: "GameOverScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor(0x2a061c);

      this.add.rectangle(400, 300, 800, 600, 0xff4d8f, 0.14);
      this.add.rectangle(400, 300, 690, 360, 0x1a0f24, 0.78).setStrokeStyle(4, 0xffffff, 0.2);

      this.add
        .text(this.scale.width / 2, 190, "TRY AGAIN, HERO!", {
          fontSize: "46px",
          fontStyle: "900",
          color: "#ff9bc7",
          stroke: "#611239",
          strokeThickness: 8
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 270, `Score: ${globalGameState.score}`, {
          fontSize: "28px",
          color: "#ffffff"
        })
        .setOrigin(0.5);

      const highScore = getHighScore();
      this.add
        .text(this.scale.width / 2, 320, `Best Score: ${highScore}`, {
          fontSize: "22px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      const restart = this.add
        .text(this.scale.width / 2, 420, "TAP TO RETRY", {
          fontSize: "32px",
          color: "#3b1030",
          backgroundColor: "#ffe174",
          padding: { x: 28, y: 14 },
          fontStyle: "900"
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.tweens.add({ targets: restart, scaleX: 1.08, scaleY: 1.08, yoyo: true, repeat: -1, duration: 650 });
      restart.on("pointerdown", () => this.restart());
      this.input.keyboard.once("keydown-R", () => this.restart());
    }

    private restart() {
      resetGameState();
      this.scene.start("TitleScene");
    }
  };
}
