# 🌲 BitFoots Mini App — On-Chain Cryptid Expedition

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Phaser 3](https://img.shields.io/badge/Phaser-3.90-blue?style=for-the-badge&logo=phaser)](https://phaser.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Zcash](https://img.shields.io/badge/Zcash-Shielded%20ZK-F4B728?style=for-the-badge&logo=zcash)](https://z.cash/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> _"Never caught. You don't buy a Bitfoot, you spot him. The only price is the hunt."_

**BitFoots Mini App** is an on-chain retro-arcade cryptid recon game and verifiable telemetry platform built for the **BitFoots** ecosystem. Inspired by 19th-century naturalist field journals, 90° geometric pixel aesthetics, and privacy-preserving Zero-Knowledge mechanics, players track elusive legendary beasts across atmospheric dark forest sectors.

---

## 🧭 Key Features

- **🌲 Living World UI (Forest Noir Aesthetic)**:
  - Atmospheric dark theme featuring Deep Abyss Charcoal (`#14171c`), Antique Amber Gold (`#eaba49`), and Warm Parchment (`#ffddcc`).
  - Organic multi-layered environment: wind-swayed pines, drifting dual fog layers, and mysterious glowing golden eyes lurking in the deep forest shadows.

- **🕹️ 2D Retro-Arcade Game Engine (Phaser 3)**:
  - Precise 90° grid navigation, stealth tracking mechanics, footprint collection, and anomalous specimen sightings.
  - Multi-sector campaign:
    - **Sector 01**: _First Trace Expedition_
    - **Sector 02**: _The 90° Geometric Forest_
    - **Sector 03**: _Shielded ZK Expedition (Apex Challenge)_

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

| Layer               | Technology                                                   | Description                                                       |
| :------------------ | :----------------------------------------------------------- | :---------------------------------------------------------------- |
| **Framework**       | [Next.js 14](https://nextjs.org/) (App Router)               | Modern React framework with dynamic server routes                 |
| **Game Engine**     | [Phaser 3](https://phaser.io/) (v3.90)                       | Lightweight 2D canvas/WebGL game engine                           |
| **Language**        | [TypeScript](https://www.typescriptlang.org/) (v5.9)         | End-to-end static type safety                                     |
| **Styling**         | [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Tokens | Strict adherence to the BitFoots Design System                    |
| **Database & Auth** | [Supabase](https://supabase.com/)                            | Real-time leaderboards, user profiles, and OAuth                  |
| **Audio Engine**    | Web Audio API / Howler Architecture                          | Ambient wind loops, CRT hum, footprint crunches, and 8-bit chimes |
| **Social / OG**     | HTML5 Canvas + Next.js Route Handlers                        | Dynamic 1200x630 cryptographic OG card synthesis                  |

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
│   │   ├── chapter/start/      # Issues single-use run tokens before a survey begins
│   │   ├── chapter/complete/   # Anti-cheat telemetry validation & score submission
│   │   ├── leaderboard/        # Global hunter leaderboard (read-only)
│   │   ├── profile/            # Validated profile & progress writes (service role)
│   │   └── og/score/           # Dynamic 1200x630 BitFoots SVG/OG card generator
│   ├── auth/callback/          # Supabase OAuth redirect handlers
│   ├── layout.tsx              # Root HTML wrapper with CRT scanlines & fonts
│   └── page.tsx                # Main entry hub, HUD, and game controller
├── components/
│   ├── game/                   # Phaser viewport and container integrations
│   └── ui/                     # LivingWorldBackground, ExportCardModal, ProfileModal, etc.
├── game/
│   ├── config/                 # Sector definitions, tile configurations, and anomalies
│   └── scenes/                 # Phaser game scenes (Chapter1, Chapter2, Sector3 + shared BaseSector)
├── lib/
│   ├── apiGuard.ts             # JSON/size guards + in-memory rate limiter
│   ├── audioManager.ts         # Synthesizer and spatial audio engine
│   ├── avatarResolver.ts       # Safe local/remote avatar resolution for OG cards
│   ├── eventBus.ts             # Reactive decoupled event pipeline
│   ├── runTokens.ts            # Single-use HMAC run tokens (anti-replay)
│   ├── scoring.ts              # Single source of truth for scoring & anti-cheat
│   ├── supabaseClient.ts       # Auth + profile sync through the API routes
│   └── uuid.ts                 # Shared UUID validation helpers
└── public/
    └── bitfoot-heads/          # 18 authentic pixel BitFoot character heads
```

---

## 🔐 Security Model

Scores are **server-authoritative**: the browser only reports what happened, the backend decides
what it is worth.

### Run token flow (SEC-4)

1. `POST /api/chapter/start` — called when a survey begins. Returns a **single-use run token**
   (HMAC-SHA256 over `sectorId`, server timestamp and nonce) which is stored server side.
2. `POST /api/chapter/complete` — submits the token plus collected trace ids, the silhouette flag
   and the gate answer. The route then:
   - rejects non-JSON bodies (`415`) and payloads above 16 KB (`413`);
   - applies a sliding-window rate limit per IP (`429`);
   - verifies the token signature, its sector binding, freshness and single use, so a captured
     payload cannot be replayed;
   - derives the run duration from the token's server timestamp — client `startTime`/`endTime`
     values are ignored, so a forged clock cannot buy a "fast" clearance;
   - enforces the sector's `minCompletionSeconds` floor and `timeLimitSeconds` ceiling (+ latency
     grace);
   - scores only allow-listed, de-duplicated trace ids, capped at `tracesRequired`;
   - sanitises username, avatar URL and Zcash address before persistence;
   - writes through the service-role Supabase client (score insert + profile upsert + rank read).

Every rule lives in `lib/scoring.ts` as pure, unit-tested functions shared by the API routes, so
the client preview and the recorded score can never drift apart.

### Hardening summary

| Vector                           | Mitigation                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Fabricated score/timing payloads | Server-measured duration + single-use run tokens (`lib/runTokens.ts`)                                                      |
| Replayed completion payloads     | Tokens are consumed on first verification (`already consumed`)                                                             |
| Forged sector ids / trace ids    | `isChapterId` allow-list + per-sector trace id allow-list + cap                                                            |
| Public score minting             | `POST /api/leaderboard` removed; only verified completions are recorded                                                    |
| Anonymous profile hijacking      | `profiles` RLS now `auth.uid() = id`; guest writes go through `/api/profile` with the service role, and deletes are denied |
| Path traversal in OG cards       | `lib/avatarResolver.ts` keeps local avatars inside `/public` and blocks `..`                                               |
| SSRF via `?avatar=`              | Remote avatars must be https on a host allow-list, no redirects, `image/*` only, 2 MB cap                                  |
| Scripted spam                    | Sliding-window rate limits on start/complete/profile routes                                                                |

### Environment

`RUN_TOKEN_SECRET` should be set in production (falls back to `SUPABASE_SERVICE_ROLE_KEY`, then to
a local development default). See `.env.example`.

> Note: the rate limiter and the run-token store are in-memory (matching the mock data store).
> Multi-instance deployments should back them with a shared Redis/Postgres store.

---

## 🤝 Community & Links

- **X (Twitter)**: [@BITFOOTS_](https://x.com/BITFOOTS_)
- **Expedition Lead**: Tommy Shelby ([@shelby_tommy0](https://x.com/shelby_tommy0))
- **Network**: Powered by [Zcash](https://z.cash/) Orchard Shielded Pool & Bitcoin Ordinals

---

## ⚖️ License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
