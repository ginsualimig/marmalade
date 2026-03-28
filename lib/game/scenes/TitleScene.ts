import type PhaserModule from "phaser";
import { getHighScore } from "@/lib/game/persistence";

export default function createTitleScene(Phaser: typeof PhaserModule) {
  return class TitleScene extends Phaser.Scene {
    constructor() {
      super({ key: "TitleScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor(0x030114);

      this.add
        .text(this.scale.width / 2, 120, "MARMALADE", {
          fontSize: "48px",
          fontFamily: "Space Grotesk",
          color: "#ffd37f",
          letterSpacing: 0.3
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 200, "Tiny guardian boss rush", {
          fontSize: "20px",
          color: "#ffffff",
          fontStyle: "italic"
        })
        .setOrigin(0.5);

      const startButton = this.add
        .text(this.scale.width / 2, this.scale.height / 2, "Tap to begin", {
          fontSize: "26px",
          color: "#030114",
          backgroundColor: "#fdd976",
          padding: { x: 24, y: 12 },
          align: "center"
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      startButton.on("pointerdown", () => {
        this.scene.start("BossRushScene");
      });

      const highScore = getHighScore();
      this.add
        .text(this.scale.width / 2, this.scale.height / 2 + 80, `High Score: ${highScore}`, {
          fontSize: "18px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, this.scale.height - 120, "Charlotte → George", {
          fontSize: "18px",
          color: "#ffffff80"
        })
        .setOrigin(0.5);
    }
  };
}
