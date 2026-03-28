/**
 * animations.ts
 * 
 * Attack animation system with composable, satisfying feedback.
 * Handles player attacks, boss attacks, impacts, and visual feedback.
 */

/**
 * Attack animation type: who is attacking and how it should play
 */
export type AttackMode = "none" | "hero" | "boss";

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
