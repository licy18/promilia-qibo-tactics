import Phaser from "phaser";
import { elementIconKey } from "../assets/elementManifest";
import {
  ACTIVE_ROWS,
  BOARD_COLUMNS,
  BOARD_ROWS,
  ELEMENT_COLORS,
  ELEMENT_LABELS,
  getSquadById
} from "../simulation/content";
import { BattleEngine } from "../simulation/battleEngine";
import type {
  BattleSnapshot,
  BattleUiSnapshot,
  BoardPoint,
  CrystalState,
  SquadPreset,
  UnitState
} from "../simulation/types";

type BattleCommand =
  | {
      type: "start";
      playerSquadId: string;
      enemySquadId: string;
      playerSquad?: SquadPreset;
      enemySquad?: SquadPreset;
      speed: number;
    }
  | {
      type: "pause";
    }
  | {
      type: "resume";
    }
  | {
      type: "skip";
    };

const TEAM_COLORS = {
  player: {
    stroke: 0x67e8f9,
    crystal: 0x22d3ee,
    text: "#cffafe"
  },
  enemy: {
    stroke: 0xfb7185,
    crystal: 0xf43f5e,
    text: "#ffe4e6"
  }
} as const;

export class GameScene extends Phaser.Scene {
  private battle?: BattleEngine;
  private entityLayer?: Phaser.GameObjects.Container;
  private boardGraphics?: Phaser.GameObjects.Graphics;
  private boardLeft = 0;
  private boardTop = 0;
  private cellSize = 48;
  private running = true;
  private speed = 1.25;
  private lastUiDispatch = 0;
  private playerSquadId = "balanced";
  private enemySquadId = "swarm";
  private playerSquad?: SquadPreset;
  private enemySquad?: SquadPreset;
  private handleWindowCommand = (event: Event) => {
    this.handleCommand((event as CustomEvent<BattleCommand>).detail);
  };

