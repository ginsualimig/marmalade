import React from "react";
export { KeeperCharacter, GoldBurstParticle, BluePuffParticle } from "./KeeperCharacter";

export interface OutfitState {
  hat?: string; // "wizard", "crown", "beanie", "bow"
  shirt?: string; // "stripe", "solid", "flower", "star"
  pants?: string; // "short", "long", "denim", "pattern"
  shoes?: string; // "sneaker", "boot", "slipper", "loafer"
}

interface CharacterVisualsProps {
  outfit: OutfitState;
  animated?: boolean; // for attack/hurt states
  size?: "small" | "large"; // for title vs battle
  className?: string;
}

/**
 * Renders a detailed, child-friendly player character with outfit customization.
 * Uses SVG-like shapes and CSS gradients to create a stylized, illustrated look.
 */
export function PlayerCharacter({
  outfit,
  animated = false,
  size = "large",
  className = ""
}: CharacterVisualsProps) {
  const baseSize = size === "large" ? 180 : 120;

  return (
    <div
      className={`player-character ${size} ${animated ? "animated" : ""} ${className}`}
      style={{ width: baseSize, height: baseSize * 1.3 }}
      role="img"
      aria-label="Your character"
    >
      {/* Shoes */}
      <div className={`shoe left ${outfit.shoes || "sneaker"}`} />
      <div className={`shoe right ${outfit.shoes || "sneaker"}`} />

      {/* Pants */}
      <div className={`pants ${outfit.pants || "short"}`} />

      {/* Shirt/Body */}
      <div className={`shirt ${outfit.shirt || "solid"}`} />

      {/* Arms */}
      <div className="arm left" />
      <div className="arm right" />

      {/* Neck */}
      <div className="neck" />

      {/* Head */}
      <div className="head">
        {/* Ears */}
        <div className="ear left" />
        <div className="ear right" />

        {/* Eyes */}
        <div className="eye left">
          <div className="pupil" />
          <div className="shine" />
        </div>
        <div className="eye right">
          <div className="pupil" />
          <div className="shine" />
        </div>

        {/* Nose */}
        <div className="nose" />

        {/* Mouth */}
        <div className="mouth" />

        {/* Cheeks */}
        <div className="cheek left" />
        <div className="cheek right" />
      </div>

      {/* Hat */}
      {outfit.hat && (
        <div className={`hat ${outfit.hat}`} />
      )}

      {/* Glow/aura effect */}
      <div className="character-glow" />
    </div>
  );
}

interface BossVisualsProps {
  bossId: "charlotte" | "george";
  animated?: boolean;
  size?: "small" | "large";
  className?: string;
}

/**
 * Renders detailed, kid-friendly boss visuals.
 * Charlotte: Sparkly Manticore with moon/star theme.
 * George: Gentle Kraken with water/tide theme.
 */
export function BossVisuals({
  bossId,
  animated = false,
  size = "large",
  className = ""
}: BossVisualsProps) {
  const baseSize = size === "large" ? 200 : 140;

  if (bossId === "charlotte") {
    return (
      <div
        className={`boss-charlotte ${size} ${animated ? "animated" : ""} ${className}`}
        style={{ width: baseSize, height: baseSize * 1.2 }}
        role="img"
        aria-label="Charlotte: Moonlight Manticore Lyra"
      >
        {/* Main body (manticore-lion shape) */}
        <div className="body-core" />

        {/* Four legs */}
        <div className="leg front-left" />
        <div className="leg front-right" />
        <div className="leg back-left" />
        <div className="leg back-right" />

        {/* Tail (sparkly, swept) */}
        <div className="tail">
          <div className="tail-segment s1" />
          <div className="tail-segment s2" />
          <div className="tail-segment s3" />
          <div className="sparkle sp1" />
          <div className="sparkle sp2" />
        </div>

        {/* Wings or mane flutter */}
        <div className="mane-left" />
        <div className="mane-right" />

        {/* Head (cat-like with mystical look) */}
        <div className="head">
          {/* Ears pointy */}
          <div className="ear left" />
          <div className="ear right" />

          {/* Eyes (mystical moon-like) */}
          <div className="eye left">
            <div className="moon" />
          </div>
          <div className="eye right">
            <div className="moon" />
          </div>

          {/* Magical third eye on forehead */}
          <div className="third-eye">
            <div className="iris" />
          </div>

          {/* Mouth (gentle smile) */}
          <div className="mouth" />
        </div>

        {/* Floating sparkles around boss */}
        <div className="sparkle-float s1" />
        <div className="sparkle-float s2" />
        <div className="sparkle-float s3" />
      </div>
    );
  }

  if (bossId === "george") {
    return (
      <div
        className={`boss-george ${size} ${animated ? "animated" : ""} ${className}`}
        style={{ width: baseSize, height: baseSize * 1.2 }}
        role="img"
        aria-label="George: Starwhirl Kraken Orion"
      >
        {/* Central body (soft, round) */}
        <div className="body-core" />

        {/* Eight tentacles */}
        <div className="tentacle t1">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t2">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t3">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t4">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t5">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t6">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t7">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>
        <div className="tentacle t8">
          <div className="suction s1" />
          <div className="suction s2" />
        </div>

        {/* Head area */}
        <div className="head">
          {/* Big round eyes */}
          <div className="eye left">
            <div className="pupil" />
            <div className="shine" />
          </div>
          <div className="eye right">
            <div className="pupil" />
            <div className="shine" />
          </div>

          {/* Small nose */}
          <div className="nose" />

          {/* Gentle mouth */}
          <div className="mouth" />
        </div>

        {/* Water bubble aura */}
        <div className="bubble b1" />
        <div className="bubble b2" />
        <div className="bubble b3" />

        {/* Swirl effect */}
        <div className="swirl-effect" />
      </div>
    );
  }

  return null;
}

/**
 * Arena background environment with kid-friendly aesthetic
 */
export function ArenaEnvironment() {
  return (
    <div className="arena-background" role="presentation" aria-hidden>
      {/* Layered ground */}
      <div className="ground-layer base" />
      <div className="ground-layer shadow" />

      {/* Decorative elements depending on mode */}
      <div className="arena-decoration left">
        <div className="banner" />
        <div className="streamer s1" />
        <div className="streamer s2" />
      </div>

      <div className="arena-decoration right">
        <div className="banner" />
        <div className="streamer s1" />
        <div className="streamer s2" />
      </div>

      {/* Magical/mystical particles */}
      <div className="particle-field">
        <div className="particle p1" />
        <div className="particle p2" />
        <div className="particle p3" />
        <div className="particle p4" />
        <div className="particle p5" />
      </div>
    </div>
  );
}
