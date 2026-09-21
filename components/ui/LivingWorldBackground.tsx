"use client";

import React, { memo } from "react";

// Curated atmospheric eye positions scattered across the dark forest (from original BitFoots design)
const FOREST_EYES = [
  { x: "6%", y: "30%", s: 9, bt: "5.59s", bd: "-5.00s", lt: "17.59s", ld: "-15.72s" },
  { x: "21%", y: "42%", s: 6, bt: "8.19s", bd: "-2.26s", lt: "15.38s", ld: "-4.24s" },
  { x: "15%", y: "60%", s: 7, bt: "6.58s", bd: "-4.33s", lt: "13.18s", ld: "-8.67s" },
  { x: "9%", y: "80%", s: 11, bt: "4.98s", bd: "-0.20s", lt: "19.97s", ld: "-0.80s" },
  { x: "91%", y: "27%", s: 8, bt: "7.57s", bd: "-3.19s", lt: "17.76s", ld: "-7.49s" },
  { x: "81%", y: "49%", s: 10, bt: "5.97s", bd: "-4.80s", lt: "15.56s", ld: "-12.50s" },
  { x: "94%", y: "67%", s: 7, bt: "8.57s", bd: "-1.59s", lt: "13.35s", ld: "-2.48s" },
  { x: "79%", y: "84%", s: 9, bt: "6.96s", bd: "-3.95s", lt: "20.15s", ld: "-11.44s" },
];

export const LivingWorldBackground: React.FC = memo(() => {
  return (
    <div className="bitfoots-world world" aria-hidden="true">
      {/* 4 Multi-layered Parallax Forest Silhouettes with Sway Animation */}
      <picture>
        <img
          className="bitfoots-world__trees"
          style={{ "--z": 0 } as React.CSSProperties}
          src="/images/world/tree-0.webp"
          alt=""
          decoding="async"
        />
      </picture>
      <picture>
        <img
          className="bitfoots-world__trees"
          style={{ "--z": 1 } as React.CSSProperties}
          src="/images/world/tree-1.webp"
          alt=""
          decoding="async"
        />
      </picture>
      <picture>
        <img
          className="bitfoots-world__trees"
          style={{ "--z": 2 } as React.CSSProperties}
          src="/images/world/tree-2.webp"
          alt=""
          decoding="async"
        />
      </picture>
      <picture>
        <img
          className="bitfoots-world__trees"
          style={{ "--z": 3 } as React.CSSProperties}
          src="/images/world/tree-3.webp"
          alt=""
          decoding="async"
        />
      </picture>

      {/* Atmospheric Forest Mist / Fog Layer 1 (Slow Horizontal Drift) */}
      <div className="bitfoots-world__fog" />

      {/* Lurking Cryptid Eyes in the Forest Shadows */}
      <div className="bitfoots-world__eyes">
        {FOREST_EYES.map((eye, idx) => (
          <span
            key={idx}
            className="bitfoots-eye-pair"
            style={
              {
                "--x": eye.x,
                "--y": eye.y,
                "--s": `${eye.s}px`,
                "--bt": eye.bt,
                "--bd": eye.bd,
                "--lt": eye.lt,
                "--ld": eye.ld,
              } as React.CSSProperties
            }
          >
            <span className="bitfoots-eye" />
            <span className="bitfoots-eye" />
          </span>
        ))}
      </div>

      {/* Atmospheric Near Fog Layer 2 (Reverse Drift) */}
      <div className="bitfoots-world__fog bitfoots-world__fog--near" />
    </div>
  );
});

LivingWorldBackground.displayName = "LivingWorldBackground";
