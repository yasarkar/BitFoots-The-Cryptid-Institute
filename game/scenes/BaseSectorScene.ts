import * as Phaser from "phaser";
import {
  gameEventBus,
  AnswerSubmittedPayload,
  ChapterFinishedPayload,
  SwitchChapterPayload,
  AvatarChangedPayload,
} from "@/lib/eventBus";
import { SECTORS, SectorConfig } from "@/game/config/sectors";

export abstract class BaseSectorScene extends Phaser.Scene {
  public abstract readonly sectorId: 1 | 2 | 3;
  protected sectorConfig!: SectorConfig;

  // Player & Controls
  protected player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  protected spaceKey!: Phaser.Input.Keyboard.Key;

  // Session & Telemetry State
  protected score: number = 0;
  protected collectedIds: string[] = [];
  protected health: number = 3;
  protected maxHealth: number = 3;
  protected isInvulnerable: boolean = false;
  protected startTime: number = 0;
  protected gateActivated: boolean = false;
  protected isGameOver: boolean = false;

  // Optional Lantern / Dark Mask
  protected darknessLayer?: Phaser.GameObjects.RenderTexture;
  protected lanternRadius: number = 120;

  // Event handler references for clean removal
  private onStartGameHandler?: () => void;
  private onAnswerSubmittedHandler?: (data: AnswerSubmittedPayload) => void;
  private onResumeGameHandler?: () => void;
  private onRestartGameHandler?: () => void;
  private onSwitchChapterHandler?: (data: SwitchChapterPayload) => void;
  private onAvatarChangedHandler?: (data: AvatarChangedPayload) => void;

  constructor(sceneConfig: string | Phaser.Types.Scenes.SettingsConfig) {
    super(sceneConfig);
  }

  protected autoStartOnCreate: boolean = false;
  protected isExpeditionActive: boolean = false;

  init(data?: { autoStart?: boolean }) {
    this.sectorConfig = SECTORS[this.sectorId];
    this.autoStartOnCreate = !!data?.autoStart;
  }

  protected resetBaseState() {
    this.score = 0;
    this.collectedIds = [];
    this.health = 3;
    this.isInvulnerable = false;
    this.gateActivated = false;
    this.isGameOver = false;
    this.startTime = Date.now();
    if (this.autoStartOnCreate) {
      this.isExpeditionActive = true;
      this.physics.resume();
    } else {
      this.isExpeditionActive = false;
      this.physics.pause();
    }
  }

