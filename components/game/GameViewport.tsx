"use client";

import React, { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { createGameConfig } from "@/game/config";

interface GameViewportProps {
  onGameReady?: (game: Phaser.Game) => void;
  className?: string;
}

/**
 * GameViewport
 * Houses the isolated Phaser 3 Canvas inside a React component lifecycle.
 * Prevents memory leaks by cleanly destroying the game instance on unmount.
 */
export const GameViewport: React.FC<GameViewportProps> = ({
  onGameReady,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Ensure we are strictly on the client side and container is mounted
    if (!containerRef.current || gameRef.current) return;

    // Initialize Phaser game instance
    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    if (onGameReady) {
      onGameReady(game);
    }

    // Cleanup phase: Prevents memory leaks & duplicate canvases during React 18 Strict Mode cycles
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameReady]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      <div
        ref={containerRef}
        id="phaser-game-container"
        className="w-full h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-bitfoot-border/60 bg-black"
        style={{
          aspectRatio: "3 / 2",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      />
    </div>
  );
};

export default GameViewport;
