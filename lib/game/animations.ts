/**
 * animations.ts
 * 
 * Attack animation system with composable, satisfying feedback.
 * Handles player attacks, boss attacks, impacts, visual feedback, and boss wind-ups.
 */

/**
 * Attack animation type: who is attacking and how it should play
 */
export type AttackMode = "none" | "hero" | "boss";

/**
 * Boss wind-up state: telegraphs incoming attack
 */
export type BossWindupState = "idle" | "tensing" | "ready" | "attack";

/**
 * Threat level for visual scaling (affects screen shake amplitude)
 */
export type ThreatLevel = "low" | "medium" | "high" | "critical";

/**
 * Visual feedback for damage hits
 */
export type DamageFeedbackType = {
  target: "boss" | "player";
  amount: number;
  critical?: boolean;
  combo?: number;
};

/**
 * Phase banner messages that appear during transitions
 */
export type PhaseBannerType =
  | "Boss Defeated!"
  | "Direct Hit!"
  | "Combo x2!"
  | "Combo x3!"
  | "Combo x4!"
  | "Combo x5+"
  | "Boss Attack!"
  | "Time Up!"
  | "Battle Start!"
  | "Adventure Resumed"
  | "Retry Boss"
  | string;

/**
 * Determine phase banner text based on game state
 */
export const getPhaseBanner = (
  isCorrect: boolean,
  streak: number,
  isTimeout: boolean,
  isBossDefeated: boolean
): PhaseBannerType | null => {
  if (isBossDefeated) return "Boss Defeated!";
  if (isTimeout) return "Time Up!";
  if (!isCorrect) return "Boss Attack!";
  
  const comboNum = streak + 1;
  if (comboNum >= 5) return `Combo x${comboNum}!`;
  if (comboNum >= 3) return `Combo x${comboNum}!`;
  if (comboNum >= 2) return `Combo x${comboNum}!`;
  
  return "Direct Hit!";
};

/**
 * Determine CSS animation classes for attack feedback
 */
export const getAttackClasses = (
  lastHit: "player" | "boss" | null,
  attackMode: AttackMode,
  timeoutFlash: boolean
): string[] => {
  const classes: string[] = [];
  
  if (lastHit === "player") classes.push("danger-flash");
  if (lastHit === "boss") classes.push("win-flash");
  if (attackMode === "boss") classes.push("screen-shake");
  if (attackMode === "hero") classes.push("hero-zoom");
  if (timeoutFlash) classes.push("timeout-blast");
  
  return classes;
};

/**
 * Animation timing constants (milliseconds)
 */
export const ANIMATION_TIMINGS = {
  ATTACK_DURATION: 700,
  DAMAGE_POP_DURATION: 900,
  PHASE_BANNER_DURATION: 1400,
  IMPACT_OVERLAY_DURATION: 550,
  HERO_ATTACK_DURATION: 620,
  BOSS_ATTACK_DURATION: 620,
  HURT_WOBBLE_DURATION: 580,
  PROJECTILE_DURATION: 550,
  IMPACT_BURST_DURATION: 450,
  BOSS_WINDUP_DURATION: 800,
  BOSS_TENSE_DURATION: 300,
  HIT_REACTION_POP_DURATION: 500,
  PARTICLE_BURST_DURATION: 1200,
  TRANSITION_DURATION: 600,
  SCREEN_SHAKE_DURATION: 450,
} as const;

/**
 * Screen shake amplitudes based on threat level (pixels)
 */
export const SCREEN_SHAKE_AMPLITUDE = {
  low: 2,
  medium: 4,
  high: 6,
  critical: 8,
} as const;

/**
 * Validation: ensure attack mode exists before rendering animations
 */
export const isValidAttackMode = (mode: unknown): mode is AttackMode => {
  return mode === "none" || mode === "hero" || mode === "boss";
};

/**
 * Get sprite animation class based on attack mode
 */
