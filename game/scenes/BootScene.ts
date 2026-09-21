import * as Phaser from "phaser";
import {
  gameEventBus,
  AnswerSubmittedPayload,
  FootprintCollectedPayload,
  LoreModalPayload,
  ChapterFinishedPayload,
} from "@/lib/eventBus";

export class BootScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private footprintsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private exitGate!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;

  // Game state
  private score: number = 0;
  private collectedFootprints: number = 0;
  private readonly totalFootprints: number = 3;
  private startTime: number = 0;
  private gateActivated: boolean = false;

  // Event handler references for cleanup
  private onAnswerSubmittedHandler?: (data: AnswerSubmittedPayload) => void;
  private onResumeGameHandler?: () => void;
  private onRestartGameHandler?: () => void;

  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Generate procedural pixel art textures if not present
    this.createPixelTextures();
  }

  create() {
    this.score = 0;
    this.collectedFootprints = 0;
    this.gateActivated = false;
    this.startTime = this.time.now;

    // 1. Retro Pixel Background Grid (480x320)
    this.createBackground();

    // 2. Spawn Exit Gate (Harita sonu tetikleyicisi)
    this.exitGate = this.physics.add.staticSprite(430, 160, "exit_gate");
    
    // Pulse animation on the gate
    this.tweens.add({
      targets: this.exitGate,
      alpha: 0.6,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 3. Spawn Player (Hunter)
    this.player = this.physics.add.sprite(60, 160, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setSize(16, 18);
    this.player.setOffset(2, 2);

    // 4. Spawn 3 Footprint Items
    this.footprintsGroup = this.physics.add.staticGroup();
    const spawnPoints = [
      { id: "fp-1", x: 160, y: 90 },
      { id: "fp-2", x: 260, y: 230 },
      { id: "fp-3", x: 360, y: 100 },
    ];

    spawnPoints.forEach((pt) => {
      const footprint = this.footprintsGroup.create(pt.x, pt.y, "footprint");
      footprint.setData("id", pt.id);

      // Subtle float animation
      this.tweens.add({
        targets: footprint,
        y: pt.y - 4,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // 5. Physics Overlaps
    // Player <-> Footprints
    this.physics.add.overlap(
      this.player,
      this.footprintsGroup,
      this.handleCollectFootprint as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Player <-> Exit Gate
    this.physics.add.overlap(
      this.player,
      this.exitGate,
      this.handleReachGate as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 6. Keyboard Controls (WASD + Arrow Keys)
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys(
        {
          W: Phaser.Input.Keyboard.KeyCodes.W,
          A: Phaser.Input.Keyboard.KeyCodes.A,
          S: Phaser.Input.Keyboard.KeyCodes.S,
          D: Phaser.Input.Keyboard.KeyCodes.D,
        },
        false
      ) as typeof this.wasdKeys;
      this.input.keyboard.clearCaptures();
    }

    // 7. Subscribe to React Event Bus
    this.setupEventBusListeners();

    // Scene cleanup on shutdown/destroy
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupListeners, this);
  }

  update() {
    if (!this.player || !this.player.body) return;

    const speed = 130;
    let vx = 0;
    let vy = 0;

    // Horizontal Movement
    if (this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown) {
      vx -= 1;
      this.player.setFlipX(true);
    } else if (this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown) {
      vx += 1;
      this.player.setFlipX(false);
    }

    // Vertical Movement
    if (this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown) {
      vy -= 1;
    } else if (this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown) {
      vy += 1;
    }

    // Normalize diagonal velocity
    if (vx !== 0 && vy !== 0) {
      const normalizer = 1 / Math.sqrt(2);
      vx *= normalizer;
      vy *= normalizer;
    }

    this.player.setVelocity(vx * speed, vy * speed);
  }

  private handleCollectFootprint(
    _player: Phaser.GameObjects.GameObject,
    footprintObj: Phaser.GameObjects.GameObject
  ) {
    const footprint = footprintObj as Phaser.Physics.Arcade.Sprite;
    const footprintId = footprint.getData("id") as string;

    // Visual pop before destruction
    this.tweens.add({
      targets: footprint,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        footprint.destroy();
      },
    });

    this.score += 10;
    this.collectedFootprints += 1;

    const payload: FootprintCollectedPayload = {
      id: footprintId,
      scoreGained: 10,
      totalScore: this.score,
      collectedCount: this.collectedFootprints,
      totalCount: this.totalFootprints,
      remainingCount: this.totalFootprints - this.collectedFootprints,
    };

    // Emit event to React HUD
    gameEventBus.emit("FOOTPRINT_COLLECTED", payload);
  }

  private handleReachGate() {
    if (this.gateActivated) return;
    this.gateActivated = true;

    // Pause game physics while modal is presented
    this.physics.pause();
    this.player.setVelocity(0, 0);

    const payload: LoreModalPayload = {
      id: "lore-chapter-1",
      question: "According to Bitfoot lore, on which historic block was the first mysterious footprint discovered?",
      options: [
        "Genesis Block #0",
        "Halving Block #210,000",
        "The SegWit Block",
        "Ethereum Block #1"
      ],
      correctAnswerIndex: 0,
      loreFact: "Legend holds that Bitfoot is an ancient cryptid guardian tracking the very first traces left by Satoshi.",
    };

    // Emit to React UI to open the Lore Modal
    gameEventBus.emit("SHOW_LORE_MODAL", payload);
  }

  private setupEventBusListeners() {
    this.onAnswerSubmittedHandler = (data: AnswerSubmittedPayload) => {
      if (data.isCorrect) {
        this.score += 50;
      }
      
      const timeElapsedSeconds = Math.floor((this.time.now - this.startTime) / 1000);
      const chapterFinishedData: ChapterFinishedPayload = {
        success: true,
        totalScore: this.score,
        durationMs: timeElapsedSeconds * 1000,
        timeElapsedSeconds,
        breakdown: {
          footprintsScore: this.collectedFootprints * 10,
          validFootprintsCount: this.collectedFootprints,
          silhouetteScore: 0,
          gateScore: data.isCorrect ? 50 : 0,
          speedBonus: 0,
        },
      };

      // Notify React that the chapter is complete
      gameEventBus.emit("CHAPTER_FINISHED", chapterFinishedData);
    };

    this.onResumeGameHandler = () => {
      this.physics.resume();
      this.gateActivated = false;
    };

    this.onRestartGameHandler = () => {
      this.scene.restart();
    };

    gameEventBus.on("ANSWER_SUBMITTED", this.onAnswerSubmittedHandler);
    gameEventBus.on("RESUME_GAME", this.onResumeGameHandler);
    gameEventBus.on("RESTART_GAME", this.onRestartGameHandler);
  }

  private cleanupListeners() {
    if (this.onAnswerSubmittedHandler) {
      gameEventBus.off("ANSWER_SUBMITTED", this.onAnswerSubmittedHandler);
    }
    if (this.onResumeGameHandler) {
      gameEventBus.off("RESUME_GAME", this.onResumeGameHandler);
    }
    if (this.onRestartGameHandler) {
      gameEventBus.off("RESTART_GAME", this.onRestartGameHandler);
    }
  }

  /**
   * Procedural Pixel Art generator (zero external asset dependencies)
   */
  private createPixelTextures() {
    // 1. Player Texture (Retro 20x20 Pixel Sprite)
    if (!this.textures.exists("player")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Body
      g.fillStyle(0x10b981, 1); // Emerald green
      g.fillRect(4, 2, 12, 14);
      // Visor / Eyes
      g.fillStyle(0x00f0ff, 1); // Neon cyan visor
      g.fillRect(6, 5, 8, 3);
      // Backpack / Belt
      g.fillStyle(0x064e3b, 1);
      g.fillRect(2, 6, 2, 8);
      g.fillRect(5, 12, 10, 2);
      // Boots
      g.fillStyle(0xf59e0b, 1); // Gold boots
      g.fillRect(5, 16, 4, 3);
      g.fillRect(11, 16, 4, 3);
      g.generateTexture("player", 20, 20);
      g.destroy();
    }

    // 2. Footprint Texture (Glowing 16x16 Pixel Paw)
    if (!this.textures.exists("footprint")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Golden glow aura
      g.fillStyle(0xf59e0b, 0.4);
      g.fillRect(2, 2, 12, 12);
      // Main foot pad
      g.fillStyle(0xfbbf24, 1);
      g.fillRect(4, 7, 8, 6);
      // Toes
      g.fillStyle(0xfffbeb, 1);
      g.fillRect(4, 3, 2, 3);
      g.fillRect(7, 2, 2, 3);
      g.fillRect(10, 3, 2, 3);
      g.generateTexture("footprint", 16, 16);
      g.destroy();
    }

    // 3. Exit Gate Texture (Portal 24x36)
    if (!this.textures.exists("exit_gate")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Outer arch
      g.fillStyle(0x3b82f6, 1);
      g.fillRect(0, 0, 24, 36);
      // Inner glowing void
      g.fillStyle(0x00f0ff, 1);
      g.fillRect(3, 4, 18, 32);
      // Core particle
      g.fillStyle(0xffffff, 1);
      g.fillRect(7, 10, 10, 16);
      g.generateTexture("exit_gate", 24, 36);
      g.destroy();
    }
  }

  private createBackground() {
    // Checkerboard / Dungeon Pixel Floor
    const tileSize = 20;
    const cols = 480 / tileSize;
    const rows = 320 / tileSize;

    const bgGraphics = this.add.graphics();

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const isAlt = (c + r) % 2 === 0;
        bgGraphics.fillStyle(isAlt ? 0x0f172a : 0x111827, 1);
        bgGraphics.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
      }
    }

    // Border Frame
    bgGraphics.lineStyle(2, 0x1f293d, 1);
    bgGraphics.strokeRect(1, 1, 478, 318);

    // Decorative floor rune in the middle
    bgGraphics.lineStyle(1, 0x10b981, 0.2);
    bgGraphics.strokeCircle(240, 160, 48);
    bgGraphics.strokeCircle(240, 160, 72);
  }
}
