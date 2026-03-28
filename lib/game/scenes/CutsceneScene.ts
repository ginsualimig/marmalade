import type PhaserModule from "phaser";
import { BOSS_DEFINITIONS } from "@/lib/game/data/bosses";
import { getHighScore } from "@/lib/game/persistence";
import { globalGameState } from "@/lib/game/state";
import { playAudioCue } from "@/lib/game/audio";

export default function createCutsceneScene(Phaser: typeof PhaserModule) {
  return class CutsceneScene extends Phaser.Scene {
    constructor() {
      super({ key: "CutsceneScene" });
    }

    create(data: { bossName?: string }) {
      this.cameras.main.setBackgroundColor(0x120420);
      const bossName = data.bossName ?? "Champion";
      const nextBossName = BOSS_DEFINITIONS[globalGameState.bossIndex]?.name ?? "Victory";

      this.add.rectangle(400, 300, 800, 600, 0x7a2cff, 0.14);
      this.add.rectangle(400, 300, 690, 360, 0x11122f, 0.72).setStrokeStyle(4, 0xffffff, 0.25);

      const burst = this.add.circle(400, 190, 90, 0xffe26f, 0.25).setStrokeStyle(4, 0xffe26f, 0.8);
      this.tweens.add({ targets: burst, scale: 1.4, alpha: 0, duration: 700, repeat: -1, ease: "Sine.easeOut" });

      this.add
        .text(this.scale.width / 2, 170, `YOU BEAT ${bossName.toUpperCase()}!`, {
          fontSize: "40px",
          color: "#fff58f",
          stroke: "#6833aa",
          strokeThickness: 8,
          fontStyle: "900"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 250, `Next boss: ${nextBossName}`, {
          fontSize: "30px",
          color: "#baf7ff",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 312, `Score: ${globalGameState.score}`, {
          fontSize: "24px",
          color: "#ffffff"
        })
        .setOrigin(0.5);

      const highScore = getHighScore();
      this.add
        .text(this.scale.width / 2, 350, `Best Score: ${highScore}`, {
          fontSize: "20px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 430, "Get ready...", {
          fontSize: "26px",
          color: "#ffb0ef",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      playAudioCue("reward");
      this.time.delayedCall(420, () => playAudioCue("reward"));

      this.time.delayedCall(2400, () => {
        if (globalGameState.bossIndex >= BOSS_DEFINITIONS.length) {
          this.scene.start("VictoryScene");
        } else {
          this.scene.start("BossRushScene");
        }
      });
    }
  };
}
