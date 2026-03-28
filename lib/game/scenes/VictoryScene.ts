import type PhaserModule from "phaser";
import { getHighScore } from "@/lib/game/persistence";
import { globalGameState, resetGameState } from "@/lib/game/state";
import { playAudioCue } from "@/lib/game/audio";

export default function createVictoryScene(Phaser: typeof PhaserModule) {
  return class VictoryScene extends Phaser.Scene {
    constructor() {
      super({ key: "VictoryScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor(0x14042f);
      this.add.rectangle(400, 300, 800, 600, 0x7d39ff, 0.16);

      for (let i = 0; i < 35; i++) {
        const confetti = this.add.rectangle(Phaser.Math.Between(20, 780), -30, Phaser.Math.Between(8, 14), Phaser.Math.Between(14, 24), Phaser.Display.Color.RandomRGB().color, 0.95);
        this.tweens.add({
          targets: confetti,
          y: 650,
          x: confetti.x + Phaser.Math.Between(-80, 80),
          angle: Phaser.Math.Between(120, 380),
          duration: Phaser.Math.Between(1900, 3200),
          ease: "Sine.easeIn",
          delay: Phaser.Math.Between(0, 700),
          onComplete: () => confetti.destroy()
        });
      }

      this.add
        .text(this.scale.width / 2, 190, "YOU WIN!", {
          fontSize: "58px",
          color: "#fff68f",
          fontStyle: "900",
          stroke: "#8030d8",
          strokeThickness: 10
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 258, "Math + Spelling Champion", {
          fontSize: "30px",
          color: "#9beeff",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 322, `Final score: ${globalGameState.score}`, {
          fontSize: "28px",
          color: "#ffffff"
        })
        .setOrigin(0.5);

      const highScore = getHighScore();
      this.add
        .text(this.scale.width / 2, 364, `Best score: ${highScore}`, {
          fontSize: "22px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      const restart = this.add
        .text(this.scale.width / 2, 462, "PLAY AGAIN", {
          fontSize: "34px",
          color: "#1f1235",
          backgroundColor: "#8cff90",
          padding: { x: 30, y: 15 },
          fontStyle: "900"
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.tweens.add({ targets: restart, scaleX: 1.1, scaleY: 1.1, yoyo: true, repeat: -1, duration: 700 });

      restart.on("pointerdown", () => {
        resetGameState();
        this.scene.start("TitleScene");
      });

      playAudioCue("reward");
      this.time.delayedCall(260, () => playAudioCue("reward"));
      this.time.delayedCall(520, () => playAudioCue("reward"));
    }
  };
}
