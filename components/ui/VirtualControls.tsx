"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gamepad2, Eye, EyeOff } from "lucide-react";

interface VirtualControlsProps {
  className?: string;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ className = "" }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Helper to trigger realistic keyboard events for Phaser
  const triggerKeyEvent = (key: string, type: "keydown" | "keyup") => {
    let keyCode = 0;
    let code = "";

    switch (key.toUpperCase()) {
      case "W":
      case "ARROWUP":
        keyCode = 87;
        code = "KeyW";
        break;
      case "A":
      case "ARROWLEFT":
        keyCode = 65;
        code = "KeyA";
        break;
      case "S":
      case "ARROWDOWN":
        keyCode = 83;
        code = "KeyS";
        break;
      case "D":
      case "ARROWRIGHT":
        keyCode = 68;
        code = "KeyD";
        break;
      default:
        return;
    }

    const event = new KeyboardEvent(type, {
      key,
      code,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
  };

  const handleTouchStart = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    triggerKeyEvent(key, "keydown");
  };

  const handleTouchEnd = (key: string) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    triggerKeyEvent(key, "keyup");
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Toggle button */}
      <div className="flex items-center justify-between w-full max-w-[280px] mb-1 px-1">
        <span className="text-[10px] font-arcade text-bitfoot-accent/70 tracking-widest flex items-center gap-1">
          <Gamepad2 className="w-3 h-3 text-bitfoot-accent" />
          TOUCH D-PAD
        </span>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1 bg-bitfoot-card/80 px-2 py-0.5 rounded border border-bitfoot-border"
        >
          {isVisible ? (
            <>
              <EyeOff className="w-2.5 h-2.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-2.5 h-2.5" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      {isVisible && (
        <div className="relative w-44 h-44 bg-bitfoot-dark/80 border border-bitfoot-borderBright/60 rounded-2xl p-2 backdrop-blur-md shadow-2xl flex items-center justify-center">
          {/* Subtle Grid crosshair */}
          <div className="absolute inset-x-4 h-[1px] bg-bitfoot-border/40 pointer-events-none" />
          <div className="absolute inset-y-4 w-[1px] bg-bitfoot-border/40 pointer-events-none" />

          {/* D-Pad Buttons */}
          {/* UP */}
          <button
            onTouchStart={handleTouchStart("W")}
            onTouchEnd={handleTouchEnd("W")}
            onMouseDown={handleTouchStart("W")}
            onMouseUp={handleTouchEnd("W")}
            onMouseLeave={handleTouchEnd("W")}
            className="absolute top-2 w-12 h-12 rounded-xl bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border border-bitfoot-border hover:border-bitfoot-accent active:scale-95 transition-transform flex items-center justify-center text-bitfoot-accent shadow-md group"
            aria-label="Move Up"
          >
            <ArrowUp className="w-5 h-5 group-active:-translate-y-0.5 transition-transform" />
          </button>

          {/* DOWN */}
          <button
            onTouchStart={handleTouchStart("S")}
            onTouchEnd={handleTouchEnd("S")}
            onMouseDown={handleTouchStart("S")}
            onMouseUp={handleTouchEnd("S")}
            onMouseLeave={handleTouchEnd("S")}
            className="absolute bottom-2 w-12 h-12 rounded-xl bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border border-bitfoot-border hover:border-bitfoot-accent active:scale-95 transition-transform flex items-center justify-center text-bitfoot-accent shadow-md group"
            aria-label="Move Down"
          >
            <ArrowDown className="w-5 h-5 group-active:translate-y-0.5 transition-transform" />
          </button>

          {/* LEFT */}
          <button
            onTouchStart={handleTouchStart("A")}
            onTouchEnd={handleTouchEnd("A")}
            onMouseDown={handleTouchStart("A")}
            onMouseUp={handleTouchEnd("A")}
            onMouseLeave={handleTouchEnd("A")}
            className="absolute left-2 w-12 h-12 rounded-xl bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border border-bitfoot-border hover:border-bitfoot-accent active:scale-95 transition-transform flex items-center justify-center text-bitfoot-accent shadow-md group"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5 group-active:-translate-x-0.5 transition-transform" />
          </button>

          {/* RIGHT */}
          <button
            onTouchStart={handleTouchStart("D")}
            onTouchEnd={handleTouchEnd("D")}
            onMouseDown={handleTouchStart("D")}
            onMouseUp={handleTouchEnd("D")}
            onMouseLeave={handleTouchEnd("D")}
            className="absolute right-2 w-12 h-12 rounded-xl bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border border-bitfoot-border hover:border-bitfoot-accent active:scale-95 transition-transform flex items-center justify-center text-bitfoot-accent shadow-md group"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5 group-active:translate-x-0.5 transition-transform" />
          </button>

          {/* Center Hub */}
          <div className="w-8 h-8 rounded-full bg-bitfoot-dark border border-bitfoot-accent/40 flex items-center justify-center text-[9px] font-arcade text-bitfoot-accent/60 pointer-events-none shadow-inner">
            90°
          </div>
        </div>
      )}
    </div>
  );
};
