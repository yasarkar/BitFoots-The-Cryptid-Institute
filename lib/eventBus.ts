import mitt from "mitt";

/**
 * Event payloads for Phaser <-> React two-way communication across all 5 sectors.
 */
export type FootprintCollectedPayload = {
  id: string;
  scoreGained: number;
  totalScore: number;
  collectedCount: number;
  totalCount: number;
  remainingCount: number;
};

export type SecretDiscoveredPayload = {
  id: string;
  bonusScore: number;
  totalScore: number;
};

export type LoreModalPayload = {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  loreFact: string;
};

export interface ChapterScoreBreakdown {
  footprintsScore: number;
  validFootprintsCount: number;
  silhouetteScore: number;
  gateScore: number;
  speedBonus: number;
}

export type ChapterFinishedPayload = {
  success: boolean;
  chapterId?: number;
  totalScore: number;
  durationMs: number;
  timeElapsedSeconds: number;
  breakdown: ChapterScoreBreakdown;
  error?: string;
};

export type AnswerSubmittedPayload = {
  isCorrect: boolean;
  selectedOptionIndex: number;
};

export type SwitchChapterPayload = {
  chapterId: 1 | 2 | 3;
  autoStart?: boolean;
};

export type PlayerDamagedPayload = {
  currentHealth: number;
  maxHealth: number;
  reason: string;
};

export type GameOverPayload = {
  chapterId: number;
  reason: string;
};

export type SonarPingPayload = {
  x: number;
  y: number;
  radius: number;
};

export type HalvingEpochPayload = {
  epoch: number;
  secondsRemaining: number;
  multiplier: number;
};

export type BossStatePayload = {
  status: "patrol" | "flee" | "enraged" | "trapped";
  pillarsActive: number;
  totalPillars: number;
};

export type RestartGamePayload = {
  autoStart?: boolean;
};

export type AvatarChangedPayload = {
  avatarUrl: string;
};

/**
 * Registry of all events shared between Phaser and React UI
 */
export type GameEvents = {
  // Phaser -> React Events
  FOOTPRINT_COLLECTED: FootprintCollectedPayload;
  SECRET_DISCOVERED: SecretDiscoveredPayload;
  SHOW_LORE_MODAL: LoreModalPayload;
  CHAPTER_FINISHED: ChapterFinishedPayload;
  PLAYER_DAMAGED: PlayerDamagedPayload;
  GAME_OVER: GameOverPayload;
  SONAR_PING_TRIGGERED: SonarPingPayload;
  HALVING_EPOCH_TRIGGERED: HalvingEpochPayload;
  BOSS_STATE_CHANGED: BossStatePayload;

  // React -> Phaser Events
  START_GAME: void;
  ANSWER_SUBMITTED: AnswerSubmittedPayload;
  RESUME_GAME: void;
  RESTART_GAME: RestartGamePayload | void;
  TRIGGER_SONAR: void;
  TRIGGER_DASH: void;
  SWITCH_CHAPTER: SwitchChapterPayload;
  AVATAR_CHANGED: AvatarChangedPayload;
};


/**
 * Shared singleton event emitter instance
 */
export const gameEventBus = mitt<GameEvents>();
