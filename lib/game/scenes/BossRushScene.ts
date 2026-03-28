import type PhaserModule from "phaser";
import { BOSS_DEFINITIONS } from "@/lib/game/data/bosses";
import {
  advanceBossIndex,
  globalGameState
} from "@/lib/game/state";

const WORDS = [
  "mystic",
  "sparkle",
  "glimmer",
  "bubble",
  "tiger",
  "dragon",
  "ginger",
  "pebble",
  "jade",
  "lotus"
];

const LETTER_POOL = ["M", "S", "C", "G", "T"];

export type TouchCommand = {
  type: string;
  payload?: {
    direction?: "left" | "right" | "none";
  };
};

export default function createBossRushScene(Phaser: typeof PhaserModule) {
  type ArcadePhysicsObject = Phaser.Types.Physics.Arcade.GameObjectWithBody;
  type GameObjectWithY = Phaser.GameObjects.GameObject & { y: number };

  return class BossRushScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private boss!: Phaser.GameObjects.Rectangle;
  private bossBody!: Phaser.Physics.Arcade.Body;
  private ground!: Phaser.GameObjects.Rectangle;

  private hpBar!: Phaser.GameObjects.Graphics;
  private mpBar!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossPhaseText!: Phaser.GameObjects.Text;
  private eduText!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyLight!: Phaser.Input.Keyboard.Key;
  private keyHeavy!: Phaser.Input.Keyboard.Key;
  private keySpecial!: Phaser.Input.Keyboard.Key;

  private playerHP = 100;
  private playerMP = 50;
  private comboCount = 0;
  private lastHitAt = 0;
  private score = 0;

  private currentBossIndex = 0;
  private currentBoss?: (typeof BOSS_DEFINITIONS)[number];
  private bossHP = 0;
  private bossMaxHP = 0;
  private bossShield = false;
  private bossTimer?: Phaser.Time.TimerEvent;

  private wordGroup?: Phaser.Physics.Arcade.Group;
  private letterGroup?: Phaser.Physics.Arcade.Group;
  private numberGroup?: Phaser.Physics.Arcade.Group;
  private hazardGroup?: Phaser.Physics.Arcade.Group;

  private mathGate?: Phaser.GameObjects.Rectangle;
  private mathGateTarget = 0;
  private numberComparisonTarget = 4;
  private wordDodgeLetter = "S";

  private touchState = { left: false, right: false };

  constructor() {
    super({ key: "BossRushScene" });
  }

  create() {
    globalGameState.isGameOver = false;

    if (globalGameState.bossIndex >= BOSS_DEFINITIONS.length) {
      this.scene.start("VictoryScene");
      return;
    }

    this.currentBossIndex = globalGameState.bossIndex;
    this.currentBoss = BOSS_DEFINITIONS[this.currentBossIndex];
    this.playerHP = globalGameState.playerHP;
    this.playerMP = globalGameState.playerMP;
    this.score = globalGameState.score;
    this.comboCount = globalGameState.combo;

    this.cameras.main.setBackgroundColor(0x050014);
    this.physics.world.setBounds(0, 0, 800, 600);

    this.createWorld();
    this.createPlayer();
    this.createBoss();
    this.createUI();
    this.createGroups();
    this.setupInput();
    this.rotateWordLetter();
    this.spawnMathGate();
    this.scheduleEducationalEvents();
    this.startBossLoop();
  }

  update() {
    this.handleMovement();
    this.handleAttacks();
    this.cleanupOutOfBounds();
    this.updateUI();
  }

  private createWorld() {
    this.ground = this.add
      .rectangle(400, 588, 820, 24, 0x2d1244)
      .setOrigin(0.5);
    this.physics.add.existing(this.ground, true);
  }

  private createPlayer() {
    this.player = this.add.rectangle(140, 520, 38, 60, 0xffc573);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setBounce(0.1);
    this.playerBody.setGravityY(900);
    this.physics.add.collider(this.player, this.ground);
  }

  private createBoss() {
    const bossColor = this.currentBoss?.color ?? 0xff5c8d;
    this.boss = this.add.rectangle(650, 470, 100, 120, bossColor);
    this.physics.add.existing(this.boss);
    this.bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
    this.bossBody.setImmovable(true);
    this.bossBody.setCollideWorldBounds(true);
    this.bossBody.setGravityY(900);
    this.physics.add.collider(this.boss, this.ground);

    this.bossHP = this.currentBoss?.maxHP ?? 120;
    this.bossMaxHP = this.bossHP;
  }

  private createUI() {
    this.hpBar = this.add.graphics();
    this.mpBar = this.add.graphics();
    this.comboText = this.add
      .text(16, 36, `Combo x${this.comboCount}`, {
        color: "#ffd37f",
        fontSize: "16px"
      })
      .setDepth(2);
    this.scoreText = this.add
      .text(16, 60, `Score: ${this.score}`, {
        color: "#85f2ff",
        fontSize: "16px"
      })
      .setDepth(2);
    this.bossNameText = this.add
      .text(400, 24, `${this.currentBoss?.name} Rush`, {
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0.5);
    this.bossPhaseText = this.add
      .text(400, 48, this.currentBoss?.description ?? "", {
        fontSize: "14px",
        color: "#d9d9ff"
      })
      .setOrigin(0.5, 0.5);
    this.eduText = this.add
      .text(16, 520, "", {
        fontSize: "14px",
        color: "#dff5ff"
      })
      .setDepth(2);
    this.updateUI();
  }

  private createGroups() {
    this.wordGroup = this.physics.add.group();
    this.letterGroup = this.physics.add.group();
    this.numberGroup = this.physics.add.group();
    this.hazardGroup = this.physics.add.group();

    if (this.player) {
      this.physics.add.overlap(this.player, this.wordGroup, this.handleWordCollision, undefined, this);
      this.physics.add.overlap(this.player, this.letterGroup, this.handleLetterCollision, undefined, this);
      this.physics.add.overlap(this.player, this.numberGroup, this.handleNumberCollision, undefined, this);
      this.physics.add.overlap(this.player, this.hazardGroup, this.handleHazardCollision, undefined, this);
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyLight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyHeavy = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keySpecial = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
      if (event.code === "KeyR" && globalGameState.isGameOver) {
        this.scene.start("TitleScene");
      }
    });

    this.events.on("touch-input", (payload: TouchCommand) => {
      this.handleTouchCommand(payload);
    });
  }

  private handleTouchCommand(payload: TouchCommand) {
    switch (payload.type) {
      case "move-start":
        if (payload.payload?.direction === "left") {
          this.touchState.left = true;
        } else if (payload.payload?.direction === "right") {
          this.touchState.right = true;
        }
        break;
      case "move-stop":
        if (payload.payload?.direction === "left") {
          this.touchState.left = false;
        } else if (payload.payload?.direction === "right") {
          this.touchState.right = false;
        } else {
          this.touchState.left = false;
          this.touchState.right = false;
        }
        break;
      case "jump":
        this.performJump();
        break;
      case "light-attack":
        this.performAttack("light");
        break;
      case "heavy-attack":
        this.performAttack("heavy");
        break;
      case "dragon-special":
        this.performAttack("dragon");
        break;
      default:
        break;
    }
  }

  private handleMovement() {
    if (!this.playerBody) return;
    let velocityX = 0;
    if ((this.cursors?.left?.isDown || this.touchState.left) && !this.cursors?.right?.isDown) {
      velocityX = -200;
    }
    if ((this.cursors?.right?.isDown || this.touchState.right) && !this.cursors?.left?.isDown) {
      velocityX = 200;
    }

    this.playerBody.setVelocityX(velocityX);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.performJump();
    }
  }

  private performJump() {
    if (this.playerBody && this.playerBody.blocked.down) {
      this.playerBody.setVelocityY(-420);
    }
  }

  private handleAttacks() {
    if (Phaser.Input.Keyboard.JustDown(this.keyLight)) {
      this.performAttack("light");
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyHeavy)) {
      this.performAttack("heavy");
    }
    if (Phaser.Input.Keyboard.JustDown(this.keySpecial)) {
      this.performAttack("dragon");
    }
  }

  private performAttack(style: "light" | "heavy" | "dragon") {
    if (!this.currentBoss) return;
    let damage = 0;
    if (style === "light") {
      damage = 12;
    } else if (style === "heavy") {
      damage = 26;
    } else {
      if (this.playerMP < 25) {
        this.displayBreach("Need more MP for Dragon Special");
        return;
      }
      damage = 42;
      this.playerMP = Math.max(0, this.playerMP - 25);
    }

    if (this.bossShield) {
      damage = Math.round(damage * 0.4);
      this.displayBreach("Shielded! Aim for a weak spot.");
    }

    this.applyComboDamage(damage);
  }

  private applyComboDamage(baseDamage: number) {
    const now = this.time.now;
    if (now - this.lastHitAt < 1800) {
      this.comboCount += 1;
    } else {
      this.comboCount = 1;
    }
    this.lastHitAt = now;

    const multiplier = 1 + (this.comboCount - 1) * 0.15;
    const inflicted = Math.max(1, Math.round(baseDamage * multiplier));
    this.bossHP = Math.max(0, this.bossHP - inflicted);
    this.score += inflicted + this.comboCount * 2;
    this.comboText.setText(`Combo x${this.comboCount}`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.triggerHitFlash();

    if (this.bossHP <= 0) {
      this.handleBossDefeated();
    }
  }

  private triggerHitFlash() {
    this.boss.setFillStyle(0xffffff);
    this.time.delayedCall(80, () => {
      if (this.currentBoss) {
        this.boss.setFillStyle(this.currentBoss.color);
      }
    });
  }

  private handleBossDefeated() {
    advanceBossIndex();
    globalGameState.score = this.score;
    globalGameState.playerHP = this.playerHP;
    globalGameState.playerMP = this.playerMP;
    globalGameState.combo = this.comboCount;
    this.bossTimer?.remove();
    this.scene.start("CutsceneScene", { bossName: this.currentBoss?.name });
  }

  private startBossLoop() {
    this.bossTimer = this.time.addEvent({
      delay: 2100,
      loop: true,
      callback: () => {
        this.performBossAction();
      }
    });
  }

  private performBossAction() {
    if (!this.currentBoss) return;
    const bossName = this.currentBoss.name;
    if (bossName === "Charlotte") {
      this.launchCharlotteMove();
    } else {
      this.launchGeorgeMove();
    }
  }

  private launchCharlotteMove() {
    const option = Phaser.Math.Between(0, 2);
    if (option === 0) {
      this.dashBossTowardPlayer(-350, -40);
    } else if (option === 1) {
      this.launchProjectile("toy", 120, 0xffd6fb);
    } else {
      this.launchProjectile("jump", 60, 0xff9ae8);
    }

    if (this.bossHP / this.bossMaxHP < 0.4 && !this.bossShield) {
      this.activateShieldPhase("Shield: block the toy throws!");
    }
  }

  private launchGeorgeMove() {
    const option = Phaser.Math.Between(0, 3);
    if (option === 0) {
      this.launchProjectile("spin", 200, 0x4dd0ff);
    } else if (option === 1) {
      this.launchProjectile("diagonal", 160, 0x15ffa0);
    } else {
      this.spawnDroolPuddle();
    }

    if (this.bossHP / this.bossMaxHP < 0.4 && !this.bossShield) {
      this.activateShieldPhase("Meltdown! Intense tantrum spin");
      this.spawnDroolPuddle();
    }
  }

  private dashBossTowardPlayer(forceX: number, forceY: number) {
    if (!this.player || !this.bossBody) return;
    this.bossBody.setVelocity(forceX, forceY);
    this.time.delayedCall(600, () => {
      this.bossBody.setVelocity(0, 0);
    });
  }

  private launchProjectile(type: string, speed: number, color: number) {
    if (!this.player) return;
    const radius = 12;
    const spawnX = this.boss.x - 20;
    const spawnY = this.boss.y - 20;
    const projectile = this.add.circle(spawnX, spawnY, radius, color);
    this.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-speed, -Phaser.Math.Between(30, 90));
    body.setBounce(0.5);
    body.setGravityY(450);
    this.hazardGroup?.add(projectile);
  }

  private spawnDroolPuddle() {
    const width = 140;
    const puddle = this.add.rectangle(this.player.x, 580, width, 16, 0x96f7ff, 0.5);
    this.physics.add.existing(puddle, true);
    this.hazardGroup?.add(puddle);
    this.time.delayedCall(4200, () => {
      puddle.destroy();
    });
  }

  private activateShieldPhase(message: string) {
    this.bossShield = true;
    this.bossPhaseText.setText(message);
    this.time.delayedCall(4000, () => {
      this.bossShield = false;
      if (this.currentBoss) {
        this.bossPhaseText.setText(this.currentBoss.description);
      }
    });
  }

  private spawnWordDrop() {
    if (!this.wordGroup) return;
    const word = Phaser.Utils.Array.GetRandom(WORDS);
    const x = Phaser.Math.Between(60, 740);
    const wordLabel = this.add
      .text(x, -20, word, {
        fontSize: "18px",
        color: "#ffe6f7"
      })
      .setOrigin(0.5);
    this.physics.add.existing(wordLabel);
    const body = wordLabel.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 110 + Math.random() * 60);
    body.setSize(wordLabel.width, wordLabel.height);
    this.wordGroup.add(wordLabel);
  }

  private handleWordCollision(playerObj: ArcadePhysicsObject, wordObj: ArcadePhysicsObject) {
    const wordText = wordObj as Phaser.GameObjects.Text;
    const word = wordText.text || "";
    if (word[0]?.toUpperCase() === this.wordDodgeLetter) {
      this.applyPlayerDamage(6);
      this.displayBreach("Dodge that letter!");
    } else {
      this.score += word.length * 2;
      this.comboCount += 1;
      this.comboText.setText(`Combo x${this.comboCount}`);
    }
    wordObj.destroy();
  }

  private spawnLetterOrb() {
    if (!this.letterGroup) return;
    const letter = Phaser.Utils.Array.GetRandom(LETTER_POOL);
    const orb = this.add.circle(Phaser.Math.Between(50, 750), -10, 14, 0xfff082);
    this.physics.add.existing(orb);
    orb.setData("letter", letter);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 140);
    body.setBounce(0.2);
    this.letterGroup.add(orb);
  }

  private handleLetterCollision(playerObj: ArcadePhysicsObject, orbObj: ArcadePhysicsObject) {
    const orb = orbObj as Phaser.GameObjects.Arc;
    this.playerMP = Math.min(120, this.playerMP + 14);
    this.score += 4;
    this.comboCount += 1;
    this.comboText.setText(`Combo x${this.comboCount}`);
    this.updateEducationalText();
    orb.destroy();
  }

  private spawnNumberHazard() {
    if (!this.numberGroup) return;
    const value = Phaser.Math.Between(1, 9);
    const numberLabel = this.add
      .text(Phaser.Math.Between(80, 720), -12, `${value}`, {
        fontSize: "20px",
        color: "#95e3ff",
        fontStyle: "bold"
      })
      .setOrigin(0.5);
    this.physics.add.existing(numberLabel);
    numberLabel.setData("value", value);
    const body = numberLabel.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 120 + Math.random() * 70);
    this.numberGroup.add(numberLabel);
  }

  private handleNumberCollision(playerObj: ArcadePhysicsObject, numberObj: ArcadePhysicsObject) {
    const numberLabel = numberObj as Phaser.GameObjects.Text;
    const value = Number(numberLabel.getData("value")) || 0;
    if (value >= this.numberComparisonTarget) {
      this.score += value * 3;
      this.comboCount += 2;
      this.displayBreach("Great number pick!");
    } else {
      this.applyPlayerDamage(7);
      this.comboCount = Math.max(0, this.comboCount - 1);
      this.displayBreach("Oops! Watch the number.");
    }
    this.comboText.setText(`Combo x${Math.max(1, this.comboCount)}`);
    this.numberComparisonTarget = Phaser.Math.Between(2, 8);
    numberObj.destroy();
    this.updateEducationalText();
  }

  private spawnMathGate() {
    this.mathGate?.destroy();
    this.mathGateTarget = Phaser.Math.Between(12, 20);
    this.mathGate = this.add
      .rectangle(400, 240, 200, 40, 0x8ce5ff, 0.2)
      .setStrokeStyle(2, 0x8ce5ff);
    this.physics.add.existing(this.mathGate, true);
    if (this.player) {
      this.physics.add.overlap(this.player, this.mathGate, this.processMathGate, undefined, this);
    }
    this.updateEducationalText();
  }

  private processMathGate() {
    if (!this.mathGate) return;
    const gap = Math.abs(this.score - this.mathGateTarget);
    if (gap <= 6) {
      this.score += 18;
      this.comboCount += 1;
      this.displayBreach("Math match! Combo boosted.");
    } else {
      this.applyPlayerDamage(5);
      this.comboCount = Math.max(1, Math.floor(this.comboCount / 2));
      this.displayBreach("Math gate rebuffed!");
    }
    this.comboText.setText(`Combo x${Math.max(1, this.comboCount)}`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.mathGate?.destroy();
    this.mathGate = undefined;
  }

  private scheduleEducationalEvents() {
    this.time.addEvent({ delay: 4200, loop: true, callback: this.spawnWordDrop, callbackScope: this });
    this.time.addEvent({ delay: 5800, loop: true, callback: this.spawnLetterOrb, callbackScope: this });
    this.time.addEvent({ delay: 4600, loop: true, callback: this.spawnNumberHazard, callbackScope: this });
    this.time.addEvent({ delay: 15000, loop: true, callback: this.spawnMathGate, callbackScope: this });
    this.time.addEvent({ delay: 11000, loop: true, callback: this.rotateWordLetter, callbackScope: this });
  }

  private rotateWordLetter() {
    this.wordDodgeLetter = Phaser.Utils.Array.GetRandom(LETTER_POOL);
    this.updateEducationalText();
  }

  private updateEducationalText() {
    const textLines = [
      `Dodge words starting with ${this.wordDodgeLetter}.`,
      `Collect letters to recharge MP (MP: ${this.playerMP}).`,
      `Pick numbers ≥ ${this.numberComparisonTarget}.`,
      `Math gate target: score ~ ${this.mathGateTarget || "??"}.`
    ];
    this.eduText?.setText(textLines.join("\n"));
  }

  private updateUI() {
    this.hpBar.clear();
    this.hpBar.fillStyle(0x21142f, 1);
    this.hpBar.fillRoundedRect(16, 16, 230, 12, 4);
    this.hpBar.fillStyle(0xff4d6d, 1);
    this.hpBar.fillRoundedRect(16, 16, Phaser.Math.Clamp((this.playerHP / 100) * 230, 0, 230), 12, 4);

    this.mpBar.clear();
    this.mpBar.fillStyle(0x131238, 1);
    this.mpBar.fillRoundedRect(16, 32, 230, 8, 3);
    this.mpBar.fillStyle(0x4cc7ff, 1);
    this.mpBar.fillRoundedRect(16, 32, Phaser.Math.Clamp((this.playerMP / 120) * 230, 0, 230), 8, 3);
  }

  private displayBreach(message: string) {
    const flash = this.add.text(400, 520, message, {
      fontSize: "18px",
      color: "#fffeae"
    })
      .setOrigin(0.5)
      .setDepth(5);
    this.time.delayedCall(1000, () => flash.destroy());
  }

  private applyPlayerDamage(amount: number) {
    this.playerHP = Math.max(0, this.playerHP - amount);
    if (this.playerHP <= 0) {
      this.endGameOver();
    }
  }

  private endGameOver() {
    globalGameState.score = this.score;
    globalGameState.playerHP = this.playerHP;
    globalGameState.playerMP = this.playerMP;
    globalGameState.isGameOver = true;
    this.scene.start("GameOverScene");
  }

  private handleHazardCollision(playerObj: ArcadePhysicsObject, hazardObj: ArcadePhysicsObject) {
    hazardObj.destroy();
    this.applyPlayerDamage(8);
  }

  private cleanupOutOfBounds() {
    this.wordGroup?.getChildren().forEach((child: GameObjectWithY) => {
      if (child.y > 620) {
        child.destroy();
      }
    });
    this.letterGroup?.getChildren().forEach((child: GameObjectWithY) => {
      if (child.y > 620) {
        child.destroy();
      }
    });
    this.numberGroup?.getChildren().forEach((child: GameObjectWithY) => {
      if (child.y > 620) {
        child.destroy();
      }
    });
  }
  };
}