export const getSpriteAnimationClass = (
  spriteType: "hero" | "boss",
  attackMode: AttackMode,
  damageTaken: boolean
): string => {
  if (damageTaken) {
    return spriteType === "hero" ? "hero-hurt" : "boss-hurt";
  }
  
  if (spriteType === "hero" && attackMode === "hero") return "hero-attack";
  if (spriteType === "boss" && attackMode === "boss") return "boss-attack";
  
  return "";
};

/**
 * Get impact overlay animation type based on who is attacking
 */
export const getImpactOverlayType = (attackMode: AttackMode): "hero" | "boss" | null => {
  if (attackMode === "hero") return "hero";
  if (attackMode === "boss") return "boss";
  return null;
};

/**
 * Get projectile animation type
 */
export const getProjectileType = (
  attackMode: AttackMode
): "hero-shot" | "boss-shot" | null => {
  if (attackMode === "hero") return "hero-shot";
  if (attackMode === "boss") return "boss-shot";
  return null;
};

/**
 * Get impact burst position
 */
export const getImpactBurstPosition = (
  attackMode: AttackMode
): "left" | "right" | null => {
  if (attackMode === "hero") return "right";
  if (attackMode === "boss") return "left";
  return null;
};

/**
 * Helper: should we show impact burst?
 */
export const shouldShowImpactBurst = (attackMode: AttackMode): boolean => {
  return attackMode === "hero" || attackMode === "boss";
};

/**
 * Helper: should we show projectile?
 */
export const shouldShowProjectile = (attackMode: AttackMode): boolean => {
  return attackMode === "hero" || attackMode === "boss";
};

/**
 * Combo milestone messages for extra visual feedback
 */
export const getComboMilestoneMessage = (
  streak: number
): string | null => {
  const comboNum = streak + 1;
  
  if (comboNum === 3) return "3-Hit Combo!";
  if (comboNum === 5) return "5-Hit Rampage!";
  if (comboNum === 10) return "Legendary Streak!";
  if (comboNum % 5 === 0) return `${comboNum}-Hit Combo!`;
  
  return null;
};

/**
 * Timer urgency level for visual feedback
 */
export const getTimerUrgencyLevel = (
  secondsLeft: number,
  limit: number
): "normal" | "urgent" | "critical" => {
  const percent = (secondsLeft / limit) * 100;
  
  if (percent <= 12) return "critical";
  if (percent <= 25) return "urgent";
  return "normal";
};

/**
 * Accessibility aria-label for timer
 */
export const getTimerAriaLabel = (
  secondsLeft: number,
  urgency: "normal" | "urgent" | "critical"
): string => {
  if (urgency === "critical") return `Time critical: ${secondsLeft} seconds left`;
  if (urgency === "urgent") return `Time running out: ${secondsLeft} seconds left`;
  return `Time left: ${secondsLeft} seconds`;
};

/**
 * Get boss wind-up animation class based on state
 * Telegraphs incoming attacks with visual build-up
 */
export const getBossWindupClass = (
  windupState: BossWindupState
): string => {
  switch (windupState) {
    case "tensing":
      return "boss-windup-tense";
    case "ready":
      return "boss-windup-ready";
    case "attack":
      return "boss-windup-attack";
    default:
      return "";
  }
};

/**
 * Get directional arrow indicator class for incoming attack
 * Shows which direction the attack will come from
 */
export const getBossAttackArrowClass = (
  windupState: BossWindupState,
  isVisible: boolean
): string => {
  if (!isVisible || windupState === "idle") return "";
  return `attack-arrow ${windupState === "attack" ? "firing" : "charging"}`;
};

/**
 * Determine threat level based on boss HP percentage
 * Scales visual feedback intensity
 */
export const getThreatLevel = (bossHpPercent: number): ThreatLevel => {
  if (bossHpPercent > 75) return "low";
  if (bossHpPercent > 50) return "medium";
  if (bossHpPercent > 25) return "high";
  return "critical";
};

/**
 * Get screen shake class with threat-scaled amplitude
 */
export const getScreenShakeClass = (
  attackMode: AttackMode,
  threatLevel: ThreatLevel
): string => {
  if (attackMode !== "boss") return "";
  return `screen-shake screen-shake-${threatLevel}`;
};

