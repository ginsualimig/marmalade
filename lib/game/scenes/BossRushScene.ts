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

const WORD_COLLECTION_TARGETS = ["MATH", "PLAY", "GLOW"];


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
const PLAYER_DAMAGE_IFRAME_MS = 320;


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
  private playerAvatar?: Phaser.GameObjects.Container;
  private boss!: Phaser.GameObjects.Rectangle;
  private bossBody!: Phaser.Physics.Arcade.Body;
  private bossAvatar?: Phaser.GameObjects.Container;
  private ground!: Phaser.GameObjects.Rectangle;

  private hpBar!: Phaser.GameObjects.Graphics;
  private mpBar!: Phaser.GameObjects.Graphics;
  private comboText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossPhaseText!: Phaser.GameObjects.Text;
  private eduText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;

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
  private mathBank = 0;
  private educationalTip?: Phaser.GameObjects.Text;
  private educationalTipTimer?: Phaser.Time.TimerEvent;

  private touchState = { left: false, right: false };
  private isTransitioning = false;
  private lastPlayerDamageAt = -9999;
  private bossDefeatHandled = false;
  private gameOverHandled = false;
  private managedEvents: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super({ key: "BossRushScene" });
  }

  create() {
    this.isTransitioning = false;
    this.bossDefeatHandled = false;
    this.gameOverHandled = false;
    this.lastPlayerDamageAt = -9999;
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
    this.mathBank = 0;

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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupScene, this);
  }

  update() {
    this.handleMovement();
    this.handleAttacks();
    this.cleanupOutOfBounds();
    this.syncCharacterAvatars();
    this.updateUI();
    this.updateBossAura();
    this.updateActionCue();
  }

  private createWorld() {
    const skyGradient = this.add.graphics();
    skyGradient.fillGradientStyle(0x6b2cff, 0xff6fc2, 0x2f1263, 0x130427, 1);
    skyGradient.fillRect(0, 0, 800, 600);

    for (let i = 0; i < 26; i++) {
      const star = this.add
        .circle(Phaser.Math.Between(20, 780), Phaser.Math.Between(20, 280), Phaser.Math.Between(2, 6), 0xffffff, 0.45)
        .setDepth(0);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(800, 1900),
        yoyo: true,
        repeat: -1
      });
    }

    this.add.ellipse(170, 130, 160, 110, 0xffe59b, 0.32).setDepth(0);
    this.add.ellipse(660, 160, 130, 90, 0x90f6ff, 0.26).setDepth(0);
    this.add.rectangle(400, 536, 820, 146, 0x41156a, 0.55).setDepth(0);
    this.add.rectangle(400, 570, 820, 46, 0x7aff9f, 0.14).setDepth(0);
    this.ground = this.add
      .rectangle(400, 588, 820, 24, 0x8cff95)
      .setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0.45);
    this.physics.add.existing(this.ground, true);
  }

  private createPlayer() {
    this.player = this.add.rectangle(140, 520, 38, 60, 0xffffff, 0.01);
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
    this.playerAvatar = this.buildPlayerAvatar();
    this.physics.add.collider(this.player, this.ground);
  }

  private createBoss() {
    const bossColor = this.currentBoss?.color ?? 0xff5c8d;
    this.boss = this.add.rectangle(650, 470, 100, 120, bossColor, 0.01);
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
    this.bossAvatar = this.buildBossAvatar(bossColor);
    this.physics.add.collider(this.boss, this.ground);

    this.bossHP = this.currentBoss?.maxHP ?? 120;
    this.bossMaxHP = this.bossHP;
  }

  private buildPlayerAvatar() {
    const cape = this.add.triangle(0, 0, -12, 4, -48, 28, -12, 46, 0xff4da5, 0.9);
    const body = this.add.ellipse(0, 16, 46, 58, 0xffbe6f, 1).setStrokeStyle(3, 0xffefd0);
    const head = this.add.circle(0, -22, 21, 0xffdca7, 1).setStrokeStyle(3, 0xfff3d8);
    const cheekLeft = this.add.circle(-10, -18, 4, 0xff8db5, 0.8);
    const cheekRight = this.add.circle(10, -18, 4, 0xff8db5, 0.8);
    const eyeLeft = this.add.circle(-7, -24, 3.8, 0x2b1a34, 1);
    const eyeRight = this.add.circle(7, -24, 3.8, 0x2b1a34, 1);
    const eyeSparkL = this.add.circle(-6, -26, 1.5, 0xffffff, 1);
    const eyeSparkR = this.add.circle(8, -26, 1.5, 0xffffff, 1);
    const sword = this.add.rectangle(24, 8, 9, 38, 0xfff2a3, 0.95).setAngle(24);
    return this.add
      .container(this.player.x, this.player.y - 10, [cape, body, head, cheekLeft, cheekRight, eyeLeft, eyeRight, eyeSparkL, eyeSparkR, sword])
      .setDepth(4);
  }

  private buildBossAvatar(bossColor: number) {
    const crown = this.add.triangle(0, -62, -22, 2, 0, -26, 22, 2, 0xfff09f, 1).setStrokeStyle(2, 0xffffff, 0.4);
    const body = this.add.ellipse(0, 12, 116, 132, bossColor, 0.95).setStrokeStyle(4, 0xffffff, 0.55);
    const tummy = this.add.ellipse(0, 26, 56, 42, 0xffffff, 0.18);
    const cheekLeft = this.add.circle(-24, -6, 11, 0xffc3df, 0.7);
    const cheekRight = this.add.circle(24, -6, 11, 0xffc3df, 0.7);
    const eyeLeft = this.add.circle(-16, -16, 7, 0x112233, 1);
    const eyeRight = this.add.circle(16, -16, 7, 0x112233, 1);
    const eyeSparkL = this.add.circle(-14, -18, 2, 0xffffff, 0.95);
    const eyeSparkR = this.add.circle(18, -18, 2, 0xffffff, 0.95);
    const mouth = this.add.ellipse(0, 16, 34, 14, 0x0f1a26, 0.6);
    return this.add
      .container(this.boss.x, this.boss.y - 2, [crown, body, tummy, cheekLeft, cheekRight, eyeLeft, eyeRight, eyeSparkL, eyeSparkR, mouth])
      .setDepth(3);
  }

  private syncCharacterAvatars() {
    if (this.playerAvatar && this.player) {
      this.playerAvatar.setPosition(this.player.x, this.player.y - 10);
      const facingScale = this.playerFacing === "right" ? 1 : -1;
      this.playerAvatar.setScale(facingScale, 1);
    }
    if (this.bossAvatar && this.boss) {
      const pulse = 1 + Math.sin(this.time.now / 260) * 0.02;
      this.bossAvatar.setPosition(this.boss.x, this.boss.y - 2);
      this.bossAvatar.setScale(pulse);
    }
  }

  private createUI() {
    this.hpBar = this.add.graphics();
    this.mpBar = this.add.graphics();
    this.hpValueText = this.add
      .text(16, 4, `❤️ HP ${this.playerHP}/${PLAYER_HP_MAX}`, {
        fontSize: "16px",
        color: "#ffd4dd",
        fontStyle: "bold"
      })
      .setDepth(2);
    this.mpValueText = this.add
      .text(16, 44, `✨ MP ${this.playerMP}/${PLAYER_MP_MAX}`, {
        fontSize: "16px",
        color: "#c2f4ff",
        fontStyle: "bold"
      })
      .setDepth(2);
    this.bossHealthBar = this.add.graphics();
    this.bossHealthText = this.add
      .text(400, 6, `👑 ${this.currentBoss?.name} HP: ${this.bossHP}/${this.bossMaxHP}`, {
        fontSize: "18px",
        color: "#fff6ad",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0)
      .setDepth(2);
    this.comboText = this.add
      .text(16, 78, `🔥 Combo x${this.comboCount}`, {
        color: "#ffe290",
        fontSize: "20px",
        fontStyle: "bold"
      })
      .setDepth(2);
    this.scoreText = this.add
      .text(16, 106, `⭐ Score: ${this.score}`, {
        color: "#a9f8ff",
        fontSize: "20px",
        fontStyle: "bold"
      })
      .setDepth(2);
    this.highScoreText = this.add
      .text(610, 8, `🏆 ${this.highScore}`, {
        fontSize: "20px",
        color: "#b7f7ff",
        fontStyle: "bold"
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
      .text(16, 500, "", {
        fontSize: "14px",
        color: "#dff5ff"
      })
      .setDepth(2);

    this.add.rectangle(650, 520, 290, 140, 0x111a33, 0.9).setStrokeStyle(3, 0x93f3ff, 0.75).setDepth(1.8);
    this.objectiveText = this.add
      .text(520, 468, "", {
        fontSize: "13px",
        color: "#c7f6ff",
        wordWrap: { width: 250 }
      })
      .setDepth(2);
    this.updateUI();
    this.updateEducationalText();
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
    } else if (velocityX > 0) {
      this.playerFacing = "right";
    }

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
    if (this.isTransitioning || this.bossDefeatHandled) return;
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
    if (!this.bossAvatar) return;
    this.bossAvatar.setAlpha(0.45);
    this.time.delayedCall(90, () => {
      this.bossAvatar?.setAlpha(1);
    });
  }

  private handleBossDefeated() {
    if (this.bossDefeatHandled || this.isTransitioning) return;
    this.bossDefeatHandled = true;
    this.isTransitioning = true;
    playAudioCue("reward");
    this.spawnSparkBurst(this.boss.x, this.boss.y - 20, 0xfff18f);
    this.spawnSparkBurst(this.boss.x + 36, this.boss.y, 0xff9cea);
    this.spawnSparkBurst(this.boss.x - 36, this.boss.y, 0x95ecff);
    advanceBossIndex();
    globalGameState.score = this.score;
    globalGameState.playerHP = this.playerHP;
    globalGameState.playerMP = this.playerMP;
    globalGameState.combo = this.comboCount;
    this.bossTimer?.remove();
    this.bossPrepEvent?.remove(false);
    this.clearBossPrepSignal();
    this.time.delayedCall(420, () => {
      if (!this.scene.isActive()) return;
      this.scene.start("CutsceneScene", { bossName: this.currentBoss?.name });
    });
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
    if (!this.currentBoss || this.isTransitioning) return;
    const warningMessage =
      this.currentBossIndex === 0
        ? "Moonlight Manticore Lyra is summoning moon sparks!"
        : this.currentBossIndex === 1
        ? "Starwhirl Kraken Orion is stirring a sea swirl!"
        : "Blaze Phoenix is igniting flame spirals!";
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
    if (!this.currentBoss || this.isTransitioning) return;
    if (this.currentBossIndex === 0) {
      this.launchCharlotteMove();
    } else if (this.currentBossIndex === 1) {
      this.launchGeorgeMove();
    } else {
      this.launchPhoenixMove();
    }
  }

  private launchCharlotteMove() {
    const option = Phaser.Math.Between(0, 3);
    if (option === 0) {
      this.dashBossTowardPlayer(-360, -50);
      this.bossPhaseText.setText("Lyra moon-dashes!");
    } else if (option === 1) {
      this.launchCharlotteToyStorm();
    } else if (option === 2) {
      this.spawnCharlotteSlam();
    } else {
      this.launchProjectile("toy", 130, 0xffd6fb);
    }

    if (this.bossHP / this.bossMaxHP < 0.45 && !this.bossShield) {
      this.activateShieldPhase("Moon shield up! Block the stardust orbs!");
    }
  }

  private launchCharlotteToyStorm() {
    this.bossPhaseText.setText("Stardust storm incoming!");
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
    this.setHazardExpiry(slam, 2400);
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
      this.launchGeorgeSpin(5);
      this.bossPhaseText.setText("Orion spins a tidal spiral!");
    } else if (option === 1) {
      this.launchProjectile("diagonal", 160, 0x15ffa0);
    } else if (option === 2) {
      this.spawnDroolPuddle();
    } else {
      this.launchGeorgeSpinWave();
    }

    if (this.bossHP / this.bossMaxHP < 0.45 && !this.bossShield) {
      this.activateShieldPhase("Whirlpool surge! Brace for a mega spin!");
      this.launchGeorgeSpin(6);
    }
  }

  private launchGeorgeSpin(count: number) {
    this.bossPhaseText.setText("Tidal spin burst!");
    const color = 0x4dd0ff;
    for (let i = 0; i < count; i++) {
      this.scheduleManagedCall(i * 140, () => {
        if (!this.scene.isActive() || this.isTransitioning) return;
        const angle = (i / count) * Math.PI * 2;
        const projectile = this.add.circle(this.boss.x, this.boss.y, 10, color, 0.9);
        this.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * 240, Math.sin(angle) * 240);
        body.setAllowGravity(false);
        body.setCollideWorldBounds(false);
        this.hazardGroup?.add(projectile);
        this.setHazardExpiry(projectile, 1900);
        this.trimHazardCount();
        this.tweens.add({
          targets: projectile,
          alpha: 0,
          duration: 1700,
          ease: "Quad.easeIn",
          onComplete: () => projectile.destroy()
        });
      });
    }
  }

  private launchGeorgeSpinWave() {
    if (!this.player || this.isTransitioning) return;
    this.bossPhaseText.setText("Sea mist wave!");
    const wave = this.add.rectangle(this.player.x, 600, 260, 16, 0x15ffa0, 0.5);
    this.physics.add.existing(wave, true);
    this.hazardGroup?.add(wave);
    this.setHazardExpiry(wave, 2800);
    this.trimHazardCount();
    this.tweens.add({
      targets: wave,
      width: 420,
      alpha: 0,
      duration: 760,
      ease: "Quad.easeOut"
    });
    this.scheduleManagedCall(2500, () => {
      wave.destroy();
    });
  }

  private launchPhoenixMove() {
    const option = Phaser.Math.Between(0, 3);
    if (option === 0) {
      this.launchPhoenixSpiral();
      this.bossPhaseText.setText("Phoenix ignites flame spiral!");
    } else if (option === 1) {
      this.launchInfernoWave();
      this.bossPhaseText.setText("Inferno wave incoming!");
    } else if (option === 2) {
      this.launchFlameBarrage();
      this.bossPhaseText.setText("Flame barrage!");
    } else {
      this.launchProjectile("diagonal", 180, 0xff6b35);
      this.bossPhaseText.setText("Phoenix embers!");
    }

    if (this.bossHP / this.bossMaxHP < 0.45 && !this.bossShield) {
      this.activateShieldPhase("Nest rebirth! Phoenix rises with flames!");
      this.launchPhoenixSpiral();
    }
  }

  private launchPhoenixSpiral() {
    this.bossPhaseText.setText("Flame spiral erupting!");
    const color = 0xff6b35;
    for (let i = 0; i < 4; i++) {
      this.scheduleManagedCall(i * 120, () => {
        if (!this.scene.isActive() || this.isTransitioning) return;
        const angle = (i / 4) * Math.PI * 2;
        const projectile = this.add.circle(this.boss.x, this.boss.y, 12, color, 0.95);
        this.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * 260, Math.sin(angle) * 260);
        body.setAllowGravity(false);
        body.setCollideWorldBounds(false);
        this.hazardGroup?.add(projectile);
        this.setHazardExpiry(projectile, 1800);
        this.trimHazardCount();
        this.tweens.add({
          targets: projectile,
          alpha: 0,
          duration: 1600,
          ease: "Quad.easeIn",
          onComplete: () => projectile.destroy()
        });
      });
    }
  }

  private launchInfernoWave() {
    if (!this.player || this.isTransitioning) return;
    const wave = this.add.rectangle(this.player.x, 600, 280, 20, 0xff6b35, 0.6);
    this.physics.add.existing(wave, true);
    this.hazardGroup?.add(wave);
    this.setHazardExpiry(wave, 3000);
    this.trimHazardCount();
    this.tweens.add({
      targets: wave,
      width: 480,
      alpha: 0,
      duration: 800,
      ease: "Quad.easeOut"
    });
    this.scheduleManagedCall(2700, () => {
      wave.destroy();
    });
  }

  private launchFlameBarrage() {
    this.bossPhaseText.setText("Flame barrage!");
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        this.launchProjectile("toy", 140 + i * 15, 0xff6b35);
      });
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
    if (!this.player || this.isTransitioning) return;
    const radius = type === "diagonal" ? 10 : 12;
    const spawnX = this.boss.x - 20;
    const spawnY = this.boss.y - 20;
    const projectile = this.add.circle(spawnX, spawnY, radius, color);
    this.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(-speed, -Phaser.Math.Between(30, 90));
    body.setBounce(type === "diagonal" ? 0.1 : 0.5);
    body.setGravityY(type === "diagonal" ? 180 : 450);
    this.hazardGroup?.add(projectile);
    this.setHazardExpiry(projectile, 4600);
    this.trimHazardCount();
  }

  private spawnDroolPuddle() {
    if (!this.player || this.isTransitioning) return;
    const width = 140;
    const puddle = this.add.rectangle(this.player.x, 580, width, 16, 0x96f7ff, 0.5);
    this.physics.add.existing(puddle, true);
    this.hazardGroup?.add(puddle);
    this.setHazardExpiry(puddle, 4300);
    this.trimHazardCount();
    this.scheduleManagedCall(4200, () => {
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
    const x = Phaser.Math.Between(50, 750);
    const halo = this.add.circle(x, -10, 28, 0xfff173, 0.28).setStrokeStyle(3, 0xffffff, 0.6);
    const orb = this.add
      .text(x, -10, letter, {
        fontSize: "30px",
        fontStyle: "900",
        color: "#2b1a12",
        backgroundColor: "#fff082",
        padding: { left: 14, right: 14, top: 8, bottom: 8 }
      })
      .setOrigin(0.5)
      .setStroke("#ffffff", 3)
      .setDepth(2.5);
    this.physics.add.existing(orb);
    orb.setData("letter", letter);
    orb.setData("halo", halo);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 160);
    body.setBounce(0.2);
    this.letterGroup.add(orb);
    this.tweens.add({ targets: [orb, halo], scale: 1.08, duration: 460, yoyo: true, repeat: -1 });
  }

  private handleLetterCollision(playerObj: ArcadePhysicsObject, orbObj: ArcadePhysicsObject) {
    const orb = orbObj as Phaser.GameObjects.Text;
    const halo = orb.getData("halo") as Phaser.GameObjects.Arc | undefined;
    const letter = String(orb.getData("letter") ?? "").toUpperCase();
    this.playerMP = Math.min(PLAYER_MP_MAX, this.playerMP + 14);
    this.comboCount += 1;
    this.comboText.setText(`🔥 Combo x${this.comboCount}`);
    this.processLetterForWord(letter);
    this.addScore(8, 0xfff082, { x: orb.x, y: orb.y });
    this.spawnSparkBurst(orb.x, orb.y, 0xfff082);
    playAudioCue("reward");
    halo?.destroy();
    orb.destroy();
  }

  private spawnNumberHazard() {
    if (!this.numberGroup) return;
    const value = Phaser.Math.Between(1, 9);
    const x = Phaser.Math.Between(80, 720);
    const bubble = this.add.circle(x, -12, 24, 0x92ebff, 0.36).setStrokeStyle(3, 0xffffff, 0.8);
    const numberLabel = this.add
      .text(x, -12, `${value}`, {
        fontSize: "32px",
        color: "#10315f",
        fontStyle: "900"
      })
      .setOrigin(0.5)
      .setDepth(2.5);
    this.physics.add.existing(numberLabel);
    numberLabel.setData("value", value);
    numberLabel.setData("bubble", bubble);
    const body = numberLabel.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 135 + Math.random() * 70);
    this.numberGroup.add(numberLabel);
    this.tweens.add({ targets: [numberLabel, bubble], scale: 1.07, duration: 500, yoyo: true, repeat: -1 });
  }

  private handleNumberCollision(playerObj: ArcadePhysicsObject, numberObj: ArcadePhysicsObject) {
    const numberLabel = numberObj as Phaser.GameObjects.Text;
    const bubble = numberLabel.getData("bubble") as Phaser.GameObjects.Arc | undefined;
    const value = Number(numberLabel.getData("value")) || 0;
    if (value >= this.numberComparisonTarget) {
      this.mathBank = Math.min(40, this.mathBank + value);
      this.addScore(value * 4, 0x95e3ff, { x: numberLabel.x, y: numberLabel.y });
      this.comboCount += 2;
      playAudioCue("math");
      this.displayBreach(`Great pick! +${value} Math`);
      this.spawnSparkBurst(numberLabel.x, numberLabel.y, 0x95e3ff);
    } else {
      this.mathBank = Math.max(0, this.mathBank - value);
      this.applyPlayerDamage(7);
      this.comboCount = Math.max(0, this.comboCount - 1);
      this.displayBreach(`Oops! -${value} Math`);
    }
    this.comboText.setText(`🔥 Combo x${Math.max(1, this.comboCount)}`);
    this.numberComparisonTarget = Phaser.Math.Between(2, 8);
    bubble?.destroy();
    numberObj.destroy();
    this.updateEducationalText();
  }

  private spawnMathGate() {
    this.mathGate?.destroy();
    this.mathGateTarget = Phaser.Math.Between(12, 20);
    this.mathGateEquation = this.createMathEquation(this.mathGateTarget);
    this.mathGate = this.add
      .rectangle(400, 240, 280, 58, 0x8ce5ff, 0.3)
      .setStrokeStyle(4, 0xffffff, 0.9);
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
    const equation = this.mathGateEquation || `${this.mathGateTarget}`;
    if (this.mathBank >= this.mathGateTarget) {
      this.mathBank -= this.mathGateTarget;
      this.addScore(30, 0x8ce5ff, { x: this.mathGate?.x ?? 400, y: this.mathGate?.y ?? 240 });
      this.comboCount += 2;
      this.playerMP = Math.min(PLAYER_MP_MAX, this.playerMP + 12);
      this.displayBreach("Math gate solved! 🌟");
      this.showEducationalMessage(`Solved! ${equation} = ${this.mathGateTarget}.`);
      playAudioCue("math");
      this.spawnSparkBurst(this.mathGate?.x ?? 400, this.mathGate?.y ?? 240, 0x8ce5ff);
    } else {
      this.applyPlayerDamage(5);
      this.comboCount = Math.max(1, Math.floor(this.comboCount / 2));
      this.displayBreach("Math gate blocked: build Math Bank first.");
      this.showEducationalMessage(`Need Math Bank ${this.mathGateTarget}. Current: ${this.mathBank}.`);
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
    this.addScore(completed.length * 10, 0xfff082, { x: 400, y: 520 });
    this.playerMP = Math.min(PLAYER_MP_MAX, this.playerMP + 20);
    this.showEducationalMessage(`WORD COMPLETE! ${completed} 🎉`);
    playAudioCue("reward");
    this.spawnSparkBurst(400, 520, 0xfff082);
    this.spawnSparkBurst(440, 500, 0xffb6f2);
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
        ? `Math gate equation: ${this.mathGateEquation || this.mathGateTarget} = ${this.mathGateTarget}`
        : "Math gate approaching soon.";
    const textLines = [
      `SPELLING: ${word} (${this.wordProgress}/${word.length}) | next letter: ${nextLetter}`,
      `MATH: ${mathLine}`,
      `MATH BANK: ${this.mathBank}/${this.mathGateTarget || "?"}`,
      `NUMBER RULE: collect only numbers ≥ ${this.numberComparisonTarget}`,
      `WORD DODGE: avoid words starting with ${this.wordDodgeLetter}`
    ];
    this.eduText?.setText(textLines.join("\n"));

    const objectives = [
      "LEARNING OBJECTIVES",
      `• Spell ${word} by collecting letters in order`,
      `• Build Math Bank with numbers, then clear gate ${this.mathGateTarget}`,
      `• Current Bank: ${this.mathBank} | equation: ${this.mathGateEquation || "? + ?"}`,
      `• Keep MP above 25 for Dragon reward burst`,
      `• Correct numbers boost combo, wrong picks hurt HP`
    ];
    this.objectiveText?.setText(objectives.join("\n"));
  }

  private updateUI() {
    this.hpBar.clear();
    this.hpBar.fillStyle(0x21142f, 1);
    this.hpBar.fillRoundedRect(16, 20, 250, 14, 5);
    this.hpBar.fillStyle(0xff4d6d, 1);
    this.hpBar.fillRoundedRect(16, 20, Phaser.Math.Clamp((this.playerHP / PLAYER_HP_MAX) * 250, 0, 250), 14, 5);
    this.hpValueText?.setText(`❤️ HP ${Math.max(0, this.playerHP)}/${PLAYER_HP_MAX}`);

    this.mpBar.clear();
    this.mpBar.fillStyle(0x131238, 1);
    this.mpBar.fillRoundedRect(16, 38, 250, 12, 4);
    this.mpBar.fillStyle(0x4cc7ff, 1);
    this.mpBar.fillRoundedRect(16, 38, Phaser.Math.Clamp((this.playerMP / PLAYER_MP_MAX) * 250, 0, 250), 12, 4);
    this.mpValueText?.setText(`✨ MP ${Math.max(0, this.playerMP)}/${PLAYER_MP_MAX}`);

    this.bossHealthBar.clear();
    this.bossHealthBar.fillStyle(0x15152a, 1);
    this.bossHealthBar.fillRoundedRect(300, 12, 240, 12, 4);
    this.bossHealthBar.fillStyle(0xff9ae8, 1);
    this.bossHealthBar.fillRoundedRect(300, 12, Phaser.Math.Clamp((this.bossHP / Math.max(1, this.bossMaxHP)) * 240, 0, 240), 12, 4);
    this.bossHealthText?.setText(`👑 ${this.currentBoss?.name} HP: ${Math.max(0, this.bossHP)}/${this.bossMaxHP}`);
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

  private scheduleManagedCall(delay: number, callback: () => void) {
    const event = this.time.delayedCall(delay, callback);
    this.managedEvents.push(event);
    return event;
  }

  private setHazardExpiry(hazard: Phaser.GameObjects.GameObject, ttlMs: number) {
    hazard.setData("expiresAt", this.time.now + ttlMs);
  }

  private trimHazardCount(max = 42) {
    const hazards = this.hazardGroup?.getChildren() ?? [];
    if (hazards.length <= max) return;
    const removable = hazards.slice(0, hazards.length - max);
    removable.forEach((obj) => (obj as Phaser.GameObjects.GameObject).destroy());
  }

  private cleanupScene() {
    this.isTransitioning = true;
    this.bossTimer?.remove(false);
    this.bossPrepEvent?.remove(false);
    this.managedEvents.forEach((event) => event.remove(false));
    this.managedEvents = [];
    this.clearBossPrepSignal();
    this.touchState.left = false;
    this.touchState.right = false;
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

  private canTakeHazardDamage() {
    return this.time.now - this.lastPlayerDamageAt >= PLAYER_DAMAGE_IFRAME_MS;
  }

  private applyPlayerDamage(amount: number) {
    if (this.isTransitioning) return;
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
    if (this.gameOverHandled || this.isTransitioning) return;
    this.gameOverHandled = true;
    this.isTransitioning = true;
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
    if (!this.canTakeHazardDamage()) return;
    this.lastPlayerDamageAt = this.time.now;
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
        const textChild = child as Phaser.GameObjects.Text;
        const halo = textChild.getData("halo") as Phaser.GameObjects.Arc | undefined;
        halo?.destroy();
        child.destroy();
      }
    });
    this.numberGroup?.getChildren().forEach((child: GameObjectWithY) => {
      if (child.y > 620) {
        const textChild = child as Phaser.GameObjects.Text;
        const bubble = textChild.getData("bubble") as Phaser.GameObjects.Arc | undefined;
        bubble?.destroy();
        child.destroy();
      }
    });
    this.hazardGroup?.getChildren().forEach((child) => {
      const hazard = child as Phaser.GameObjects.GameObject & { x?: number; y?: number; alpha?: number; getData: (key: string) => unknown };
      const x = hazard.x ?? 0;
      const y = hazard.y ?? 0;
      const expiresAt = Number(hazard.getData("expiresAt") ?? 0);
      const expired = expiresAt > 0 && this.time.now >= expiresAt;
      const offscreen = x < -120 || x > 920 || y < -140 || y > 700;
      const faded = (hazard.alpha ?? 1) <= 0.02;
      if (expired || offscreen || faded) {
        hazard.destroy();
      }
    });
  }
  };
}
