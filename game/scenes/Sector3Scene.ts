import * as Phaser from "phaser";
import { BaseSectorScene } from "./BaseSectorScene";
import {
  gameEventBus,
  FootprintCollectedPayload,
} from "@/lib/eventBus";

interface ShadowStalker {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  patrolPointA: { x: number; y: number };
  patrolPointB: { x: number; y: number };
  targetPoint: { x: number; y: number };
  state: "patrol" | "investigating";
  speed: number;
}

export class Sector3Scene extends BaseSectorScene {
  public readonly sectorId = 3;

  private footprintsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private exitGate!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private shadowStalkers: ShadowStalker[] = [];
  private sonarRings: Phaser.GameObjects.Arc[] = [];
  private darkOverlayGraphics!: Phaser.GameObjects.Graphics;

  private readonly totalFootprints: number = 6;
  private lastPingTime: number = 0;
  private pingCooldownMs: number = 1800;
  private isPingIlluminated: boolean = false;
  private illuminationTimer?: Phaser.Time.TimerEvent;

  // Quantum Phase Shift mechanic (Unobserved traces periodically relocate)
  private quantumShiftTimer?: Phaser.Time.TimerEvent;
  private readonly zkCoordinatePool: { x: number; y: number }[] = [
    { x: 120, y: 100 },
    { x: 150, y: 240 },
    { x: 220, y: 340 },
    { x: 200, y: 150 },
    { x: 290, y: 260 },
    { x: 310, y: 120 },
    { x: 340, y: 360 },
    { x: 380, y: 300 },
    { x: 420, y: 110 },
    { x: 440, y: 200 },
    { x: 480, y: 360 },
    { x: 500, y: 140 },
  ];

  // React button listener for touch sonar
  private onTriggerSonarHandler?: () => void;

  constructor() {
    super({ key: "Sector3Scene" });
  }

  preload() {
    this.preloadBaseAssets();
    this.generateSector3Textures();
  }

  create() {
    this.resetBaseState();
    this.shadowStalkers = [];
    this.sonarRings = [];
    this.lastPingTime = 0;
    this.isPingIlluminated = false;

    const mapWidth = 600;
    const mapHeight = 440;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 1. ZK Ambient Terrain
    this.createShieldedEnvironment(mapWidth, mapHeight);

    // 2. Monolith Gate at x: 530, y: 220
    this.exitGate = this.physics.add.staticSprite(530, 220, "monolith_gate");
    this.exitGate.setAlpha(0.2);

    // 3. Footprints (ZK nodes)
    this.footprintsGroup = this.physics.add.staticGroup();
    const coords = [
      { id: "ch3_fp_1", x: 120, y: 100 },
      { id: "ch3_fp_2", x: 220, y: 340 },
      { id: "ch3_fp_3", x: 310, y: 120 },
      { id: "ch3_fp_4", x: 380, y: 320 },
      { id: "ch3_fp_5", x: 440, y: 180 },
      { id: "ch3_fp_6", x: 480, y: 360 },
    ];

    coords.forEach((pt) => {
      const fp = this.footprintsGroup.create(pt.x, pt.y, "zk_trace");
      fp.setData("id", pt.id);
      fp.setAlpha(0.15); // Barely visible without ping
    });

    // 4. Spawn Player with User Profile Avatar
    this.player = this.spawnPlayer(60, 220, 60);

    // Camera setup - Smoothly track player horizontally and vertically
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, false, 0.15, 0.15);

    // 5. Spawn 2 Shadow Stalkers
    this.spawnShadowStalkers();

    // 6. Darkness Overlay Layer
    this.darkOverlayGraphics = this.add.graphics();
    this.darkOverlayGraphics.setDepth(90);

    // 7. Physics Overlaps
    this.physics.add.overlap(
      this.player,
      this.footprintsGroup,
      this.handleCollectFootprint as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.exitGate,
      this.openGateModal,
      undefined,
      this
    );

