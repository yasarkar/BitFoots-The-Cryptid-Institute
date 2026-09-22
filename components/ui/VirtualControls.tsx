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
    <div className={`flex select-none flex-col items-center ${className}`}>
      {/* Toggle button */}
      <div className="mb-1 flex w-full max-w-[280px] items-center justify-between px-1">
        <span className="text-bitfoot-accent/70 flex items-center gap-1 font-arcade text-[10px] tracking-widest">
          <Gamepad2 className="text-bitfoot-accent h-3 w-3" />
          TOUCH D-PAD
        </span>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="bg-bitfoot-card/80 border-bitfoot-border flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] text-gray-400 hover:text-white"
        >
          {isVisible ? (
            <>
              <EyeOff className="h-2.5 w-2.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="h-2.5 w-2.5" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      {isVisible && (
        <div className="border-bitfoot-borderBright/60 relative flex h-44 w-44 items-center justify-center rounded-2xl border bg-bitfoot-dark/80 p-2 shadow-2xl backdrop-blur-md">
          {/* Subtle Grid crosshair */}
          <div className="bg-bitfoot-border/40 pointer-events-none absolute inset-x-4 h-[1px]" />
          <div className="bg-bitfoot-border/40 pointer-events-none absolute inset-y-4 w-[1px]" />

          {/* D-Pad Buttons */}
          {/* UP */}
          <button
            onTouchStart={handleTouchStart("W")}
            onTouchEnd={handleTouchEnd("W")}
            onMouseDown={handleTouchStart("W")}
            onMouseUp={handleTouchEnd("W")}
            onMouseLeave={handleTouchEnd("W")}
            className="bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border-bitfoot-border hover:border-bitfoot-accent text-bitfoot-accent group absolute top-2 flex h-12 w-12 items-center justify-center rounded-xl border shadow-md transition-transform active:scale-95"
            aria-label="Move Up"
          >
            <ArrowUp className="h-5 w-5 transition-transform group-active:-translate-y-0.5" />
          </button>

          {/* DOWN */}
          <button
            onTouchStart={handleTouchStart("S")}
            onTouchEnd={handleTouchEnd("S")}
            onMouseDown={handleTouchStart("S")}
            onMouseUp={handleTouchEnd("S")}
            onMouseLeave={handleTouchEnd("S")}
            className="bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border-bitfoot-border hover:border-bitfoot-accent text-bitfoot-accent group absolute bottom-2 flex h-12 w-12 items-center justify-center rounded-xl border shadow-md transition-transform active:scale-95"
            aria-label="Move Down"
          >
            <ArrowDown className="h-5 w-5 transition-transform group-active:translate-y-0.5" />
          </button>

          {/* LEFT */}
          <button
            onTouchStart={handleTouchStart("A")}
            onTouchEnd={handleTouchEnd("A")}
            onMouseDown={handleTouchStart("A")}
            onMouseUp={handleTouchEnd("A")}
            onMouseLeave={handleTouchEnd("A")}
            className="bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border-bitfoot-border hover:border-bitfoot-accent text-bitfoot-accent group absolute left-2 flex h-12 w-12 items-center justify-center rounded-xl border shadow-md transition-transform active:scale-95"
            aria-label="Move Left"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-active:-translate-x-0.5" />
          </button>

          {/* RIGHT */}
          <button
            onTouchStart={handleTouchStart("D")}
            onTouchEnd={handleTouchEnd("D")}
            onMouseDown={handleTouchStart("D")}
            onMouseUp={handleTouchEnd("D")}
            onMouseLeave={handleTouchEnd("D")}
            className="bg-bitfoot-surface/90 hover:bg-bitfoot-moss/30 active:bg-bitfoot-moss/60 border-bitfoot-border hover:border-bitfoot-accent text-bitfoot-accent group absolute right-2 flex h-12 w-12 items-center justify-center rounded-xl border shadow-md transition-transform active:scale-95"
            aria-label="Move Right"
          >
            <ArrowRight className="h-5 w-5 transition-transform group-active:translate-x-0.5" />
          </button>

          {/* Center Hub */}
          <div className="border-bitfoot-accent/40 text-bitfoot-accent/60 pointer-events-none flex h-8 w-8 items-center justify-center rounded-full border bg-bitfoot-dark font-arcade text-[9px] shadow-inner">
            90°
          </div>
        </div>
      )}
    </div>
  );
};