  protected setupBaseControls() {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
      }) as typeof this.wasdKeys;
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  protected setupBaseEventBus() {
    this.onStartGameHandler = () => {
      this.isExpeditionActive = true;
      this.physics.resume();
      this.startTime = Date.now();
    };

    this.onResumeGameHandler = () => {
      this.physics.resume();
    };

    this.onRestartGameHandler = (data?: { autoStart?: boolean }) => {
      const autoStart = data?.autoStart ?? true;
      this.scene.restart({ autoStart });
    };


    this.onSwitchChapterHandler = (data: SwitchChapterPayload) => {
      const autoStart = data?.autoStart ?? false;
      if (data.chapterId === this.sectorId) {
        this.scene.restart({ autoStart });
      } else {
        const nextSceneKey = SECTORS[data.chapterId]?.sceneKey;
        if (nextSceneKey) {
          this.scene.start(nextSceneKey, { autoStart });
        }
      }
    };

    this.onAnswerSubmittedHandler = async (data: AnswerSubmittedPayload) => {
      await this.handleAnswerSubmission(data);
    };

    this.onAvatarChangedHandler = (data: AvatarChangedPayload) => {
      this.refreshPlayerAvatarTexture(data.avatarUrl);
    };

    gameEventBus.on("START_GAME", this.onStartGameHandler);
    gameEventBus.on("RESUME_GAME", this.onResumeGameHandler);
    gameEventBus.on("RESTART_GAME", this.onRestartGameHandler);
    gameEventBus.on("SWITCH_CHAPTER", this.onSwitchChapterHandler);
    gameEventBus.on("ANSWER_SUBMITTED", this.onAnswerSubmittedHandler);
    gameEventBus.on("AVATAR_CHANGED", this.onAvatarChangedHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupBaseEventBus, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupBaseEventBus, this);
  }

  protected cleanupBaseEventBus() {
    if (this.onStartGameHandler) gameEventBus.off("START_GAME", this.onStartGameHandler);
    if (this.onResumeGameHandler) gameEventBus.off("RESUME_GAME", this.onResumeGameHandler);
    if (this.onRestartGameHandler) gameEventBus.off("RESTART_GAME", this.onRestartGameHandler);
    if (this.onSwitchChapterHandler) gameEventBus.off("SWITCH_CHAPTER", this.onSwitchChapterHandler);
    if (this.onAnswerSubmittedHandler) gameEventBus.off("ANSWER_SUBMITTED", this.onAnswerSubmittedHandler);
    if (this.onAvatarChangedHandler) gameEventBus.off("AVATAR_CHANGED", this.onAvatarChangedHandler);
  }

  /**
   * Universal Damage System
   */
  public takeDamage(amount: number = 1, reason: string = "Hazard Contact") {
    if (this.isInvulnerable || this.isGameOver || this.gateActivated) return;

    this.health = Math.max(0, this.health - amount);
    this.isInvulnerable = true;

    // Camera shake & Flash player
    this.cameras.main.shake(200, 0.015);
    if (this.player) {
      this.player.setTint(0xff3333);
      this.tweens.add({
        targets: this.player,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
          this.player.clearTint();
          this.player.setAlpha(1);
          this.isInvulnerable = false;
        },
      });
    }

    gameEventBus.emit("PLAYER_DAMAGED", {
      currentHealth: this.health,
      maxHealth: this.maxHealth,
      reason,
    });

    if (this.health <= 0) {
      this.triggerGameOver(reason);
    } else if (this.player) {
      this.showFloatingText(
        this.player.x,
        this.player.y - 18,
        `-1 HP [${reason}]`,
        "#ef4444",
        "#450a0a"
      );
    }
  }

  /**
   * Spawns clear, crisp floating telemetry directly inside the game field
   */
  public showFloatingText(
    x: number,
    y: number,
    message: string,
    color: string = "#f3c85f",
    strokeColor: string = "#000000"
  ) {
    const text = this.add.text(x, y, message, {
      fontFamily: "monospace",
      fontSize: "12px",
      fontStyle: "bold",
      color,
      stroke: strokeColor,
      strokeThickness: 3,
      align: "center",
    });
    text.setOrigin(0.5);
    text.setDepth(300);

    this.tweens.add({
      targets: text,
      y: y - 26,
      alpha: { from: 1, to: 0 },
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Expedition Failure Handler
   */
  public triggerGameOver(reason: string) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.pause();

    if (this.player && this.player.body) {
      this.player.setVelocity(0, 0);
      this.tweens.add({
        targets: this.player,
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        angle: 180,
        duration: 400,
      });
    }

    gameEventBus.emit("GAME_OVER", {
      chapterId: this.sectorId,
      reason,
    });
  }

  /**
   * Open the Sector Verification Gate Modal
   */
  protected openGateModal() {
    if (this.gateActivated || this.isGameOver) return;

    // Verify traces requirement before allowing gate unlock
    const tracesReq = this.sectorConfig.tracesRequired;
    if (this.collectedIds.length < tracesReq) {
      const remaining = tracesReq - this.collectedIds.length;
      if (this.player) {
        this.showFloatingText(
          this.player.x,
          this.player.y - 22,
          `🔒 NEED ${remaining} MORE TRACE${remaining > 1 ? "S" : ""}!`,
          "#f87171",
          "#450a0a"
        );
      }
      this.cameras.main.shake(120, 0.006);
      return;
    }

    this.gateActivated = true;
    this.physics.pause();
    if (this.player && this.player.body) {
      this.player.setVelocity(0, 0);
    }

    const q = this.sectorConfig.gateQuestion;
    gameEventBus.emit("SHOW_LORE_MODAL", {
      id: `lore-sector-${this.sectorId}`,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      loreFact: q.loreFact,
    });
  }

  /**
   * Post Telemetry to Backend Verification API
   */
  protected async handleAnswerSubmission(data: AnswerSubmittedPayload) {
    const endTime = Date.now();
    let sessionProfile: any = null;
    try {
      const stored = localStorage.getItem("bitfoot_hunter_guest_session");
      if (stored) sessionProfile = JSON.parse(stored);
    } catch {}

    const validUserId =
      sessionProfile?.userId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionProfile.userId
      )
        ? sessionProfile.userId
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    try {
      const res = await fetch("/api/chapter/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: this.sectorId,
          userId: validUserId,
          username: sessionProfile?.username || "Guest_Hunter",
          avatarUrl: sessionProfile?.avatarUrl,
          zcashAddress: sessionProfile?.zcashAddress,
          isGuest: sessionProfile?.isGuest ?? true,
          startTime: this.startTime,
          endTime,
          collectedIds: this.collectedIds,
          gateAnswerIndex: data.selectedOptionIndex,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        gameEventBus.emit("CHAPTER_FINISHED", {
          success: true,
          chapterId: this.sectorId,
          totalScore: result.totalScore,
          durationMs: result.durationMs,
          timeElapsedSeconds: result.timeElapsedSeconds,
          breakdown: result.breakdown,
        });
      } else {
        gameEventBus.emit("CHAPTER_FINISHED", {
          success: false,
          chapterId: this.sectorId,
          totalScore: this.score,
          durationMs: endTime - this.startTime,
          timeElapsedSeconds: Math.round((endTime - this.startTime) / 1000),
          breakdown: {
            footprintsScore: this.collectedIds.length * 10,
            validFootprintsCount: this.collectedIds.length,
            silhouetteScore: 0,
            gateScore: 0,
            speedBonus: 0,
          },
          error: result.error || "Sector clearance verification rejected.",
        });
      }
    } catch (err: any) {
      console.error("Clearance submission error:", err);
    }
  }

  /**
   * Shared Procedural Textures generator
   */
  protected generateCommonPixelTextures() {
    // 1. Player
    if (!this.textures.exists("player")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x10b981, 1);
      g.fillRect(4, 2, 12, 14);
      g.fillStyle(0x00f0ff, 1);
      g.fillRect(6, 5, 8, 3);
      g.fillStyle(0x064e3b, 1);
      g.fillRect(2, 6, 2, 8);
      g.fillRect(5, 12, 10, 2);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(5, 16, 4, 3);
      g.fillRect(11, 16, 4, 3);
      g.generateTexture("player", 20, 20);
      g.destroy();
    }

    // 2. Base Monolith Gate
    if (!this.textures.exists("monolith_gate")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1e293b, 1);
      g.fillRect(0, 0, 32, 48);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(4, 4, 24, 40);
      g.fillStyle(0xeaba49, 1);
      g.fillRect(10, 10, 12, 4);
      g.fillRect(14, 14, 4, 16);
      g.fillRect(10, 30, 12, 4);
      g.lineStyle(2, 0xeaba49, 0.8);
      g.strokeRect(2, 2, 28, 44);
      g.generateTexture("monolith_gate", 32, 48);
      g.destroy();
    }

    // 3. Hazard Bramble / Spike
    if (!this.textures.exists("hazard_bramble")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7f1d1d, 0.85);
      g.fillTriangle(0, 16, 8, 0, 16, 16);
      g.fillTriangle(10, 16, 18, 2, 26, 16);
      g.fillStyle(0xef4444, 1);
      g.fillRect(6, 10, 14, 6);
      g.generateTexture("hazard_bramble", 26, 16);
      g.destroy();
    }
  }

  /**
   * Universal Base Asset Preloader
   * Preloads all authentic BitFoot heads (01 to 18) and procedural base textures
   */
  protected preloadBaseAssets() {
    this.generateCommonPixelTextures();

    // Preload all 18 authentic BitFoot heads into Phaser cache
    for (let i = 1; i <= 18; i++) {
      const num = i.toString().padStart(2, "0");
      const key = `bitfoot_head_${num}`;
      if (!this.textures.exists(key)) {
        this.load.image(key, `/bitfoot-heads/bitfoot-head-${num}.png`);
      }
    }
  }

  /**
   * Retrieves the active avatar URL from the current user session
   */
  protected getCurrentSessionAvatar(): string {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("bitfoot_hunter_guest_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.avatarUrl) {
            return parsed.avatarUrl;
          }
        }
      } catch (e) {
        // fallback
      }
    }
    return "/bitfoot-heads/bitfoot-head-01.png";
  }

  /**
   * Spawns the player sprite in the scene using the user's active profile avatar
   */
  protected spawnPlayer(
    x: number,
    y: number,
    depth: number = 20
  ): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    // Generate avatar texture immediately
    this.refreshPlayerAvatarTexture();

    const textureKey = this.textures.exists("player_avatar") ? "player_avatar" : "player";
    this.player = this.physics.add.sprite(x, y, textureKey);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(18, 22);
    this.player.setOffset(5, 7);
    this.player.setDepth(depth);

    return this.player;
  }

  /**
   * Generates or refreshes the dynamic Canvas texture "player_avatar"
   * from the user's selected profile avatar.
   */
  public refreshPlayerAvatarTexture(customAvatarUrl?: string) {
    const avatarUrl = customAvatarUrl || this.getCurrentSessionAvatar();
    const textureKey = "player_avatar";
    const canvasWidth = 28;
    const canvasHeight = 32;

    const applyTextureToPlayer = () => {
      if (this.player && this.player.active) {
        this.player.setTexture(textureKey);
        this.player.setSize(18, 22);
        this.player.setOffset(5, 7);
      }
    };

    // Check if it's one of the 18 preloaded BitFoot heads
    const match = avatarUrl.match(/bitfoot-head-(\d+)\.png/);
    const headKey = match ? `bitfoot_head_${match[1]}` : null;

    if (headKey && this.textures.exists(headKey)) {
      const sourceImage = this.textures.get(headKey).getSourceImage() as HTMLImageElement;
      if (sourceImage) {
        this.drawAvatarCanvas(sourceImage, textureKey, canvasWidth, canvasHeight, true);
        applyTextureToPlayer();
        return;
      }
    }

    // Dynamic Image loader for external URLs (Google/X/DiceBear/custom) or cold cache
    if (typeof Image !== "undefined") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.drawAvatarCanvas(
          img,
          textureKey,
          canvasWidth,
          canvasHeight,
          avatarUrl.includes("bitfoot-head")
        );
        applyTextureToPlayer();
      };
      img.onerror = () => {
        if (this.player && this.player.active && !this.textures.exists(textureKey)) {
          this.player.setTexture("player");
        }
      };
      img.src = avatarUrl;
    }
  }

  /**
   * Renders the character avatar into an authentic 28x32 pixel canvas
   * with drop shadow and cybernetic indicators
   */
  private drawAvatarCanvas(
    img: HTMLImageElement,
    textureKey: string,
    width: number,
    height: number,
    isBitfootHead: boolean
  ) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Soft atmospheric ground shadow underneath feet
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 3, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isBitfootHead) {
        // High quality pixel scaling of BitFoot head
        ctx.imageSmoothingEnabled = false;
        const imgAspect = img.width && img.height ? img.width / img.height : 0.82;
        let drawW = width;
        let drawH = height - 4;
        if (imgAspect < 1) {
          drawW = drawH * imgAspect;
        } else {
          drawH = drawW / imgAspect;
        }
        const drawX = (width - drawW) / 2;
        const drawY = height - 4 - drawH;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        // Tech locator beacon dot at bottom
        ctx.fillStyle = "#eaba49";
        ctx.beginPath();
        ctx.arc(width / 2, height - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // External avatar (Google, Twitter/X, custom URL):
        // Holographic circular portrait frame
        const size = 24;
        const x = (width - size) / 2;
        const y = 2;
        const radius = size / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();

        // Glowing gold agent border
        ctx.strokeStyle = "#eaba49";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius - 0.75, 0, Math.PI * 2);
        ctx.stroke();

        // Tech locator beacon dot at bottom
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(width / 2, height - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.textures.exists(textureKey)) {
        this.textures.remove(textureKey);
      }
      this.textures.addCanvas(textureKey, canvas);
    } catch (e) {
      console.warn("Could not draw avatar canvas texture:", e);
    }
  }
}