    // Touch button listener from React
    this.onTriggerSonarHandler = () => this.fireSonarPing();
    gameEventBus.on("TRIGGER_SONAR", this.onTriggerSonarHandler);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.onTriggerSonarHandler) gameEventBus.off("TRIGGER_SONAR", this.onTriggerSonarHandler);
    });

    // Periodic Quantum Phase Shift: unobserved traces drift every 13 seconds
    this.quantumShiftTimer = this.time.addEvent({
      delay: 13000,
      callback: this.handleQuantumShift,
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

    const speed = 135;
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

    // Keyboard Space to Fire Sonar Ping
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.fireSonarPing();
    }

    // Shadow Stalker AI Update
    this.updateShadowStalkers();

    // Render Pitch Darkness
    this.renderDarkness();
  }

  private fireSonarPing() {
    const now = Date.now();
    if (now - this.lastPingTime < this.pingCooldownMs || this.isGameOver || this.gateActivated) {
      return;
    }
    this.lastPingTime = now;

    const pingX = this.player.x;
    const pingY = this.player.y;

    // Expanding Sonar Wave Graphic
    const ring = this.add.circle(pingX, pingY, 15, 0xeaba49, 0.4);
    ring.setStrokeStyle(3, 0xffddcc, 0.9);
    ring.setDepth(95);

    this.tweens.add({
      targets: ring,
      radius: 220,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });

    // Illuminate traces and gate
    this.isPingIlluminated = true;
    this.footprintsGroup.getChildren().forEach((fp) => {
      (fp as Phaser.Physics.Arcade.Sprite).setAlpha(0.95);
    });
    this.exitGate.setAlpha(0.9);

    if (this.illuminationTimer) this.illuminationTimer.remove();
    this.illuminationTimer = this.time.delayedCall(1300, () => {
      this.isPingIlluminated = false;
      this.footprintsGroup.getChildren().forEach((fp) => {
        (fp as Phaser.Physics.Arcade.Sprite).setAlpha(0.15);
      });
      this.exitGate.setAlpha(0.2);
    });

    // Alert Shadow Stalkers to ping location!
    this.shadowStalkers.forEach((stalker) => {
      stalker.state = "investigating";
      stalker.targetPoint = { x: pingX, y: pingY };
    });

    gameEventBus.emit("SONAR_PING_TRIGGERED", {
      x: pingX,
      y: pingY,
      radius: 220,
    });
  }

  /**
   * Quantum Phase Shift:
   * When footprints are unobserved (not currently illuminated by Sonar),
   * 1-2 random uncollected ZK traces drift to new coordinates in the grid.
   */
  private handleQuantumShift() {
    if (this.isGameOver || this.gateActivated || this.isPingIlluminated) {
      return;
    }

    const activeFootprints = (this.footprintsGroup.getChildren() as Phaser.Physics.Arcade.Sprite[])
      .filter((fp) => fp && fp.active);

    if (activeFootprints.length === 0) return;

    // Pick 1 to 2 random active footprints to relocate
    const countToShift = Math.min(activeFootprints.length, Phaser.Math.Between(1, 2));
    const toShift = Phaser.Utils.Array.Shuffle([...activeFootprints]).slice(0, countToShift);
    const occupiedPositions = activeFootprints.map((fp) => ({ x: fp.x, y: fp.y }));

    let shiftedAny = false;

    toShift.forEach((fp) => {
      const validTargets = this.zkCoordinatePool.filter((c) => {
        const distPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
        if (distPlayer < 75) return false;
        const isOccupied = occupiedPositions.some(
          (pos) => Phaser.Math.Distance.Between(pos.x, pos.y, c.x, c.y) < 40
        );
        return !isOccupied;
      });

      if (validTargets.length === 0) return;
      const target = Phaser.Utils.Array.GetRandom(validTargets);
      if (!target) return;

      occupiedPositions.push(target);
      shiftedAny = true;

      // Collapse animation at previous location
      this.tweens.add({
        targets: fp,
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: 320,
        ease: "Back.easeIn",
        onComplete: () => {
          fp.setPosition(target.x, target.y);
          fp.refreshBody();

          // Spawn quantum ripple at arrival spot
          const ripple = this.add.circle(target.x, target.y, 8, 0xa855f7, 0.4);
          ripple.setStrokeStyle(2, 0x38bdf8, 0.8);
          ripple.setDepth(85);
          this.tweens.add({
            targets: ripple,
            radius: 32,
            alpha: 0,
            duration: 600,
            onComplete: () => ripple.destroy(),
          });

          // Re-emerge footprint
          const targetAlpha = this.isPingIlluminated ? 0.95 : 0.15;
          this.tweens.add({
            targets: fp,
            scaleX: 1,
            scaleY: 1,
            alpha: targetAlpha,
            duration: 350,
            ease: "Back.easeOut",
          });
        },
      });
    });

    if (shiftedAny) {
      this.cameras.main.shake(120, 0.005);
      if (this.player) {
        this.showFloatingText(
          this.player.x,
          this.player.y - 24,
          "⚡ QUANTUM SHIFT // TRACES DRIFTED",
          "#c084fc",
          "#1e1b4b"
        );
      }
    }
  }

  private spawnShadowStalkers() {
    const stalkerConfigs = [
      {
        start: { x: 260, y: 100 },
        patrolA: { x: 180, y: 90 },
        patrolB: { x: 360, y: 120 },
      },
      {
        start: { x: 420, y: 340 },
        patrolA: { x: 300, y: 360 },
        patrolB: { x: 500, y: 320 },
      },
    ];

    stalkerConfigs.forEach((cfg) => {
      const sprite = this.physics.add.sprite(cfg.start.x, cfg.start.y, "shadow_stalker");
      sprite.setSize(18, 18);
      sprite.setDepth(50);

      this.shadowStalkers.push({
        sprite,
        patrolPointA: cfg.patrolA,
        patrolPointB: cfg.patrolB,
        targetPoint: cfg.patrolA,
        state: "patrol",
        speed: 85,
      });

      // Player contact hazard
      this.physics.add.overlap(
        this.player,
        sprite,
        () => this.takeDamage(1, "Shadow Stalker Ambush"),
        undefined,
        this
      );
    });
  }

  private updateShadowStalkers() {
    this.shadowStalkers.forEach((s) => {
      const sp = s.sprite;
      if (!sp || !sp.body) return;

      const dist = Phaser.Math.Distance.Between(sp.x, sp.y, s.targetPoint.x, s.targetPoint.y);

      if (dist < 15) {
        if (s.state === "investigating") {
          // Finished investigating, return to patrol
          s.state = "patrol";
          s.targetPoint = s.patrolPointA;
        } else {
          // Alternate patrol points
          s.targetPoint = s.targetPoint === s.patrolPointA ? s.patrolPointB : s.patrolPointA;
        }
      }

      const speed = s.state === "investigating" ? 120 : 70;
      this.physics.moveTo(sp, s.targetPoint.x, s.targetPoint.y, speed);

      // Shadow glow visibility
      sp.setAlpha(this.isPingIlluminated ? 0.95 : 0.2);
    });
  }

  private renderDarkness() {
    if (!this.darkOverlayGraphics || !this.player) return;

    this.darkOverlayGraphics.clear();

    const w = 600;
    const h = 440;

    // Zero-Knowledge encrypted pitch darkness
    const darknessAlpha = this.isPingIlluminated ? 0.42 : 0.88;
    this.darkOverlayGraphics.fillStyle(0x020406, darknessAlpha);
    this.darkOverlayGraphics.fillRect(0, 0, w, h);

    // Cyan tactical hunter boot beacon around player
    this.darkOverlayGraphics.fillStyle(0x00f0ff, 0.18);
    this.darkOverlayGraphics.fillCircle(this.player.x, this.player.y, 42);
    this.darkOverlayGraphics.fillStyle(0xffffff, 0.24);
    this.darkOverlayGraphics.fillCircle(this.player.x, this.player.y, 20);
  }

  private handleCollectFootprint(
    _p: Phaser.GameObjects.GameObject,
    fpObj: Phaser.GameObjects.GameObject
  ) {
    const footprint = fpObj as Phaser.Physics.Arcade.Sprite;
    const footprintId = footprint.getData("id") as string;

    if (this.collectedIds.includes(footprintId)) return;
    this.collectedIds.push(footprintId);

    this.tweens.add({
      targets: footprint,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 150,
      onComplete: () => footprint.destroy(),
    });

    this.score += 15;
    this.showFloatingText(footprint.x, footprint.y - 12, "+15 PTS", "#38bdf8", "#083344");

    const payload: FootprintCollectedPayload = {
      id: footprintId,
      scoreGained: 15,
      totalScore: this.score,
      collectedCount: this.collectedIds.length,
      totalCount: this.totalFootprints,
      remainingCount: this.totalFootprints - this.collectedIds.length,
    };

    gameEventBus.emit("FOOTPRINT_COLLECTED", payload);
  }

  private generateSector3Textures() {
    // ZK Trace
    if (!this.textures.exists("zk_trace")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xa855f7, 0.85);
      g.fillCircle(8, 8, 7);
      g.fillStyle(0xeaba49, 1);
      g.fillRect(5, 5, 6, 6);
      g.generateTexture("zk_trace", 16, 16);
      g.destroy();
    }

    // Shadow Stalker
    if (!this.textures.exists("shadow_stalker")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x450a0a, 0.95);
      g.fillRect(2, 2, 16, 16);
      g.fillStyle(0xef4444, 1);
      g.fillCircle(6, 7, 2);
      g.fillCircle(14, 7, 2);
      g.lineStyle(1, 0xd97706, 0.8);
      g.strokeRect(1, 1, 18, 18);
      g.generateTexture("shadow_stalker", 20, 20);
      g.destroy();
    }
  }

  private createShieldedEnvironment(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x05070a, 1);
    bg.fillRect(0, 0, width, height);

    // ZK 40px grid matrix
    bg.lineStyle(1, 0x1e1b4b, 0.45);
    for (let x = 0; x <= width; x += 40) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 40) {
      bg.lineBetween(0, y, width, y);
    }

    // Tactical coordinates along top border
    const coordMarkers = [
      { x: 120, label: "ZK:120" },
      { x: 240, label: "ZK:240" },
      { x: 360, label: "ZK:360" },
      { x: 480, label: "ZK:480" },
      { x: 530, label: "GATE ►" },
    ];
    coordMarkers.forEach((m) => {
      const t = this.add.text(m.x, 18, m.label, {
        fontFamily: "monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: "#a855f7",
      });
      t.setOrigin(0.5);
      t.setAlpha(0.75);
    });

    // Extraction beacon zone at x: 530, y: 220
    bg.lineStyle(1, 0x38bdf8, 0.4);
    bg.strokeCircle(530, 220, 45);
    bg.lineStyle(1, 0xeaba49, 0.6);
    bg.strokeCircle(530, 220, 30);

    // Outer border
    bg.lineStyle(2, 0xa855f7, 0.8);
    bg.strokeRect(8, 8, width - 16, height - 16);
  }
}