  constructor() {
    super("GameScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0b1020");
    this.layoutBoard();
    this.drawBoard();
    this.entityLayer = this.add.container(0, 0);

    window.addEventListener("qibattle:command", this.handleWindowCommand);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("qibattle:command", this.handleWindowCommand);
    });

    this.startBattle({
      type: "start",
      playerSquadId: "balanced",
      enemySquadId: "swarm",
      speed: this.speed
    });
  }

  update(_time: number, delta: number) {
    if (!this.battle) {
      return;
    }

    if (this.running) {
      this.battle.step((delta / 1000) * this.speed);
    }

    const snapshot = this.battle.snapshot();
    this.renderBattle(snapshot);

    if (_time - this.lastUiDispatch > 160 || snapshot.status === "finished") {
      this.dispatchUiUpdate(this.battle.uiSnapshot());
      this.lastUiDispatch = _time;
    }

    if (snapshot.status === "finished") {
      this.running = false;
    }
  }

  private handleCommand(command?: BattleCommand) {
    if (!command) {
      return;
    }

    if (command.type === "start") {
      this.startBattle(command);
      return;
    }

    if (!this.battle) {
      return;
    }

    if (command.type === "pause") {
      this.running = false;
      this.dispatchUiUpdate(this.battle.uiSnapshot());
      return;
    }

    if (command.type === "resume") {
      this.running = this.battle.snapshot().status !== "finished";
      this.dispatchUiUpdate(this.battle.uiSnapshot());
      return;
    }

    if (command.type === "skip") {
      this.battle.skipToEnd();
      this.running = false;
      this.renderBattle(this.battle.snapshot());
      this.dispatchUiUpdate(this.battle.uiSnapshot());
    }
  }

  private startBattle(command: Extract<BattleCommand, { type: "start" }>) {
    this.speed = command.speed;
    this.playerSquadId = command.playerSquadId;
    this.enemySquadId = command.enemySquadId;
    this.playerSquad = command.playerSquad;
    this.enemySquad = command.enemySquad;
    this.battle = new BattleEngine({
      playerSquadId: command.playerSquadId,
      enemySquadId: command.enemySquadId,
      playerSquad: command.playerSquad,
      enemySquad: command.enemySquad
    });
    this.battle.start();
    this.running = true;
    this.renderBattle(this.battle.snapshot());
    this.dispatchUiUpdate(this.battle.uiSnapshot());
  }

  private layoutBoard() {
    const { width, height } = this.scale;
    this.cellSize = Math.min(54, Math.floor((height - 96) / BOARD_ROWS));
    this.boardLeft = Math.round(width / 2 - (BOARD_COLUMNS * this.cellSize) / 2);
    this.boardTop = Math.round(height / 2 - (BOARD_ROWS * this.cellSize) / 2);
  }

  private drawBoard() {
    this.boardGraphics?.destroy();
    this.boardGraphics = this.add.graphics();

    const graphics = this.boardGraphics;
    const width = BOARD_COLUMNS * this.cellSize;
    const height = BOARD_ROWS * this.cellSize;

    graphics.fillStyle(0x101827, 1);
    graphics.fillRoundedRect(this.boardLeft - 18, this.boardTop - 18, width + 36, height + 36, 10);
    graphics.lineStyle(2, 0x263246, 1);
    graphics.strokeRoundedRect(this.boardLeft - 18, this.boardTop - 18, width + 36, height + 36, 10);

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLUMNS; col += 1) {
        const x = this.boardLeft + col * this.cellSize;
        const y = this.boardTop + row * this.cellSize;
        const isEnemyDeploy = row < 2;
        const isPlayerDeploy = row >= BOARD_ROWS - 2;
        const fill = isEnemyDeploy ? 0x251523 : isPlayerDeploy ? 0x0f2830 : 0x111a2c;

        graphics.fillStyle(fill, 1);
        graphics.fillRect(x, y, this.cellSize, this.cellSize);
        graphics.lineStyle(1, 0x334155, 0.75);
        graphics.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }

    graphics.lineStyle(3, 0x475569, 0.8);
    graphics.lineBetween(this.boardLeft, this.boardTop + 2 * this.cellSize, this.boardLeft + width, this.boardTop + 2 * this.cellSize);
    graphics.lineBetween(
      this.boardLeft,
      this.boardTop + (2 + ACTIVE_ROWS) * this.cellSize,
      this.boardLeft + width,
      this.boardTop + (2 + ACTIVE_ROWS) * this.cellSize
    );

    this.addZoneLabel("敌方预置", this.boardTop - 34, TEAM_COLORS.enemy.text);
    this.addZoneLabel("6x8 自动战场", this.boardTop + this.cellSize * 6 - 10, "#cbd5e1");
    this.addZoneLabel("我方预置", this.boardTop + this.cellSize * BOARD_ROWS + 20, TEAM_COLORS.player.text);
  }

  private addZoneLabel(text: string, y: number, color: string) {
    this.add
      .text(this.boardLeft + (BOARD_COLUMNS * this.cellSize) / 2, y, text, {
        color,
        fontFamily: "Microsoft YaHei, system-ui, sans-serif",
        fontSize: "15px",
        fontStyle: "700"
      })
      .setOrigin(0.5);
  }

  private renderBattle(snapshot: BattleSnapshot) {
    if (!this.entityLayer) {
      return;
    }

    this.entityLayer.removeAll(true);

    this.drawSquadBanners(snapshot);
    this.drawCrystal(snapshot.crystals.enemy);
    this.drawCrystal(snapshot.crystals.player);

    for (const unit of snapshot.units) {
      if (unit.alive) {
        this.drawUnit(unit);
      }
    }

    if (snapshot.status === "finished") {
      this.drawResultStamp(snapshot);
    }
  }

  private drawSquadBanners(snapshot: BattleSnapshot) {
    const playerSquad = this.playerSquad ?? getSquadById(this.playerSquadId);
    const enemySquad = this.enemySquad ?? getSquadById(this.enemySquadId);
    const timeText = `${snapshot.time.toFixed(1)} / ${snapshot.duration}s`;

    this.entityLayer?.add(
      this.add
        .text(this.boardLeft + BOARD_COLUMNS * this.cellSize + 48, this.boardTop + 8, timeText, {
          color: "#f8fafc",
          fontFamily: "Microsoft YaHei, system-ui, sans-serif",
          fontSize: "18px",
          fontStyle: "800"
        })
        .setOrigin(0, 0)
    );

    this.entityLayer?.add(
      this.add
        .text(this.boardLeft + BOARD_COLUMNS * this.cellSize + 48, this.boardTop + 34, enemySquad.style, {
          color: TEAM_COLORS.enemy.text,
          fontFamily: "Microsoft YaHei, system-ui, sans-serif",
          fontSize: "13px",
          fontStyle: "700"
        })
        .setOrigin(0, 0)
    );

    this.entityLayer?.add(
      this.add
        .text(this.boardLeft - 48, this.boardTop + BOARD_ROWS * this.cellSize - 22, playerSquad.style, {
          color: TEAM_COLORS.player.text,
          fontFamily: "Microsoft YaHei, system-ui, sans-serif",
          fontSize: "13px",
          fontStyle: "700"
        })
        .setOrigin(1, 0.5)
    );
  }

  private drawUnit(unit: UnitState) {
    const center = this.gridToWorld(unit.position);
    const radius = this.cellSize * 0.38;
    const color = ELEMENT_COLORS[unit.element];
    const teamColor = TEAM_COLORS[unit.team];
    const container = this.add.container(center.x, center.y);
    const shadow = this.add.circle(2, 3, radius + 5, 0x020617, 0.42);
    const teamRing = this.add.circle(0, 0, radius + 4, teamColor.stroke, 0);
    const elementPlate = this.add.circle(0, 0, radius + 1, color, 0.88);
    const avatar = this.createUnitAvatar(unit, radius);
    const elementBadge = this.createElementBadge(unit, radius);
    const cost = this.add
      .text(radius - 1, radius - 7, String(unit.cost), {
        color: "#0f172a",
        fontFamily: "system-ui, sans-serif",
        fontSize: "12px",
        fontStyle: "900"
      })
      .setOrigin(1, 1);
    const costBadge = this.add.circle(radius - 7, radius - 12, 8, 0xfacc15, 1);
    const namePlate = this.add
      .text(0, radius + 10, unit.name, {
        color: "#f8fafc",
        fontFamily: "Microsoft YaHei, system-ui, sans-serif",
        fontSize: "10px",
        fontStyle: "900"
      })
      .setOrigin(0.5, 0);

    teamRing.setStrokeStyle(3, teamColor.stroke, 1);
    elementPlate.setStrokeStyle(2, color, 1);
    container.add([shadow, teamRing, elementPlate, avatar, elementBadge, costBadge, cost, namePlate]);
    this.addHpBar(container, unit.hp, unit.maxHp, radius * 1.42);

    if (unit.barrier > 0) {
      const shield = this.add.circle(0, 0, radius + 6, 0x67e8f9, 0.16);
      shield.setStrokeStyle(1, 0x67e8f9, 0.65);
      container.addAt(shield, 0);
    }

    if (unit.slowedUntil > snapshotTimeSafe(this.battle)) {
      const slow = this.add.circle(-radius + 6, -radius + 6, 4, 0x93c5fd, 1);
      container.add(slow);
    }

    this.entityLayer?.add(container);
  }

  private createUnitAvatar(unit: UnitState, radius: number) {
    if (!this.textures.exists(unit.avatarKey)) {
      return this.add
        .text(0, -1, unit.shortName, {
          color: unit.element === "light" ? "#0f172a" : "#f8fafc",
          fontFamily: "Microsoft YaHei, system-ui, sans-serif",
          fontSize: "18px",
          fontStyle: "900"
        })
        .setOrigin(0.5);
    }

    const avatar = this.add.image(0, -1, unit.avatarKey);
    avatar.setDisplaySize(radius * 1.8, radius * 1.8);
    avatar.setAlpha(0.98);
    return avatar;
  }

  private createElementBadge(unit: UnitState, radius: number) {
    const key = elementIconKey(unit.element);
    const badgeBack = this.add.circle(-radius + 4, -radius + 4, 8, 0x020617, 0.72);

    if (!this.textures.exists(key)) {
      const label = this.add
        .text(-radius + 4, -radius + 4, ELEMENT_LABELS[unit.element], {
          color: unit.element === "light" ? "#0f172a" : "#f8fafc",
          fontFamily: "Microsoft YaHei, system-ui, sans-serif",
          fontSize: "10px",
          fontStyle: "900"
        })
        .setOrigin(0.5);

      return this.add.container(0, 0, [badgeBack, label]);
    }

    const icon = this.add.image(-radius + 4, -radius + 4, key).setDisplaySize(15, 15);
    return this.add.container(0, 0, [badgeBack, icon]);
  }

  private drawCrystal(crystal: CrystalState) {
    const center = this.gridToWorld(crystal.position);
    const size = this.cellSize * 0.68;
    const teamColor = TEAM_COLORS[crystal.team];
    const container = this.add.container(center.x, center.y);
    const base = this.add.rectangle(0, 0, size, size, teamColor.crystal, 0.9);
    const core = this.add.circle(0, 0, size * 0.28, ELEMENT_COLORS[crystal.element], 1);
    const label = this.add
      .text(0, 0, crystal.shortName, {
        color: "#0f172a",
        fontFamily: "Microsoft YaHei, system-ui, sans-serif",
        fontSize: "18px",
        fontStyle: "900"
      })
      .setOrigin(0.5);

    base.setRotation(Math.PI / 4);
    base.setStrokeStyle(3, teamColor.stroke, 0.95);
    container.add([base, core, label]);
    this.addHpBar(container, crystal.hp, crystal.maxHp, size * 0.72);

    if (crystal.barrier > 0) {
      const shield = this.add.rectangle(0, 0, size + 14, size + 14, 0x67e8f9, 0.12);
      shield.setRotation(Math.PI / 4);
      shield.setStrokeStyle(2, 0x67e8f9, 0.7);
      container.addAt(shield, 0);
    }

    this.entityLayer?.add(container);
  }

  private addHpBar(
    container: Phaser.GameObjects.Container,
    hp: number,
    maxHp: number,
    width: number
  ) {
    const ratio = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    const y = this.cellSize * 0.38;
    const bg = this.add.rectangle(0, y, width, 5, 0x020617, 0.82);
    const fg = this.add.rectangle(-width / 2 + (width * ratio) / 2, y, width * ratio, 5, hpColor(ratio), 1);

    bg.setStrokeStyle(1, 0x0f172a, 0.8);
    container.add([bg, fg]);
  }

  private drawResultStamp(snapshot: BattleSnapshot) {
    const label =
      snapshot.winner === "draw"
        ? "平局"
        : snapshot.winner === "player"
          ? "我方胜利"
          : "敌方胜利";

    const x = this.boardLeft + (BOARD_COLUMNS * this.cellSize) / 2;
    const y = this.boardTop + (BOARD_ROWS * this.cellSize) / 2;
    const panel = this.add.rectangle(x, y, 240, 64, 0x020617, 0.78);
    const text = this.add
      .text(x, y, label, {
        color: "#f8fafc",
        fontFamily: "Microsoft YaHei, system-ui, sans-serif",
        fontSize: "30px",
        fontStyle: "900"
      })
      .setOrigin(0.5);

    panel.setStrokeStyle(2, snapshot.winner === "player" ? 0x67e8f9 : 0xfb7185, 0.9);
    this.entityLayer?.add([panel, text]);
  }

  private gridToWorld(point: BoardPoint) {
    return {
      x: this.boardLeft + point.col * this.cellSize + this.cellSize / 2,
      y: this.boardTop + point.row * this.cellSize + this.cellSize / 2
    };
  }

  private dispatchUiUpdate(snapshot: BattleUiSnapshot) {
    window.dispatchEvent(
      new CustomEvent<BattleUiSnapshot>("qibattle:update", {
        detail: snapshot
      })
    );
  }
}

function hpColor(ratio: number) {
  if (ratio > 0.55) {
    return 0x22c55e;
  }

  if (ratio > 0.25) {
    return 0xfacc15;
  }

  return 0xef4444;
}

function snapshotTimeSafe(battle?: BattleEngine) {
  return battle?.snapshot().time ?? 0;
}
