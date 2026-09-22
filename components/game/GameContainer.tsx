"use client";

import dynamic from "next/dynamic";
import React from "react";

/**
 * Dynamic Game Container with SSR explicitly disabled.
 * Phaser depends strictly on window, document, and Canvas APIs.
 */
export const GameContainer = dynamic(() => import("./GameViewport").then((mod) => mod.GameViewport), {
  ssr: false,
  loading: () => (
    <div className="border-bitfoot-border flex aspect-[3/2] h-full w-full flex-col items-center justify-center space-y-4 rounded-lg border bg-bitfoot-dark p-6 text-center">
      <div className="border-bitfoot-accent h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      <div className="text-bitfoot-accent animate-pulse font-mono text-sm uppercase tracking-widest">
        Initializing Bitfoot Engine...
      </div>
      <p className="font-mono text-xs text-gray-400">Loading 2D Pixel Canvas & Arcade Physics</p>
    </div>
  ),
});

export default GameContainer;