/**
 * Get hit reaction class for character pop-up on damage
 */
export const getHitReactionClass = (
  target: "hero" | "boss",
  isCorrectHit: boolean
): string => {
  if (isCorrectHit) {
    return target === "hero" ? "" : "hit-reaction-pop-correct";
  }
  return target === "hero" ? "hit-reaction-recoil-wrong" : "";
};

/**
 * Should show particle burst (confetti or sparkles)
 */
export const shouldShowParticleBurst = (attackMode: AttackMode): boolean => {
  return attackMode === "hero" || attackMode === "boss";
};

/**
 * Get particle burst type and styling
 */
export const getParticleBurstType = (
  attackMode: AttackMode
): "confetti" | "sparkles" | null => {
  if (attackMode === "hero") return "confetti";
  if (attackMode === "boss") return "sparkles";
  return null;
};

/**
 * Generate particle positions for burst effect
 * Creates scattered particles around a center point
 */
export const generateParticlePositions = (
  burstType: "confetti" | "sparkles",
  centerX: number,
  centerY: number,
  count: number = 8
): Array<{ x: number; y: number; emoji: string; delay: number }> => {
  const particles = [];
  const emojis = burstType === "confetti" 
    ? ["🎉", "✨", "🌟", "⭐", "🎊", "💫", "🎈", "🎆"]
    : ["✨", "💫", "⭐", "🌟", "✨", "💫", "⭐", "🌟"];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = 40 + Math.random() * 20;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const delay = Math.random() * 0.1;
    
    particles.push({
      x,
      y,
      emoji: emojis[i % emojis.length],
      delay
    });
  }
  
  return particles;
};

/**
 * Calculate screen shake offset based on threat level
 * For manual shake application if CSS animation is not sufficient
 */
export const calculateScreenShakeOffset = (
  threatLevel: ThreatLevel,
  frameNumber: number
): { x: number; y: number } => {
  const amplitudes = SCREEN_SHAKE_AMPLITUDE[threatLevel];
  const pattern = [
    { x: -amplitudes, y: amplitudes },
    { x: amplitudes, y: -amplitudes },
    { x: -amplitudes * 0.75, y: amplitudes },
    { x: amplitudes * 0.75, y: -amplitudes },
    { x: -amplitudes * 0.5, y: 0 },
    { x: amplitudes * 0.5, y: 0 }
  ];
  
  return pattern[frameNumber % pattern.length];
};

/**
 * Boss wind-up progression: returns the current state based on elapsed time
 */
export const getBossWindupProgress = (elapsedMs: number): BossWindupState => {
  const tenseDuration = ANIMATION_TIMINGS.BOSS_TENSE_DURATION;
  const readyDuration = ANIMATION_TIMINGS.BOSS_WINDUP_DURATION - tenseDuration;
  
  if (elapsedMs < tenseDuration) return "tensing";
  if (elapsedMs < tenseDuration + readyDuration) return "ready";
  return "attack";
};

/**
 * Helper to determine if boss windup should be displayed
 */
export const shouldShowBossWindup = (
  windupState: BossWindupState,
  attackMode: AttackMode
): boolean => {
  return windupState !== "idle" && attackMode === "boss";
};

/**
 * Easing function: ease-out (for snappy animations)
 * Used for impact, pop-ups, and projectiles
 */
export const easeOut = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Easing function: ease-in-out (for building animations)
 * Used for wind-ups and transitions
 */
export const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

/**
 * Easing function: cubic-bezier approximation for bouncy pop (0.34, 1.56, 0.64, 1)
 * Used for satisfying hit reaction pop
 */
export const easeBounce = (t: number): number => {
  // Approximate cubic-bezier(0.34, 1.56, 0.64, 1) with custom easing
  if (t < 0.25) return 3.4 * t * t;
  if (t < 0.5) return 1.56 * (t - 0.25) * (t - 0.25) + 0.21;
  if (t < 0.75) return 0.64 * (t - 0.5) * (t - 0.5) + 0.64;
  return 1 - (1 - t) * (1 - t);
};
