"use client";

import { useEffect, useRef } from "react";
import createTitleScene from "@/lib/game/scenes/TitleScene";
import createBossRushScene, { TouchCommand } from "@/lib/game/scenes/BossRushScene";
import createGameOverScene from "@/lib/game/scenes/GameOverScene";
import createCutsceneScene from "@/lib/game/scenes/CutsceneScene";
import createVictoryScene from "@/lib/game/scenes/VictoryScene";

const TOUCH_EVENT = "marmalade-touch";

type PhaserModule = typeof import("phaser");
type PhaserModuleWithDefault = PhaserModule & { default?: PhaserModule };
type PhaserGameInstance = PhaserModule["Game"] extends new (...args: unknown[]) => infer Instance ? Instance : null;

export default function PhaserGame() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserGameInstance | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    let mounted = true;

    const initializeGame = async () => {
      const PhaserModuleImport = (await import("phaser")) as PhaserModuleWithDefault;
      const PhaserLib = (PhaserModuleImport.default ?? PhaserModuleImport) as PhaserModule;

      if (!mounted || !wrapperRef.current) return;

      const scenes = [
        createTitleScene(PhaserLib),
        createBossRushScene(PhaserLib),
        createGameOverScene(PhaserLib),
        createCutsceneScene(PhaserLib),
        createVictoryScene(PhaserLib)
      ];

      const config: Phaser.Types.Core.GameConfig = {
        type: PhaserLib.AUTO,
        parent: wrapperRef.current,
        width: 800,
        height: 600,
        backgroundColor: "#030114",
        scale: {
          mode: PhaserLib.Scale.FIT,
          autoCenter: PhaserLib.Scale.CENTER_BOTH
        },
        physics: {
          default: "arcade",
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
          }
        },
        scene: scenes
      };

      const phaserGame = new PhaserLib.Game(config);
      gameRef.current = phaserGame;
    };

    initializeGame();

    const handleTouch = (event: Event) => {
      const customEvent = event as CustomEvent<TouchCommand>;
      const command = customEvent.detail;
      if (!command) return;

      const scenes = gameRef.current?.scene.getScenes(true) ?? [];
      scenes.forEach((scene) => {
        scene.events.emit("touch-input", command);
      });
    };

    window.addEventListener(TOUCH_EVENT, handleTouch as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener(TOUCH_EVENT, handleTouch as EventListener);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={wrapperRef} className="phaser-game" aria-label="Marmalade game canvas" />;
}
