"use client";

import dynamic from "next/dynamic";
import React from "react";

/**
 * Dynamic Game Container with SSR explicitly disabled.
 * Phaser depends strictly on window, document, and Canvas APIs.
 */
export const GameContainer = dynamic(
  () => import("./GameViewport").then((mod) => mod.GameViewport),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full aspect-[3/2] flex flex-col items-center justify-center bg-bitfoot-dark border border-bitfoot-border rounded-lg p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-bitfoot-accent border-t-transparent rounded-full animate-spin" />
        <div className="text-bitfoot-accent font-mono tracking-widest text-sm uppercase animate-pulse">
          Initializing Bitfoot Engine...
        </div>
        <p className="text-xs text-gray-400 font-mono">
          Loading 2D Pixel Canvas & Arcade Physics
        </p>
      </div>
    ),
  }
);

export default GameContainer;
