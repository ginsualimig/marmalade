import type PhaserModule from "phaser";
import { getHighScore } from "@/lib/game/persistence";
import { startMusicBed, unlockAudio } from "@/lib/game/audio";

export default function createTitleScene(Phaser: typeof PhaserModule) {
  return class TitleScene extends Phaser.Scene {
    constructor() {
      super({ key: "TitleScene" });
    }

    create() {
      this.cameras.main.setBackgroundColor(0x14042f);

      const sky = this.add.graphics();
      sky.fillGradientStyle(0x7c3aed, 0xff6ec7, 0x2f1358, 0x0c0522, 1);
      sky.fillRect(0, 0, this.scale.width, this.scale.height);

      for (let i = 0; i < 24; i++) {
        this.add.circle(
          Phaser.Math.Between(20, this.scale.width - 20),
          Phaser.Math.Between(20, this.scale.height - 120),
          Phaser.Math.Between(2, 7),
          0xffffff,
          Phaser.Math.FloatBetween(0.2, 0.8)
        );
      }

      const mascot = this.add.container(this.scale.width / 2, 280);
      mascot.add(this.add.ellipse(0, 30, 280, 190, 0xffd77c, 1).setStrokeStyle(6, 0xfff4d4));
      mascot.add(this.add.circle(0, -40, 88, 0xffe3b2, 1).setStrokeStyle(6, 0xfff9dd));
      mascot.add(this.add.circle(-26, -52, 14, 0x241137));
      mascot.add(this.add.circle(26, -52, 14, 0x241137));
      mascot.add(this.add.circle(-22, -56, 4, 0xffffff));
      mascot.add(this.add.circle(30, -56, 4, 0xffffff));
      mascot.add(this.add.ellipse(0, -20, 42, 20, 0x431d61, 0.7));
      mascot.add(this.add.ellipse(-58, 24, 28, 18, 0xff96ca, 0.9));
      mascot.add(this.add.ellipse(58, 24, 28, 18, 0xff96ca, 0.9));

      this.tweens.add({
        targets: mascot,
        y: 294,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      this.add
        .text(this.scale.width / 2, 88, "MARMALADE", {
          fontSize: "58px",
          fontFamily: "Nunito, Arial",
          color: "#fff7a8",
          stroke: "#9b4dff",
          strokeThickness: 8,
          fontStyle: "900"
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, 148, "Tiny Guardian Adventure", {
          fontSize: "28px",
          color: "#e8e5ff",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      const startButton = this.add
        .text(this.scale.width / 2, 470, "TAP TO PLAY", {
          fontSize: "34px",
          color: "#2f1547",
          backgroundColor: "#8bff93",
          padding: { x: 32, y: 16 },
          fontStyle: "900"
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: startButton,
        scaleX: 1.07,
        scaleY: 1.07,
        duration: 680,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      const highScore = getHighScore();
      this.add
        .text(this.scale.width / 2, 548, `Best Score ⭐ ${highScore}`, {
          fontSize: "22px",
          color: "#9bf2ff",
          stroke: "#2b0f42",
          strokeThickness: 4
        })
        .setOrigin(0.5);

      this.add
        .text(this.scale.width / 2, this.scale.height - 36, "Queen Mischief Charlotte → Captain Chaos George | Learn letters + math while battling", {
          fontSize: "16px",
          color: "#fff8"
        })
        .setOrigin(0.5);

      startButton.on("pointerdown", () => {
        unlockAudio();
        startMusicBed();
        this.scene.start("BossRushScene");
      });
    }
  };
}
