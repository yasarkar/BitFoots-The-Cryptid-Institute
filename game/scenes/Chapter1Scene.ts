import * as Phaser from "phaser";
import { BaseSectorScene } from "./BaseSectorScene";
import { gameEventBus, FootprintCollectedPayload, SecretDiscoveredPayload } from "@/lib/eventBus";

export class Chapter1Scene extends BaseSectorScene {
  public readonly sectorId = 1;

  private footprintsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private secretSilhouette!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private ancientMonolithGate!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private bramblesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private eyesGroup!: Phaser.GameObjects.Group;

  private readonly totalFootprints: number = 8;
  private foundSecretSilhouette: boolean = false;
  private decayTimer?: Phaser.Time.TimerEvent;
  private fogMaskGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "Chapter1Scene" });
  }

  preload() {
    this.preloadBaseAssets();
    this.generateSector1Textures();
  }

  create() {
    this.resetBaseState();
    this.foundSecretSilhouette = false;

    const mapWidth = 1200;
    const mapHeight = 320;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 1. Forest Trail Base
    this.createForestEnvironment(mapWidth, mapHeight);

    // 2. Monolith Gate (Exit at x: 1120)
    this.ancientMonolithGate = this.physics.add.staticSprite(1120, 160, "monolith_gate");
    this.tweens.add({
      targets: this.ancientMonolithGate,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.9,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // 3. Secret Silhouette (x: 590, y: 75)
    this.secretSilhouette = this.physics.add.staticSprite(590, 75, "secret_silhouette");
    this.secretSilhouette.setAlpha(0.35);

    // 4. Hazard Brambles (3 thorny patches)
    this.bramblesGroup = this.physics.add.staticGroup();
    const brambleCoords = [
      { x: 320, y: 190 },
      { x: 740, y: 130 },
      { x: 980, y: 220 },
    ];
    brambleCoords.forEach((b) => {
      this.bramblesGroup.create(b.x, b.y, "hazard_bramble");
    });

    // 5. Spawn 8 Organic Footprints
    this.footprintsGroup = this.physics.add.staticGroup();
    const footprintCoords = [
      { id: "fp_1", x: 140, y: 130 },
      { id: "fp_2", x: 260, y: 220 },
      { id: "fp_3", x: 390, y: 100 },
      { id: "fp_4", x: 510, y: 240 },
      { id: "fp_5", x: 670, y: 160 },
      { id: "fp_6", x: 800, y: 90 },
      { id: "fp_7", x: 920, y: 230 },
      { id: "fp_8", x: 1040, y: 150 },
    ];

    footprintCoords.forEach((pt) => {
      const fp = this.footprintsGroup.create(pt.x, pt.y, "footprint");
      fp.setData("id", pt.id);
      this.tweens.add({
        targets: fp,
        y: pt.y - 4,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // 6. Lurking Golden Eyes in Canopy
    this.eyesGroup = this.add.group();
    const eyePositions = [
      { x: 200, y: 35 },
      { x: 450, y: 285 },
      { x: 850, y: 35 },
    ];
    eyePositions.forEach((pos) => {
      const eye = this.add.sprite(pos.x, pos.y, "lurking_eye");
      eye.setAlpha(0);
      this.eyesGroup.add(eye);
      this.tweens.add({
        targets: eye,
        alpha: 0.8,
        duration: 1500,
        delay: Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    });

    // 7. Spawn Player with User Profile Avatar
    this.player = this.spawnPlayer(50, 160, 20);

    // 8. Camera Follow - Smoothly tracks player to scroll map to the right
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, false, 0.15, 0.15, -40, 0);

    // 9. Lantern Fog-of-War Mask (Fixed to screen viewport)
    this.fogMaskGraphics = this.add.graphics();
    this.fogMaskGraphics.setScrollFactor(0);
    this.fogMaskGraphics.setDepth(100);

    // 10. Overlaps
    this.physics.add.overlap(
      this.player,
      this.footprintsGroup,
      this.handleCollectFootprint as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.secretSilhouette,
      this.handleDiscoverSilhouette as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.bramblesGroup,
      this.handleBrambleContact as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(this.player, this.ancientMonolithGate, this.openGateModal, undefined, this);

    // 11. Decaying Footprints Periodic Wind Event
    this.decayTimer = this.time.addEvent({
      delay: 18000,
      callback: this.handleFootprintDecay,
      callbackScope: this,
      loop: true,
    });

    this.setupBaseControls();
    this.setupBaseEventBus();
  }

  update() {
    if (!this.player || !this.player.body || this.isGameOver || this.gateActivated) {
      return;
    }

    if (
      typeof document !== "undefined" &&
      (document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement)
    ) {
      this.player.setVelocity(0, 0);
      return;
    }

    const speed = 140;
    let vx = 0;
    let vy = 0;

    if (this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown) {
      vx -= 1;
      this.player.setFlipX(true);
    } else if (this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown) {
      vx += 1;
      this.player.setFlipX(false);
    }

    if (this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown) {
      vy -= 1;
    } else if (this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown) {
      vy += 1;
    }

    if (vx !== 0 && vy !== 0) {
      const normalizer = 1 / Math.sqrt(2);
      vx *= normalizer;
      vy *= normalizer;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Lively retro walking wobble
    if (vx !== 0 || vy !== 0) {
      this.player.setAngle(Math.sin(this.time.now / 110) * 4);
    } else {
      this.player.setAngle(0);
    }

    // Dynamic Lantern Fog update
    this.updateFogOfWar();

    // Proximity to Secret Silhouette
    if (this.secretSilhouette && this.secretSilhouette.active) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.secretSilhouette.x,
        this.secretSilhouette.y
      );
      this.secretSilhouette.setAlpha(dist < 90 ? 0.9 : 0.25);
    }
  }

  private updateFogOfWar() {
    if (!this.fogMaskGraphics || !this.player) return;

    this.fogMaskGraphics.clear();

    const cam = this.cameras.main;
    const screenW = cam.width;
    const screenH = cam.height;

    // Viewport nocturnal darkness overlay
    this.fogMaskGraphics.fillStyle(0x07090d, 0.65);
    this.fogMaskGraphics.fillRect(0, 0, screenW, screenH);

    // Player position converted to viewport screen coordinates
    const screenPlayerX = this.player.x - cam.scrollX;
    const screenPlayerY = this.player.y - cam.scrollY;

    // Lantern circle cutout & warm illumination
    this.fogMaskGraphics.fillStyle(0xeaba49, 0.08);
    this.fogMaskGraphics.fillCircle(screenPlayerX, screenPlayerY, this.lanternRadius);

    this.fogMaskGraphics.fillStyle(0xfff5ea, 0.12);
    this.fogMaskGraphics.fillCircle(screenPlayerX, screenPlayerY, this.lanternRadius * 0.6);
  }

  private handleCollectFootprint(_p: Phaser.GameObjects.GameObject, fpObj: Phaser.GameObjects.GameObject) {
    const footprint = fpObj as Phaser.Physics.Arcade.Sprite;
    const footprintId = footprint.getData("id") as string;

    if (this.collectedIds.includes(footprintId)) return;
    this.collectedIds.push(footprintId);

    this.tweens.add({
      targets: footprint,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 150,
      onComplete: () => footprint.destroy(),
    });

    this.score += 10;
    this.showFloatingText(footprint.x, footprint.y - 12, "+10 PTS", "#f3c85f", "#451a03");

    const payload: FootprintCollectedPayload = {
      id: footprintId,
      scoreGained: 10,
      totalScore: this.score,
      collectedCount: this.collectedIds.length,
      totalCount: this.totalFootprints,
      remainingCount: this.totalFootprints - this.collectedIds.length,
    };

    gameEventBus.emit("FOOTPRINT_COLLECTED", payload);
  }

  private handleBrambleContact() {
    this.takeDamage(1, "Thorny Bramble Snare");
    this.player.setVelocity(0, 0);
  }

  private handleDiscoverSilhouette(_p: Phaser.GameObjects.GameObject, silObj: Phaser.GameObjects.GameObject) {
    if (this.foundSecretSilhouette) return;
    this.foundSecretSilhouette = true;

    const sil = silObj as Phaser.Physics.Arcade.Sprite;
    this.tweens.add({
      targets: sil,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 350,
      onComplete: () => sil.destroy(),
    });

    this.score += 50;
    this.showFloatingText(
      this.player.x,
      this.player.y - 22,
      "+50 PTS // CRYPTID SPOTTED!",
      "#38bdf8",
      "#0369a1"
    );

    const payload: SecretDiscoveredPayload = {
      id: "secret_silhouette",
      bonusScore: 50,
      totalScore: this.score,
    };

    gameEventBus.emit("SECRET_DISCOVERED", payload);
  }

  private handleFootprintDecay() {
    // If any uncollected footprints remain, flutter one to a nearby spot
    const activeFootprints = this.footprintsGroup.getChildren() as Phaser.Physics.Arcade.Sprite[];
    if (activeFootprints.length > 0) {
      const randomFp = Phaser.Utils.Array.GetRandom(activeFootprints);
      if (randomFp) {
        this.tweens.add({
          targets: randomFp,
          alpha: 0.2,
          yoyo: true,
          duration: 300,
          repeat: 2,
        });
      }
    }
  }

  private generateSector1Textures() {
    // Footprint
    if (!this.textures.exists("footprint")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xf59e0b, 0.4);
      g.fillRect(2, 2, 12, 12);
      g.fillStyle(0xfbbf24, 1);
      g.fillRect(4, 7, 8, 6);
      g.fillStyle(0xfffbeb, 1);
      g.fillRect(4, 3, 2, 3);
      g.fillRect(7, 2, 2, 3);
      g.fillRect(10, 3, 2, 3);
      g.generateTexture("footprint", 16, 16);
      g.destroy();
    }

    // Secret Silhouette
    if (!this.textures.exists("secret_silhouette")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00f0ff, 0.7);
      g.fillCircle(12, 10, 8);
      g.fillRect(6, 15, 12, 14);
      g.lineStyle(2, 0xa855f7, 0.8);
      g.strokeCircle(12, 16, 12);
      g.generateTexture("secret_silhouette", 24, 32);
      g.destroy();
    }

    // Lurking Eye
    if (!this.textures.exists("lurking_eye")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xeaba49, 1);
      g.fillCircle(4, 4, 3);
      g.fillCircle(12, 4, 3);
      g.fillStyle(0x000000, 1);
      g.fillCircle(4, 4, 1.5);
      g.fillCircle(12, 4, 1.5);
      g.generateTexture("lurking_eye", 16, 8);
      g.destroy();
    }
  }

  private createForestEnvironment(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x09111e, 1);
    bg.fillRect(0, 0, width, height);

    // Deep forest trail base
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(0, 60, width, 200);

    // Subtle dirt path with organic color variations
    bg.fillStyle(0x131f33, 0.7);
    bg.fillRect(0, 95, width, 130);

    // Forest floor checker grid
    const step = 20;
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        if ((x / step + y / step) % 2 === 0) {
          bg.fillStyle(0x0a1424, 0.4);
          bg.fillRect(x, y, step, step);
        }
      }
    }

    // Top & Bottom dense pine canopy
    for (let x = 0; x < width; x += 36) {
      // Top canopy
      bg.fillStyle(0x042f2e, 0.85);
      bg.fillCircle(x + 18, 20, 24);
      bg.fillStyle(0x064e3b, 0.95);
      bg.fillCircle(x + 18, 26, 18);
      bg.fillStyle(0x022c22, 0.7);
      bg.fillCircle(x + 18, 34, 12);

      // Bottom canopy
      bg.fillStyle(0x042f2e, 0.85);
      bg.fillCircle(x + 18, 300, 24);
      bg.fillStyle(0x064e3b, 0.95);
      bg.fillCircle(x + 18, 294, 18);
      bg.fillStyle(0x022c22, 0.7);
      bg.fillCircle(x + 18, 286, 12);
    }

    // Landmark bushes and rock cairns
    const landmarks = [
      { x: 180, y: 70, r: 20 },
      { x: 360, y: 250, r: 24 },
      { x: 580, y: 75, r: 30 },
      { x: 720, y: 250, r: 22 },
      { x: 890, y: 70, r: 26 },
      { x: 1060, y: 245, r: 25 },
    ];
    landmarks.forEach((lm) => {
      bg.fillStyle(0x022c22, 0.95);
      bg.fillCircle(lm.x - 8, lm.y, lm.r);
      bg.fillCircle(lm.x + 8, lm.y, lm.r);
      bg.fillCircle(lm.x, lm.y - 6, lm.r * 0.8);
      bg.fillStyle(0x10b981, 0.25);
      bg.fillCircle(lm.x, lm.y, lm.r * 0.35);
    });

    // Milestone trail stones with distance indicators every 200px
    const milestones = [
      { x: 200, label: "200M →" },
      { x: 400, label: "400M →" },
      { x: 600, label: "600M →" },
      { x: 800, label: "800M →" },
      { x: 1000, label: "1000M →" },
      { x: 1120, label: "GATE ⚑" },
    ];

    milestones.forEach((ms) => {
      // Stone base
      bg.fillStyle(0x1e293b, 0.9);
      bg.fillRoundedRect(ms.x - 18, 52, 36, 16, 4);
      bg.lineStyle(1, 0x38bdf8, 0.6);
      bg.strokeRoundedRect(ms.x - 18, 52, 36, 16, 4);

      // Milestone text label
      const txt = this.add.text(ms.x, 60, ms.label, {
        fontFamily: "monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: "#38bdf8",
      });
      txt.setOrigin(0.5);
      txt.setAlpha(0.85);
    });

    // Golden trail guide arrows painted on ground
    const arrowXs = [100, 300, 500, 700, 900, 1050];
    arrowXs.forEach((ax) => {
      bg.fillStyle(0xeaba49, 0.2);
      bg.fillRect(ax, 158, 14, 3);
      bg.fillTriangle(ax + 14, 155, ax + 20, 159.5, ax + 14, 164);
    });

    // Outer border
    bg.lineStyle(2, 0x1e293b, 1);
    bg.strokeRect(0, 0, width, height);
  }
}
