# 🌲 BitFoots Mini App — On-Chain Cryptid Expedition

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Phaser 3](https://img.shields.io/badge/Phaser-3.88-blue?style=for-the-badge&logo=phaser)](https://phaser.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Zcash](https://img.shields.io/badge/Zcash-Shielded%20ZK-F4B728?style=for-the-badge&logo=zcash)](https://z.cash/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> *"Never caught. You don't buy a Bitfoot, you spot him. The only price is the hunt."*

**BitFoots Mini App** is an on-chain retro-arcade cryptid recon game and verifiable telemetry platform built for the **BitFoots** ecosystem. Inspired by 19th-century naturalist field journals, 90° geometric pixel aesthetics, and privacy-preserving Zero-Knowledge mechanics, players track elusive legendary beasts across atmospheric dark forest sectors.

---

## 🧭 Key Features

- **🌲 Living World UI (Forest Noir Aesthetic)**:
  - Atmospheric dark theme featuring Deep Abyss Charcoal (`#14171c`), Antique Amber Gold (`#eaba49`), and Warm Parchment (`#ffddcc`).
  - Organic multi-layered environment: wind-swayed pines, drifting dual fog layers, and mysterious glowing golden eyes lurking in the deep forest shadows.
  
- **🕹️ 2D Retro-Arcade Game Engine (Phaser 3)**:
  - Precise 90° grid navigation, stealth tracking mechanics, footprint collection, and anomalous specimen sightings.
  - Multi-sector campaign:
    - **Sector 01**: *First Trace Expedition*
    - **Sector 02**: *The 90° Geometric Forest*
    - **Sector 03**: *Shielded ZK Expedition (Apex Challenge)*

- **👤 Operative Profiles & Authentic Avatars**:
  - Customizable hunter codenames and Web3 authentication (X / Twitter OAuth, Google, or Guest mode).
  - 18 authentic pixel BitFoot head variations dynamically rendered in-game and on hunter dossiers.
  - Real-time Zcash Unified Address (`u1...`) validation and verification.

- **🪪 Dynamic High-Resolution Export Card & Dossier Generator**:
  - In-browser SVG/Canvas rendering engine that generates cryptographic 1200x630 HD clearance passport cards.
  - Self-contained embedded Base64 avatar rendering with zero canvas taint or CORS friction.
  - 1-click **Download PNG**, **Copy to Clipboard**, and viral **Share on X** integration tagging `@shelby_tommy0` and `@BITFOOTS_`.

- **🛡️ Shielded ZK Telemetry & Leaderboards**:
  - Anti-cheat speed run verification, cryptographic integrity checksums, and global on-chain leaderboard telemetry backed by Supabase.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | Modern React framework with dynamic server routes |
| **Game Engine** | [Phaser 3](https://phaser.io/) (v3.88) | Lightweight 2D canvas/WebGL game engine |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (v5.7) | End-to-end static type safety |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Tokens | Strict adherence to the BitFoots Design System |
| **Database & Auth** | [Supabase](https://supabase.com/) | Real-time leaderboards, user profiles, and OAuth |
| **Audio Engine** | Web Audio API / Howler Architecture | Ambient wind loops, CRT hum, footprint crunches, and 8-bit chimes |
| **Social / OG** | HTML5 Canvas + Next.js Route Handlers | Dynamic 1200x630 cryptographic OG card synthesis |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.17+ or v20+ recommended
- **npm**, **yarn**, or **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/bitfoots-mini-app.git
   cd bitfoots-mini-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials (optional for offline guest play):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to begin the expedition.

---

## 📜 Project Structure

```text
bitfoots-mini-app/
├── app/
│   ├── api/
│   │   ├── chapter/complete/   # Anti-cheat telemetry validation & score submission
│   │   ├── leaderboard/        # Global hunter leaderboard endpoints
│   │   └── og/score/           # Dynamic 1200x630 BitFoots SVG/OG card generator
│   ├── auth/callback/          # Supabase OAuth redirect handlers
│   ├── layout.tsx              # Root HTML wrapper with CRT scanlines & fonts
│   └── page.tsx                # Main entry hub, HUD, and game controller
├── components/
│   ├── game/                   # Phaser viewport and container integrations
│   └── ui/                     # LivingWorldBackground, ExportCardModal, ProfileModal, etc.
├── game/
│   ├── config/                 # Sector definitions, tile configurations, and anomalies
│   └── scenes/                 # Phaser game scenes (Forest, Movement, Telemetry)
├── lib/
│   ├── audioManager.ts         # Synthesizer and spatial audio engine
│   ├── eventBus.ts             # Reactive decoupled event pipeline
│   └── supabaseClient.ts       # Database & authentication interfaces
└── public/
    └── bitfoot-heads/          # 18 authentic pixel BitFoot character heads
```

---

## 🤝 Community & Links

- **X (Twitter)**: [@BITFOOTS_](https://x.com/BITFOOTS_)
- **Expedition Lead**: Tommy Shelby ([@shelby_tommy0](https://x.com/shelby_tommy0))
- **Network**: Powered by [Zcash](https://z.cash/) Orchard Shielded Pool & Bitcoin Ordinals

---

## ⚖️ License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
