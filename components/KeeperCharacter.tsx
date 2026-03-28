import React, { useMemo } from "react";

interface KeeperCharacterProps {
  phase: "phase-1" | "phase-2" | "phase-3" | "critical"; // Tied to boss HP: 75%-100%, 50%-74%, 25%-49%, <25%
  animated?: boolean;
  size?: "small" | "large";
  className?: string;
}

/**
 * THE KEEPER OF PATIENCE
 * 
 * A warm, wise guardian figure with visual phases tied to boss HP.
 * 
 * Phase 1 (75%-100% HP): Calm, serene, patient
 * Phase 2 (50%-74% HP): Determined, focused, kind but stern
 * Phase 3 (25%-49% HP): Empowering, energizing, wisdom shining through
 * 
 * Color palette: Warm golds, creams, soft earth tones
 * Aesthetic: Peaceful sanctuary, never punitive, always encouraging
 */
export function KeeperCharacter({
  phase,
  animated = false,
  size = "large",
  className = ""
}: KeeperCharacterProps) {
  const baseSize = size === "large" ? 160 : 100;

  return (
    <div
      className={`keeper-sprite ${phase} ${animated ? "animated" : ""} ${className}`}
      style={{
        width: baseSize,
        height: baseSize * 1.3,
        position: "relative"
      }}
      role="img"
      aria-label={`The Keeper of Patience (${phase === "critical" ? "final challenge" : phase.replace('-', ' ')})`}
    >
      <div className="keeper-floor-glow" />
      <div className="keeper-glow" />
      <div className="keeper-halo-ring" />
      <div className="keeper-orbit orb-1" />
      <div className="keeper-orbit orb-2" />
      <div className="keeper-orbit orb-3" />
      <div className="keeper-pedestal" />

      <div className="keeper-body">
        <div className="keeper-crown" />
        <div className="keeper-brow left" />
        <div className="keeper-brow right" />

        <div className="keeper-face">
          <div className="keeper-cheek left" />
          <div className="keeper-cheek right" />
          <div className="keeper-eye left">
            <div className="keeper-eye-shine" />
          </div>
          <div className="keeper-eye right">
            <div className="keeper-eye-shine" />
          </div>
          <div className="keeper-nose" />
          <div className="keeper-mouth" />
          <div className="keeper-beard" />
        </div>

        <div className="keeper-hand left"><div className="keeper-palm" /></div>
        <div className="keeper-hand right"><div className="keeper-palm" /></div>
        <div className="keeper-sleeve left" />
        <div className="keeper-sleeve right" />
        <div className="keeper-robe">
          <div className="keeper-robe-trim" />
          <div className="keeper-robe-gem" />
        </div>
      </div>
    </div>
  );
}

/**
 * Arena Environment: The Keeper's Sanctuary
 * Soft lighting, natural colors, peaceful aesthetic
 */
export function ArenaEnvironment({
  className = ""
}: {
  className?: string;
}) {
  return (
    <div
      className={`arena-environment ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #faf6f1 0%, #f0e6d2 50%, #e8d5c4 100%)",
        borderRadius: "20px",
        overflow: "hidden"
      }}
    >
      {/* Soft lighting overlays for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 20% 80%, rgba(212, 165, 116, 0.1), transparent 40%)",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 80% 20%, rgba(232, 213, 196, 0.08), transparent 40%)",
          pointerEvents: "none"
        }}
      />

      {/* Subtle texture for peaceful, lived-in feel */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.04) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          opacity: 0.3
        }}
      />
    </div>
  );
}

/**
 * Particle Effect: Gold Burst (Celebration on correct)
 * Radiates outward with shimmer, no shame colors
 */
export function GoldBurstParticle({
  x,
  y,
  count = 8
}: {
  x: number;
  y: number;
  count?: number;
}) {
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const distance = 60 + ((i * 17) % 40);
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      return (
        <div
          key={i}
          className="particle-gold-burst"
          style={{
            left: x,
            top: y,
            "--tx": `${tx}px`,
            "--ty": `${ty}px`
          } as React.CSSProperties}
        />
      );
    }),
    [count, x, y]
  );

  return <>{particles}</>;
}

/**
 * Particle Effect: Cool Blue Puff (Gentle feedback on wrong)
 * Soft, kind feedback - never red or punitive
 */
export function BluePuffParticle({
  x,
  y,
  count = 6
}: {
  x: number;
  y: number;
  count?: number;
}) {
  const particles = useMemo(
    () => Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const distance = 45 + ((i * 13) % 35);
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      return (
        <div
          key={i}
          className="particle-blue-puff"
          style={{
            left: x,
            top: y,
            "--tx": `${tx}px`,
            "--ty": `${ty}px`
          } as React.CSSProperties}
        />
      );
    }),
    [count, x, y]
  );

  return <>{particles}</>;
}
