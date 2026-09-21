import * as Phaser from "phaser";
import { Chapter1Scene } from "./scenes/Chapter1Scene";
import { Chapter2Scene } from "./scenes/Chapter2Scene";
import { Sector3Scene } from "./scenes/Sector3Scene";

/**
 * Creates the Phaser 3 Game Configuration object
 * Mounts the 3 Sector Scenes (Canopy, 90° Lattice, and Shielded ZK Final)
 */
export const createGameConfig = (
  parentElement: HTMLElement
): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent: parentElement,
    width: 480,
    height: 320,
    backgroundColor: "#0a0c10",
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 480,
      height: 320,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [Chapter1Scene, Chapter2Scene, Sector3Scene],
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
  };
};
