import type PhaserModule from "phaser";
import { BOSS_DEFINITIONS } from "@/lib/game/data/bosses";
import { globalGameState } from "@/lib/game/state";

export default function createCutsceneScene(Phaser: typeof PhaserModule) {
  return class CutsceneScene extends Phaser.Scene {
    constructor() {
      super({ key: "CutsceneScene" });
    }

    create(data: { bossName?: string }) {
      this.cameras.main.setBackgroundColor(0x030114);
      const bossName = data.bossName ?? "Champion";
      const nextBossName = BOSS_DEFINITIONS[globalGameState.bossIndex]?.name ?? "Victory";

      this.add
        .text(this.scale.width / 2, 180, `${bossName} defeated!`, {
          fontSize: "28px",
          color: "#ffd37f"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 250, `Ready for ${nextBossName}?`, {
          fontSize: "20px",
          color: "#ffffff"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 330, `Score: ${globalGameState.score}`, {
          fontSize: "18px",
          color: "#8cf0ff"
        })
        .setOrigin(0.5);

      this.time.delayedCall(3200, () => {
        if (globalGameState.bossIndex >= BOSS_DEFINITIONS.length) {
          this.scene.start("VictoryScene");
        } else {
          this.scene.start("BossRushScene");
        }
      });
    }
  };
}
