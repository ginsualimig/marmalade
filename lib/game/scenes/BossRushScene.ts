import type PhaserModule from "phaser";
import { BOSS_DEFINITIONS } from "@/lib/game/data/bosses";
import { playAudioCue } from "@/lib/game/audio";
import { getHighScore, saveHighScore } from "@/lib/game/persistence";
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


const LETTER_POOL = ["A", "C", "D", "E", "G", "H", "L", "M", "N", "O", "P", "R", "S", "T", "W"];

const WORD_COLLECTION_TARGETS = ["MATH", "CODE", "GLOW"];


type AttackStyle = "light" | "heavy" | "dragon";

const ATTACK_CONFIG: Record<AttackStyle, { damage: number; width: number; height: number; color: number; mpCost: number; cooldown: number; duration: number; label: string }> = {
  light: {
    damage: 12,
    width: 68,
    height: 32,
    color: 0xfff1a8,
    mpCost: 0,
    cooldown: 220,
    duration: 180,
    label: "Slash"
  },
  heavy: {
    damage: 26,
    width: 92,
    height: 40,
    color: 0xffb495,
    mpCost: 4,
    cooldown: 420,
    duration: 260,
    label: "Slam"
  },
  dragon: {
    damage: 42,
    width: 140,
    height: 60,
    color: 0xff7cd1,
    mpCost: 25,
    cooldown: 900,
    duration: 320,
    label: "Dragon"
  }
};

