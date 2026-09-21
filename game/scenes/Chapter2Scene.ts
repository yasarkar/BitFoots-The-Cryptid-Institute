import * as Phaser from "phaser";
import { BaseSectorScene } from "./BaseSectorScene";
import {
  gameEventBus,
  FootprintCollectedPayload,
} from "@/lib/eventBus";

interface CollapsingTile {
  key: string;
  x: number;
  y: number;
  rect: Phaser.GameObjects.Rectangle;
  state: "intact" | "warning" | "collapsed";
}

export class Chapter2Scene extends BaseSectorScene {
  public readonly sectorId = 2;

  private footprintsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private exitGate!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private laserBeamsGroup!: Phaser.GameObjects.Group;

  private readonly totalFootprints: number = 6;
  private collapsedTiles = new Map<string, CollapsingTile>();
  private lastTileKey: string = "";
  private laserActive: boolean = false;
  private laserTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: "Chapter2Scene" });
  }

  preload() {
    this.preloadBaseAssets();
    this.generateSector2Textures();
  }

  create() {
    this.resetBaseState();
    this.collapsedTiles.clear();
    this.lastTileKey = "";
    this.laserActive = false;

    const mapWidth = 640;
    const mapHeight = 480;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // 1. Orthogonal Lattice Background
    this.create90DegreeEnvironment(mapWidth, mapHeight);

    // 2. Monolith Gate at x: 570, y: 240
    this.exitGate = this.physics.add.staticSprite(570, 240, "monolith_gate");
    this.tweens.add({
      targets: this.exitGate,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.9,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Stepped",
    });

    // 3. Glitch Laser Hazard Beams (Two vertical scanning beams)
    this.laserBeamsGroup = this.add.group();
    const beam1 = this.add.rectangle(260, 240, 6, 380, 0xef4444, 0.2);
    const beam2 = this.add.rectangle(440, 240, 6, 380, 0xef4444, 0.2);
    this.laserBeamsGroup.add(beam1);
    this.laserBeamsGroup.add(beam2);

    this.laserTimer = this.time.addEvent({
      delay: 2400,
      callback: this.toggleLaserBeams,
      callbackScope: this,
      loop: true,
    });

    // 4. 6 Orthogonal Footprints
    this.footprintsGroup = this.physics.add.staticGroup();
    const footprintCoords = [
      { id: "ch2_fp_1", x: 130, y: 110 },
      { id: "ch2_fp_2", x: 230, y: 240 },
      { id: "ch2_fp_3", x: 170, y: 370 },
      { id: "ch2_fp_4", x: 330, y: 110 },
      { id: "ch2_fp_5", x: 420, y: 360 },
      { id: "ch2_fp_6", x: 480, y: 190 },
    ];

    footprintCoords.forEach((pt) => {
      const fp = this.footprintsGroup.create(pt.x, pt.y, "ch2_footprint");
      fp.setData("id", pt.id);
      this.tweens.add({
        targets: fp,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Stepped",
      });
    });

    // 5. Spawn Player with User Profile Avatar
    this.player = this.spawnPlayer(60, 240, 10);

    // 6. Camera setup - Smoothly follow player across orthogonal grid
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, false, 0.15, 0.15);

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

    const left = this.cursors?.left?.isDown || this.wasdKeys?.A?.isDown;
    const right = this.cursors?.right?.isDown || this.wasdKeys?.D?.isDown;
    const up = this.cursors?.up?.isDown || this.wasdKeys?.W?.isDown;
    const down = this.cursors?.down?.isDown || this.wasdKeys?.S?.isDown;

    // Strict 90° Cardinal Vector Constraint
    if (left) {
      vx = -1;
      this.player.setFlipX(true);
    } else if (right) {
      vx = 1;
      this.player.setFlipX(false);
    } else if (up) {
      vy = -1;
    } else if (down) {
      vy = 1;
    }

    this.player.setVelocity(vx * speed, vy * speed);

    // Lively retro walking wobble
    if (vx !== 0 || vy !== 0) {
      this.player.setAngle(Math.sin(this.time.now / 110) * 4);
    } else {
      this.player.setAngle(0);
    }

    // Collapsing Floor Tile Logic
    this.checkCollapsingTiles();

    // Laser Collision Check
    this.checkLaserCollision();
  }

  private checkCollapsingTiles() {
    if (!this.player) return;

    // Tile grid cell size = 32px
    const tileX = Math.floor(this.player.x / 32) * 32;
    const tileY = Math.floor(this.player.y / 32) * 32;
    const key = `${tileX}_${tileY}`;

    // Check if player stepped on an already collapsed tile
    const currentTile = this.collapsedTiles.get(key);
    if (currentTile && currentTile.state === "collapsed") {
      this.takeDamage(1, "Fell into Collapsed Void");
      return;
    }

    // Step on new intact tile
    if (key !== this.lastTileKey && !this.collapsedTiles.has(key)) {
      this.lastTileKey = key;

      const rect = this.add.rectangle(tileX + 16, tileY + 16, 30, 30, 0xeaba49, 0.35);
      rect.setDepth(1);

      const tileData: CollapsingTile = {
        key,
        x: tileX,
        y: tileY,
        rect,
        state: "warning",
      };
      this.collapsedTiles.set(key, tileData);

      // Warning flicker then collapse after 1400ms
      this.tweens.add({
        targets: rect,
        fillColor: 0xef4444,
        alpha: 0.8,
        duration: 700,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          tileData.state = "collapsed";
          rect.setFillStyle(0x000000, 0.95);
          rect.setStrokeStyle(1, 0xef4444, 0.8);
        },
      });
    }
  }

  private toggleLaserBeams() {
    this.laserActive = !this.laserActive;
    const color = this.laserActive ? 0xff0055 : 0xef4444;
    const alpha = this.laserActive ? 0.9 : 0.15;

    this.laserBeamsGroup.getChildren().forEach((b) => {
      const rect = b as Phaser.GameObjects.Rectangle;
      rect.setFillStyle(color, alpha);
    });
  }

  private checkLaserCollision() {
    if (!this.laserActive || !this.player) return;

    const px = this.player.x;
    // Laser 1 is at x: 260, Laser 2 is at x: 440
    if ((Math.abs(px - 260) < 10 && this.player.y > 50 && this.player.y < 430) ||
        (Math.abs(px - 440) < 10 && this.player.y > 50 && this.player.y < 430)) {
      this.takeDamage(1, "Laser Pulse Disruption");
    }
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

    this.score += 10;
    this.showFloatingText(footprint.x, footprint.y - 12, "+10 PTS", "#00f0ff", "#083344");

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

  private generateSector2Textures() {
    if (!this.textures.exists("ch2_footprint")) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00f0ff, 1);
      g.fillRect(3, 3, 10, 10);
      g.fillStyle(0xeaba49, 1);
      g.fillRect(5, 5, 6, 6);
      g.fillStyle(0xffffff, 1);
      g.fillRect(7, 7, 2, 2);
      g.generateTexture("ch2_footprint", 16, 16);
      g.destroy();
    }
  }

  private create90DegreeEnvironment(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x06090e, 1);
    bg.fillRect(0, 0, width, height);

    // 32px Grid lattice
    const step = 32;
    bg.lineStyle(1, 0x1a2638, 0.45);
    for (let x = 0; x <= width; x += step) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += step) {
      bg.lineBetween(0, y, width, y);
    }

    // Glowing grid coordinate stamps
    const coordMarkers = [
      { x: 128, label: "X:128" },
      { x: 256, label: "X:256" },
      { x: 384, label: "X:384" },
      { x: 512, label: "X:512" },
      { x: 570, label: "GATE ►" },
    ];
    coordMarkers.forEach((m) => {
      const t = this.add.text(m.x, 22, m.label, {
        fontFamily: "monospace",
        fontSize: "8px",
        fontStyle: "bold",
        color: "#00f0ff",
      });
      t.setOrigin(0.5);
      t.setAlpha(0.7);
    });

    // Laser hazard floor stripes at x: 260 and x: 440
    [260, 440].forEach((lx, idx) => {
      bg.fillStyle(0xef4444, 0.08);
      bg.fillRect(lx - 12, 30, 24, height - 60);

      const warnTxt = this.add.text(lx, height - 26, `[⚠ HAZARD 0${idx + 1}]`, {
        fontFamily: "monospace",
        fontSize: "7px",
        fontStyle: "bold",
        color: "#ef4444",
      });
      warnTxt.setOrigin(0.5);
      warnTxt.setAlpha(0.75);
    });

    // Directional vector glyphs pointing right
    [96, 200, 350, 490].forEach((gx) => {
      const arrow = this.add.text(gx, 240, "►", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#00f0ff",
      });
      arrow.setOrigin(0.5);
      arrow.setAlpha(0.25);
    });

    // Outer cyber border
    bg.lineStyle(2, 0xeaba49, 0.85);
    bg.strokeRect(10, 10, width - 20, height - 20);
  }
}
