/**
 * Master Sector Configuration & Registry
 * Defines metadata, mechanical rules, difficulty curves, telemetry limits,
 * and verification gates for all 5 sectors of the BitFoots Expedition.
 */

export interface SectorGateQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  loreFact: string;
}

export interface SectorConfig {
  id: 1 | 2 | 3;
  code: string;
  shortCode: string;
  name: string;
  subTitle: string;
  shortSubTitle: string;
  clearance: "OPEN" | "ACTIVE" | "RESTRICTED" | "SEALED" | "MYTHIC";
  requiredPreviousSector: number | null;
  description: string;
  difficultyRating: "RECON" | "ELEVATED" | "HAZARDOUS" | "CRITICAL" | "APEX";
  mechanicTitle: string;
  mechanicDescription: string;
  coordinates: string;
  tracesRequired: number;
  timeLimitSeconds: number;
  minCompletionSeconds: number; // Anti-cheat floor
  sceneKey: string;
  gateQuestion: SectorGateQuestion;
}

export const SECTORS: Record<number, SectorConfig> = {
  1: {
    id: 1,
    code: "S-01",
    shortCode: "S 01",
    name: "Sector 1",
    subTitle: "Canopy Fog",
    shortSubTitle: "CANOPY",
    clearance: "OPEN",
    requiredPreviousSector: null,
    description:
      "Dense pine perimeter under rolling nocturnal mist. The cryptid herd leaves its earliest organic footprints here.",
    difficultyRating: "RECON",
    mechanicTitle: "Decaying Traces & Lantern Cone",
    mechanicDescription:
      "Navigate rolling fog with your lantern cone. Traces decay and blow away with the wind if neglected.",
    coordinates: "47°12'N 122°14'W",
    tracesRequired: 8,
    timeLimitSeconds: 120,
    minCompletionSeconds: 12,
    sceneKey: "Chapter1Scene",
    gateQuestion: {
      question: "How does one obtain a Bitfoot in the chain's deep forest?",
      options: [
        "By placing the highest bid at public auction",
        "By spotting him and patiently tracking his footprints",
        "By spamming random mint transactions to the contract",
        "By sweeping the floor on secondary marketplaces",
      ],
      correctAnswerIndex: 1,
      loreFact: "Never caught. You don’t buy a Bitfoot. You spot him. The only price is the hunt.",
    },
  },
  2: {
    id: 2,
    code: "S-02",
    shortCode: "S 02",
    name: "Sector 2",
    subTitle: "90° Glitch Lattice",
    shortSubTitle: "90° GRID",
    clearance: "ACTIVE",
    requiredPreviousSector: 1,
    description:
      "Shilo's geometric proving grounds. Orthogonal crystalline corridors where natural curvature is strictly forbidden.",
    difficultyRating: "ELEVATED",
    mechanicTitle: "Orthogonal Lock & Collapsing Grid",
    mechanicDescription:
      "Zero diagonal movement. Stepped tiles crumble into the void after 1.4 seconds. Beware of pulsing glitch lasers.",
    coordinates: "48°05'N 121°44'W",
    tracesRequired: 6,
    timeLimitSeconds: 100,
    minCompletionSeconds: 15,
    sceneKey: "Chapter2Scene",
    gateQuestion: {
      question: "What is an immutable design rule in Shilo's Bitfoot craftsmanship?",
      options: [
        "Soft circular gradients and 45° angled cross-hatches",
        "Strict 90° orthogonal angles, no heavy black outlines, and color stacking",
        "Purely randomized generative neural prompts",
        "Metallic 3D polygon bump-mapping",
      ],
      correctAnswerIndex: 1,
      loreFact:
        "Each Bitfoot is meticulously hand-crafted with strict 90-degree orthogonal geometry and color stacking.",
    },
  },
  3: {
    id: 3,
    code: "S-03",
    shortCode: "S 03",
    name: "Sector 3",
    subTitle: "Shielded ZK // FINAL",
    shortSubTitle: "FINAL ZK",
    clearance: "MYTHIC",
    requiredPreviousSector: 2,
    description:
      "The zero-knowledge privacy abyss and final proving grounds. Complete the acoustic echolocation trials and decrypt the terminal gate to conquer the expedition.",
    difficultyRating: "APEX",
    mechanicTitle: "Acoustic Sonar & Quantum Shift",
    mechanicDescription:
      "Near zero natural vision. Press [SPACE] to fire a sonar ping. Beware: sound-hunting shadow stalkers sprint toward echoes, and unobserved traces drift!",
    coordinates: "ZK-STARK // 0x546b",
    tracesRequired: 6,
    timeLimitSeconds: 90,
    minCompletionSeconds: 14,
    sceneKey: "Sector3Scene",
    gateQuestion: {
      question: "What cryptographic primitive shields transactions in zero-knowledge space?",
      options: [
        "Transparent unencrypted UTXO scripts",
        "ZK-SNARK / STARK proofs without revealing underlying witnesses",
        "Reversible custodial escrow contracts",
        "Centralized KYC signature attestations",
      ],
      correctAnswerIndex: 1,
      loreFact:
        "Zero-knowledge proofs permit mathematical verification of integrity with absolute concealment of trace history.",
    },
  },
};

export const SECTOR_LIST = Object.values(SECTORS);