const PLAYER_HP_MAX = 100;
const PLAYER_MP_MAX = 120;


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

  private highScore = 0;
  private highScoreText!: Phaser.GameObjects.Text;
  private bossWarningHalo?: Phaser.GameObjects.Ellipse;
  private bossWarningTween?: Phaser.Tweens.Tween;
  private bossPrepEvent?: Phaser.Time.TimerEvent;

  private wordGroup?: Phaser.Physics.Arcade.Group;
  private letterGroup?: Phaser.Physics.Arcade.Group;
  private numberGroup?: Phaser.Physics.Arcade.Group;
  private hazardGroup?: Phaser.Physics.Arcade.Group;
  private attackGroup?: Phaser.Physics.Arcade.Group;
  private bossHealthBar!: Phaser.GameObjects.Graphics;
  private bossAura?: Phaser.GameObjects.Ellipse;
  private hpValueText!: Phaser.GameObjects.Text;
  private mpValueText!: Phaser.GameObjects.Text;
  private bossHealthText!: Phaser.GameObjects.Text;
  private actionCue?: Phaser.GameObjects.Text;
  private playerFacing: "left" | "right" = "right";
  private lastAttackTime = 0;
  private dragonReadyAt = 0;
  private mpTicker?: Phaser.Time.TimerEvent;

  private mathGate?: Phaser.GameObjects.Rectangle;
  private mathGateTarget = 0;
  private numberComparisonTarget = 4;
  private wordDodgeLetter = "S";

  private wordCollectionTargets = WORD_COLLECTION_TARGETS;
  private currentWordIndex = 0;
  private wordProgress = 0;
  private mathGateEquation = "";
  private educationalTip?: Phaser.GameObjects.Text;
  private educationalTipTimer?: Phaser.Time.TimerEvent;

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

    this.highScore = getHighScore();

    this.cameras.main.setBackgroundColor(0x050014);
    this.physics.world.setBounds(0, 0, 800, 600);

    this.createWorld();
    this.createPlayer();
    this.createBoss();
    this.createUI();
    this.createGroups();
    this.initWordCollection();
    this.setupInput();
    this.rotateWordLetter();
    this.spawnMathGate();
    this.scheduleEducationalEvents();
    this.startBossLoop();
    this.startMPRegen();
  }

  update() {
    this.handleMovement();
    this.handleAttacks();
    this.cleanupOutOfBounds();
    this.updateUI();
    this.updateBossAura();
    this.updateActionCue();
  }

  private createWorld() {
    this.ground = this.add
      .rectangle(400, 588, 820, 24, 0x2d1244)
      .setOrigin(0.5);
    this.physics.add.existing(this.ground, true);
  }

  private createPlayer() {
    this.player = this.add.rectangle(140, 520, 38, 60, 0xffc573);
    this.playerFacing = "right";
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setBounce(0.1);
    this.playerBody.setSize(32, 56);
    this.playerBody.setMaxVelocity(260, 640);
    this.playerBody.setDragX(800);
    this.playerBody.setGravityY(900);
    this.player.setDepth(2);
    this.physics.add.collider(this.player, this.ground);
  }

  private createBoss() {
    const bossColor = this.currentBoss?.color ?? 0xff5c8d;
    this.boss = this.add.rectangle(650, 470, 100, 120, bossColor);
    this.bossAura = this.add
      .ellipse(this.boss.x, this.boss.y, 180, 120, bossColor, 0.2)
      .setStrokeStyle(2, 0xffffff, 0.2)
      .setDepth(0);
    this.boss.setDepth(1);
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
    this.hpValueText = this.add
      .text(16, 6, `HP ${this.playerHP}/${PLAYER_HP_MAX}`, {
        fontSize: "12px",
        color: "#ff9ea0"
      })
      .setDepth(2);
    this.mpValueText = this.add
      .text(16, 48, `MP ${this.playerMP}/${PLAYER_MP_MAX}`, {
        fontSize: "12px",
        color: "#8fdcff"
      })
      .setDepth(2);
    this.bossHealthBar = this.add.graphics();
    this.bossHealthText = this.add
      .text(400, 6, `${this.currentBoss?.name} HP: ${this.bossHP}/${this.bossMaxHP}`, {
        fontSize: "15px",
        color: "#ffd37f"
      })
      .setOrigin(0.5, 0)
      .setDepth(2);
    this.comboText = this.add
      .text(16, 76, `Combo x${this.comboCount}`, {
        color: "#ffd37f",
        fontSize: "16px"
      })
      .setDepth(2);
    this.scoreText = this.add
      .text(16, 102, `Score: ${this.score}`, {
        color: "#85f2ff",
        fontSize: "16px"
      })
      .setDepth(2);
    this.highScoreText = this.add
      .text(640, 6, `High Score: ${this.highScore}`, {
        fontSize: "15px",
        color: "#90f2ff"
      })
      .setOrigin(0, 0)
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
    this.attackGroup = this.physics.add.group();

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
    if (!this.playerBody || !this.player) return;
    let velocityX = 0;
    if ((this.cursors?.left?.isDown || this.touchState.left) && !this.cursors?.right?.isDown) {
      velocityX = -220;
    }
    if ((this.cursors?.right?.isDown || this.touchState.right) && !this.cursors?.left?.isDown) {
      velocityX = 220;
    }

    this.playerBody.setVelocityX(velocityX);
    if (velocityX < 0) {
      this.playerFacing = "left";
      this.player.setFillStyle(0xffb052);
    } else if (velocityX > 0) {
      this.playerFacing = "right";
      this.player.setFillStyle(0xffd27a);
    } else {
      this.player.setFillStyle(0xffc573);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.performJump();
      this.player.setFillStyle(0xfff2a3);
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

  private performAttack(style: AttackStyle) {
    if (!this.currentBoss) return;
    const config = ATTACK_CONFIG[style];
    const now = this.time.now;
    if (style !== "dragon" && now - this.lastAttackTime < config.cooldown) {
      return;
    }
    if (style === "dragon" && now < this.dragonReadyAt) {
      this.displayBreach("Dragon is still charging");
      return;
    }
    if (this.playerMP < config.mpCost) {
      this.displayBreach("Need more MP for Dragon Special");
      return;
    }
    this.playerMP = Math.max(0, this.playerMP - config.mpCost);
    if (style === "dragon") {
      this.dragonReadyAt = now + config.cooldown;
    } else {
      this.lastAttackTime = now;
    }

    this.spawnAttackEffect(style, config);
    playAudioCue("attack");
    this.showPlayerCue(config.label, config.color);

    let damage = config.damage;
    if (this.bossShield) {
      damage = Math.round(damage * 0.4);
      this.displayBreach("Shielded! Aim for a weak spot.");
    }

    this.applyComboDamage(damage);
  }

  private spawnAttackEffect(style: AttackStyle, config: (typeof ATTACK_CONFIG)[AttackStyle]) {
    if (!this.player) return;
    const direction = this.playerFacing === "right" ? 1 : -1;
    const zone = this.add.rectangle(
      this.player.x + direction * (config.width / 2 + 12),
      this.player.y - 6,
      config.width,
      config.height,
      config.color,
      0.68
    )
      .setOrigin(direction > 0 ? 0 : 1, 0.5)
      .setDepth(3);
    this.attackGroup?.add(zone);
    this.physics.add.existing(zone);
    const body = zone.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setImmovable(true);
    body.setEnable(false);
    this.tweens.add({
      targets: zone,
      alpha: 0,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: config.duration,
      ease: "Quad.easeOut",
      onComplete: () => zone.destroy()
    });
    if (style === "dragon") {
      this.spawnDragonBurst();
    }
  }

  private spawnDragonBurst() {
    if (!this.player) return;
    const circle = this.add
      .ellipse(this.player.x, this.player.y - 20, 64, 32, 0xff7cd1, 0.22)
      .setStrokeStyle(2, 0xff7cd1)
      .setDepth(2);
    this.tweens.add({
      targets: circle,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 640,
      ease: "Cubic.easeOut",
      onComplete: () => circle.destroy()
    });
  }

  private showPlayerCue(label: string, color: number) {
    if (!this.player) return;
    const hex = this.formatHexColor(color);
    if (!this.actionCue) {
      this.actionCue = this.add
        .text(this.player.x, this.player.y - 70, label, {
          fontSize: "20px",
          fontStyle: "bold",
          color: hex
        })
        .setOrigin(0.5)
        .setDepth(5);
    } else {
      this.actionCue.setText(label);
      this.actionCue.setColor(hex);
      this.actionCue.setAlpha(1);
    }
    this.tweens.add({
      targets: this.actionCue,
      y: this.player.y - 110,
      alpha: 0,
      duration: 520,
      ease: "Cubic.easeOut"
    });
  }

  private updateActionCue() {
    if (this.actionCue && this.player) {
      this.actionCue.setPosition(this.player.x, this.player.y - 70);
    }
  }

  private formatHexColor(color: number) {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  private updateBossAura() {
    if (!this.bossAura || !this.boss) return;
    const pulse = 1 + Math.sin(this.time.now / 230) * 0.08;
    this.bossAura.setScale(pulse);
    this.bossAura.setPosition(this.boss.x, this.boss.y);
    this.bossAura.setStrokeStyle(2, this.currentBoss?.color ?? 0xffffff, this.bossShield ? 0.6 : 0.25);
    if (this.bossWarningHalo) {
      this.bossWarningHalo.setPosition(this.boss.x, this.boss.y);
    }
  }

  private startMPRegen() {
    this.mpTicker?.remove(false);
    this.mpTicker = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: this.regenMP,
      callbackScope: this
    });
  }

  private regenMP() {
    if (this.playerMP >= PLAYER_MP_MAX) return;
    this.playerMP = Math.min(PLAYER_MP_MAX, this.playerMP + 6);
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
    const scoreGain = inflicted + this.comboCount * 2;
    const popupPosition = { x: this.boss?.x ?? 400, y: (this.boss?.y ?? 400) - 30 };
    this.addScore(scoreGain, this.currentBoss?.color ?? 0xff9ae8, popupPosition);
    this.comboText.setText(`Combo x${this.comboCount}`);
    this.triggerHitFlash();
    const sparkX = this.boss?.x ?? popupPosition.x;
    const sparkY = (this.boss?.y ?? popupPosition.y) - 10;
    this.spawnSparkBurst(sparkX, sparkY, this.currentBoss?.color ?? 0xff9ae8);

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
    this.bossPrepEvent?.remove(false);
    this.clearBossPrepSignal();
    this.scene.start("CutsceneScene", { bossName: this.currentBoss?.name });
  }

  private startBossLoop() {
    this.queueBossAction();
    this.bossTimer?.remove(false);
    this.bossTimer = this.time.addEvent({
      delay: 2100,
      loop: true,
      callback: this.queueBossAction,
      callbackScope: this
    });
  }

  private queueBossAction() {
    if (!this.currentBoss) return;
    const warningMessage =
      this.currentBoss.name === "Charlotte"
        ? "Charlotte is readying another toy!"
        : "George is winding up the next tantrum!";
    this.clearBossPrepSignal();
    this.showBossPrepSignal(warningMessage);
    playAudioCue("warning");
    this.bossPrepEvent?.remove(false);
    this.bossPrepEvent = this.time.delayedCall(520, () => {
      if (!this.scene.isActive()) return;
      this.performBossAction();
      this.clearBossPrepSignal();
      playAudioCue("boss");
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
    const option = Phaser.Math.Between(0, 3);
    if (option === 0) {
      this.dashBossTowardPlayer(-360, -50);
      this.bossPhaseText.setText("Charlotte charges!");
    } else if (option === 1) {
      this.launchCharlotteToyStorm();
    } else if (option === 2) {
      this.spawnCharlotteSlam();
    } else {
      this.launchProjectile("toy", 130, 0xffd6fb);
    }

    if (this.bossHP / this.bossMaxHP < 0.45 && !this.bossShield) {
      this.activateShieldPhase("Shield: block the toy throws!");
    }
  }

  private launchCharlotteToyStorm() {
    this.bossPhaseText.setText("Toy storm incoming!");
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 180, () => {
        this.launchProjectile("toy", 120 + i * 20, 0xffd6fb);
      });
    }
  }

  private spawnCharlotteSlam() {
    this.bossPhaseText.setText("Jump slam!");
    const slam = this.add.rectangle(this.boss.x, 580, 220, 18, 0xff9ae8, 0.6);
    this.physics.add.existing(slam);
    const body = slam.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.allowGravity = false;
    this.hazardGroup?.add(slam);
    this.tweens.add({
      targets: slam,
      width: 280,
      alpha: 0,
      duration: 700,
      ease: "Quad.easeIn"
    });
    this.time.delayedCall(2200, () => {
      slam.destroy();
    });
  }

  private launchGeorgeMove() {
    const option = Phaser.Math.Between(0, 3);
    if (option === 0) {
      this.launchGeorgeSpin(6);
      this.bossPhaseText.setText("George spins wildly!");
    } else if (option === 1) {
      this.launchProjectile("diagonal", 160, 0x15ffa0);
    } else if (option === 2) {
      this.spawnDroolPuddle();
    } else {
      this.launchGeorgeSpinWave();
    }

    if (this.bossHP / this.bossMaxHP < 0.45 && !this.bossShield) {
      this.activateShieldPhase("Meltdown! Intense tantrum spin");
      this.launchGeorgeSpin(8);
    }
  }

  private launchGeorgeSpin(count: number) {
    this.bossPhaseText.setText("Spin tantrum!");
    const color = 0x4dd0ff;
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 120, () => {
        const angle = (i / count) * Math.PI * 2;
        const projectile = this.add.circle(this.boss.x, this.boss.y, 10, color, 0.9);
        this.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220 - 15);
        body.setBounce(0.4);
        body.setGravityY(320);
        body.setCollideWorldBounds(true);
        this.hazardGroup?.add(projectile);
        this.time.delayedCall(2600, () => {
          projectile.destroy();
        });
      });
    }
  }

  private launchGeorgeSpinWave() {
    if (!this.player) return;
    this.bossPhaseText.setText("Drool wave!");
    const wave = this.add.rectangle(this.player.x, 600, 260, 16, 0x15ffa0, 0.5);
    this.physics.add.existing(wave, true);
    this.hazardGroup?.add(wave);
    this.tweens.add({
      targets: wave,
      width: 420,
      alpha: 0,
      duration: 760,
      ease: "Quad.easeOut"
    });
    this.time.delayedCall(2500, () => {
      wave.destroy();
    });
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
      this.comboCount += 1;
      this.comboText.setText(`Combo x${this.comboCount}`);
      this.addScore(word.length * 2, 0xfff1a8, { x: wordText.x, y: wordText.y });
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
    const letter = String(orb.getData("letter") ?? "").toUpperCase();
    this.playerMP = Math.min(PLAYER_MP_MAX, this.playerMP + 14);
    this.comboCount += 1;
    this.comboText.setText(`Combo x${this.comboCount}`);
    this.processLetterForWord(letter);
    this.addScore(4, 0xfff082, { x: orb.x, y: orb.y });
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
      this.addScore(value * 3, 0x95e3ff, { x: numberLabel.x, y: numberLabel.y });
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
    this.mathGateEquation = this.createMathEquation(this.mathGateTarget);
    this.mathGate = this.add
      .rectangle(400, 240, 200, 40, 0x8ce5ff, 0.2)
      .setStrokeStyle(2, 0x8ce5ff);
    this.physics.add.existing(this.mathGate, true);
    this.tweens.add({
      targets: this.mathGate,
      scaleX: 1.03,
      scaleY: 1.03,
      yoyo: true,
      repeat: -1,
      duration: 1800,
      ease: "Sine.easeInOut"
    });
    if (this.player) {
      this.physics.add.overlap(this.player, this.mathGate, this.processMathGate, undefined, this);
    }
    this.showEducationalMessage(`Math gate: ${this.mathGateEquation} = ${this.mathGateTarget}`);
    this.updateEducationalText();
  }

  private processMathGate() {
    if (!this.mathGate) return;
    const gap = Math.abs(this.score - this.mathGateTarget);
    const equation = this.mathGateEquation || `${this.mathGateTarget}`;
    if (gap <= 6) {
      this.addScore(18, 0x8ce5ff, { x: this.mathGate?.x ?? 400, y: this.mathGate?.y ?? 240 });
      this.comboCount += 1;
      this.displayBreach("Math match! Combo boosted.");
      this.showEducationalMessage(`Math gate success: ${equation} = ${this.mathGateTarget}`);
    } else {
      this.applyPlayerDamage(5);
      this.comboCount = Math.max(1, Math.floor(this.comboCount / 2));
      this.displayBreach("Math gate rebuffed!");
      this.showEducationalMessage(`Keep practicing: ${equation} = ${this.mathGateTarget}`);
    }
    this.comboText.setText(`Combo x${Math.max(1, this.comboCount)}`);
    this.scoreText.setText(`Score: ${this.score}`);
    this.mathGate?.destroy();
    this.mathGate = undefined;
    this.mathGateEquation = "";
    this.updateEducationalText();
  }

  private scheduleEducationalEvents() {
    this.time.addEvent({ delay: 4200, loop: true, callback: this.spawnWordDrop, callbackScope: this });
    this.time.addEvent({ delay: 5800, loop: true, callback: this.spawnLetterOrb, callbackScope: this });
    this.time.addEvent({ delay: 4600, loop: true, callback: this.spawnNumberHazard, callbackScope: this });
    this.time.addEvent({ delay: 15000, loop: true, callback: this.spawnMathGate, callbackScope: this });
    this.time.addEvent({ delay: 11000, loop: true, callback: this.rotateWordLetter, callbackScope: this });
  }


  private initWordCollection() {
    this.currentWordIndex = 0;
    this.wordProgress = 0;
    this.showEducationalMessage(`Spell ${this.getCurrentCollectionWord()} by collecting letters in order.`);
    this.updateEducationalText();
  }

  private processLetterForWord(letter: string) {
    const targetWord = this.getCurrentCollectionWord();
    const expected = targetWord[this.wordProgress] ?? "";
    if (letter === expected) {
      this.wordProgress += 1;
      this.showEducationalMessage(`Nice! ${letter} is letter ${this.wordProgress}/${targetWord.length} of ${targetWord}.`);
      if (this.wordProgress >= targetWord.length) {
        this.completeWordCollection();
        return;
      }
    } else {
      if (letter === targetWord[0]) {
        this.wordProgress = 1;
        this.showEducationalMessage(`${letter} starts ${targetWord}. Keep stacking the letters.`);
      } else {
        this.wordProgress = 0;
        this.showEducationalMessage(`Keep grabbing letters to spell ${targetWord}.`);
      }
    }
    this.updateEducationalText();
  }

  private completeWordCollection() {
    const completed = this.getCurrentCollectionWord();
    this.addScore(completed.length * 6, 0xfff082, { x: 400, y: 520 });
    this.playerMP = Math.min(PLAYER_MP_MAX, this.playerMP + 18);
    this.showEducationalMessage(`Word complete! ${completed} bonus: MP + score.`);
    this.currentWordIndex = (this.currentWordIndex + 1) % this.wordCollectionTargets.length;
    this.wordProgress = 0;
    this.updateEducationalText();
    this.time.delayedCall(900, () => {
      this.showEducationalMessage(`Next word: ${this.getCurrentCollectionWord()}`);
    });
  }

  private getCurrentCollectionWord() {
    return this.wordCollectionTargets[this.currentWordIndex];
  }

  private createMathEquation(target: number) {
    const firstOperand = Phaser.Math.Between(3, Math.max(3, target - 3));
    const secondOperand = target - firstOperand;
    return `${firstOperand} + ${secondOperand}`;
  }

  private showEducationalMessage(message: string) {
    this.educationalTip?.destroy();
    this.educationalTipTimer?.remove(false);
    this.educationalTip = this.add
      .text(400, 560, message, {
        fontSize: "14px",
        color: "#9df",
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.educationalTipTimer = this.time.addEvent({
      delay: 2200,
      loop: false,
      callback: () => {
        this.educationalTip?.destroy();
        this.educationalTip = undefined;
        this.educationalTipTimer = undefined;
      }
    });
  }

  private rotateWordLetter() {
    this.wordDodgeLetter = Phaser.Utils.Array.GetRandom(LETTER_POOL);
    this.updateEducationalText();
  }

  private updateEducationalText() {
    const word = this.getCurrentCollectionWord();
    const nextLetter = word[this.wordProgress] ?? "✔";
    const mathLine =
      this.mathGateTarget > 0
        ? `Math prompt: ${this.mathGateEquation || this.mathGateTarget} = ${this.mathGateTarget}`
        : "Math gate approaching soon.";
    const textLines = [
      `Word task: Spell ${word} (${this.wordProgress}/${word.length}) → next: ${nextLetter}`,
      mathLine,
      `Pick numbers ≥ ${this.numberComparisonTarget}.`,
      `Dodge words starting with ${this.wordDodgeLetter}.`,
      `MP reserve: ${this.playerMP}/${PLAYER_MP_MAX}.`
    ];
    this.eduText?.setText(textLines.join("\n"));

  }

  private updateUI() {
    this.hpBar.clear();
    this.hpBar.fillStyle(0x21142f, 1);
    this.hpBar.fillRoundedRect(16, 16, 230, 12, 4);
    this.hpBar.fillStyle(0xff4d6d, 1);
    this.hpBar.fillRoundedRect(16, 16, Phaser.Math.Clamp((this.playerHP / PLAYER_HP_MAX) * 230, 0, 230), 12, 4);
    this.hpValueText?.setText(`HP ${Math.max(0, this.playerHP)}/${PLAYER_HP_MAX}`);

    this.mpBar.clear();
    this.mpBar.fillStyle(0x131238, 1);
    this.mpBar.fillRoundedRect(16, 32, 230, 8, 3);
    this.mpBar.fillStyle(0x4cc7ff, 1);
    this.mpBar.fillRoundedRect(16, 32, Phaser.Math.Clamp((this.playerMP / PLAYER_MP_MAX) * 230, 0, 230), 8, 3);
    this.mpValueText?.setText(`MP ${Math.max(0, this.playerMP)}/${PLAYER_MP_MAX}`);

    this.bossHealthBar.clear();
    this.bossHealthBar.fillStyle(0x15152a, 1);
    this.bossHealthBar.fillRoundedRect(300, 12, 240, 12, 4);
    this.bossHealthBar.fillStyle(0xff9ae8, 1);
    this.bossHealthBar.fillRoundedRect(300, 12, Phaser.Math.Clamp((this.bossHP / Math.max(1, this.bossMaxHP)) * 240, 0, 240), 12, 4);
    this.bossHealthText?.setText(`${this.currentBoss?.name} HP: ${Math.max(0, this.bossHP)}/${this.bossMaxHP}`);
  }

  private spawnSparkBurst(x: number, y: number, tint: number) {
    for (let i = 0; i < 12; i++) {
      const spark = this.add
        .circle(x, y, Phaser.Math.Between(2, 5), tint, 0.9)
        .setDepth(4);
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 359));
      const distance = Phaser.Math.Between(30, 90);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.6,
        duration: 520,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy()
      });
    }
  }

  private addScore(amount: number, color: number, position?: { x: number; y: number }) {
    if (amount <= 0) return;
    this.score += amount;
    this.scoreText?.setText(`Score: ${this.score}`);
    this.refreshHighScore();
    this.spawnScorePopup(amount, color, position);
    playAudioCue("hit");
  }

  private spawnScorePopup(amount: number, color: number, position?: { x: number; y: number }) {
    const x = position?.x ?? this.player?.x ?? 400;
    const y = position?.y ?? this.player?.y ?? 320;
    const popup = this.add
      .text(x, y, `+${amount}`, {
        fontSize: "18px",
        fontStyle: "bold",
        color: this.formatHexColor(color)
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.tweens.add({
      targets: popup,
      y: y - 30,
      alpha: 0,
      duration: 720,
      ease: "Cubic.easeOut",
      onComplete: () => popup.destroy()
    });
  }

  private refreshHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreText?.setText(`High Score: ${this.highScore}`);
      saveHighScore(this.highScore);
    }
  }

  private flashPlayerDamage() {
    if (!this.player) return;
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut"
    });
  }

  private showBossPrepSignal(message: string) {
    if (!this.boss) return;
    this.bossWarningHalo?.destroy();
    this.bossWarningTween?.stop();
    this.bossWarningHalo = this.add
      .ellipse(this.boss.x, this.boss.y, 160, 140, 0xffda77, 0.22)
      .setDepth(0.4);
    this.bossWarningTween = this.tweens.add({
      targets: this.bossWarningHalo,
      scale: { from: 0.9, to: 1.35 },
      alpha: { from: 0.65, to: 0.1 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    this.bossPhaseText?.setText(message);
  }

  private clearBossPrepSignal() {
    this.bossWarningTween?.stop();
    this.bossWarningTween = undefined;
    if (this.bossWarningHalo) {
      this.bossWarningHalo.destroy();
      this.bossWarningHalo = undefined;
    }
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
    if (this.player) {
      playAudioCue("damage");
      this.spawnSparkBurst(this.player.x, this.player.y, 0xffb2b2);
      this.flashPlayerDamage();
    }
    if (this.playerHP <= 0) {
      this.endGameOver();
    }
  }

  private endGameOver() {
    globalGameState.score = this.score;
    globalGameState.playerHP = this.playerHP;
    globalGameState.playerMP = this.playerMP;
    globalGameState.isGameOver = true;
    this.bossPrepEvent?.remove(false);
    this.clearBossPrepSignal();
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
