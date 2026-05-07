import {
  BATTLE_DURATION_SECONDS,
  BOARD_COLUMNS,
  BOARD_ROWS,
  CHARACTER_CARDS,
  MAX_DEPLOYED_UNITS,
  MAX_SQUAD_COST,
  QIBO_DEFINITIONS,
  getSquadById,
  getSquadCost
} from "./content";
import type {
  BattleEvent,
  BattleResult,
  BattleScore,
  BattleSnapshot,
  BattleStatus,
  BattleUiSnapshot,
  BoardPoint,
  CharacterCardDefinition,
  CrystalState,
  SquadPreset,
  TeamId,
  UnitDefinition,
  UnitState
} from "./types";

const STEP_SECONDS = 0.1;
const TEAM_LABELS: Record<TeamId, string> = {
  player: "我方",
  enemy: "敌方"
};

type CombatTarget =
  | {
      kind: "unit";
      state: UnitState;
    }
  | {
      kind: "crystal";
      state: CrystalState;
    };

export interface BattleEngineOptions {
  playerSquadId: string;
  enemySquadId: string;
  playerSquad?: SquadPreset;
  enemySquad?: SquadPreset;
}

export class BattleEngine {
  private time = 0;
  private units: UnitState[] = [];
  private crystals: Record<TeamId, CrystalState>;
  private events: BattleEvent[] = [];
  private nextEventId = 1;
  private result: BattleResult;

  constructor(options: BattleEngineOptions) {
    const playerSquad = options.playerSquad ?? getSquadById(options.playerSquadId);
    const enemySquad = options.enemySquad ?? getSquadById(options.enemySquadId);

    this.assertValidSquad(playerSquad);
    this.assertValidSquad(enemySquad);

    this.crystals = {
      player: this.createCrystal("player", playerSquad),
      enemy: this.createCrystal("enemy", enemySquad)
    };
    this.units = [
      ...this.createUnits("player", playerSquad),
      ...this.createUnits("enemy", enemySquad)
    ];
    this.result = this.createResult("ready");
    this.pushEvent(
      `${playerSquad.name} 对阵 ${enemySquad.name}，${MAX_SQUAD_COST}费/${MAX_DEPLOYED_UNITS}格开战。`,
      "objective"
    );
  }

  start() {
    if (this.result.status === "ready") {
      this.result = this.createResult("running");
    }
  }

  step(seconds: number) {
    if (this.result.status !== "running") {
      return this.snapshot();
    }

    const targetTime = Math.min(this.time + seconds, BATTLE_DURATION_SECONDS);

    while (this.time < targetTime && this.result.status === "running") {
      this.time = Math.min(targetTime, this.time + STEP_SECONDS);
      this.resolveCrystalActions("player");
      this.resolveCrystalActions("enemy");
      this.resolveUnits();
      this.checkBattleEnd();
    }

    return this.snapshot();
  }

  skipToEnd() {
    if (this.result.status === "ready") {
      this.start();
    }

    while (this.result.status === "running") {
      this.step(1);
    }

    return this.snapshot();
  }

  snapshot(): BattleSnapshot {
    return {
      time: this.time,
      duration: BATTLE_DURATION_SECONDS,
      status: this.result.status,
      winner: this.result.winner,
      result: this.result,
      units: this.units.map((unit) => ({ ...unit, position: { ...unit.position } })),
      crystals: {
        player: { ...this.crystals.player, position: { ...this.crystals.player.position } },
        enemy: { ...this.crystals.enemy, position: { ...this.crystals.enemy.position } }
      },
      recentEvents: this.events.slice(-7)
    };
  }

  uiSnapshot(): BattleUiSnapshot {
    const snapshot = this.snapshot();
    return {
      time: snapshot.time,
      duration: snapshot.duration,
      status: snapshot.status,
      winner: snapshot.winner,
      reason: snapshot.result.reason,
      playerCrystalHpPercent: this.hpPercent(this.crystals.player),
      enemyCrystalHpPercent: this.hpPercent(this.crystals.enemy),
      playerLivingCost: this.livingCost("player"),
      enemyLivingCost: this.livingCost("enemy"),
      playerScore: snapshot.result.playerScore.score,
      enemyScore: snapshot.result.enemyScore.score,
      recentEvents: snapshot.recentEvents
    };
  }

  private assertValidSquad(squad: SquadPreset) {
    const cost = getSquadCost(squad);

    if (cost > MAX_SQUAD_COST) {
      throw new Error(`${squad.name} cost ${cost} exceeds ${MAX_SQUAD_COST}`);
    }

    if (squad.placements.length > MAX_DEPLOYED_UNITS) {
      throw new Error(`${squad.name} has too many deployed units`);
    }
  }

  private createCrystal(team: TeamId, squad: SquadPreset): CrystalState {
    const card = CHARACTER_CARDS[squad.cardId];

    return {
      team,
      cardId: card.id,
      name: card.name,
      shortName: card.shortName,
      element: card.element,
      hp: card.maxHp,
      maxHp: card.maxHp,
      armor: card.armor,
      barrier: 0,
      position: {
        col: squad.cardLane,
        row: team === "player" ? BOARD_ROWS - 1 : 0
      },
      nextAttackAt: 0.4,
      nextAbilityAt: card.abilityInterval * 0.7
    };
  }

  private createUnits(team: TeamId, squad: SquadPreset): UnitState[] {
    return squad.placements.map((placement, index) => {
      const definition = QIBO_DEFINITIONS[placement.definitionId];
      const row =
        team === "player" ? BOARD_ROWS - 2 + placement.rank : 1 - placement.rank;

      return {
        uid: `${team}-${index}-${definition.id}`,
        definitionId: definition.id,
        name: definition.name,
        shortName: definition.shortName,
        officialNo: definition.officialNo,
        officialTag: definition.officialTag,
        avatarKey: definition.avatarKey,
        cost: definition.cost,
        team,
        element: definition.element,
        role: definition.role,
        combatProfile: definition.combatProfile,
        moveStyle: definition.moveStyle,
        targetPriority: definition.targetPriority,
        hp: definition.stats.hp,
        maxHp: definition.stats.hp,
        armor: definition.stats.armor,
        attack: definition.stats.attack,
        attackRange: definition.stats.attackRange,
        attackDelay: definition.stats.attackDelay,
        moveDelay: definition.stats.moveDelay,
        barrier: 0,
        position: {
          col: placement.lane,
          row
        },
        alive: true,
        nextAttackAt: definition.stats.windup,
        nextMoveAt: definition.stats.moveDelay * 0.65,
        slowedUntil: 0
      };
    });
  }

  private resolveCrystalActions(team: TeamId) {
    const crystal = this.crystals[team];
    const card = CHARACTER_CARDS[crystal.cardId];

    if (crystal.hp <= 0) {
      return;
    }

    if (this.time >= crystal.nextAttackAt) {
      const target = this.findNearestEnemyTarget(team, crystal.position, card.attackRange);

      if (target) {
        this.damageTarget(
          target,
          card.attackDamage,
          card.element,
          `${TEAM_LABELS[team]}${card.shortName}`
        );
      }

      crystal.nextAttackAt = this.time + card.attackDelay;
    }

    if (this.time >= crystal.nextAbilityAt) {
      this.resolveCardAbility(team, card);
      crystal.nextAbilityAt = this.time + card.abilityInterval;
    }
  }

  private resolveCardAbility(team: TeamId, card: CharacterCardDefinition) {
    if (card.ability.type === "healLowest") {
      const target = this.findMostWoundedFriendly(team);

      if (target) {
        this.healTarget(target, card.ability.amount, `${TEAM_LABELS[team]}${card.shortName}`);
      }

      return;
    }

    if (card.ability.type === "shieldLowest") {
      const target = this.findMostThreatenedFriendly(team);

      if (target) {
        target.state.barrier += card.ability.amount;
        this.pushEvent(
          `${TEAM_LABELS[team]}${card.shortName}为${target.state.shortName}展开护盾`,
          "heal"
        );
      }

      return;
    }

    const targets = this.enemyTargets(team)
      .sort((a, b) => this.targetHpPercent(a) - this.targetHpPercent(b))
      .slice(0, card.ability.jumps);

    for (const target of targets) {
      this.damageTarget(target, card.ability.amount, card.element, `${TEAM_LABELS[team]}${card.shortName}`);
    }

    if (targets.length > 0) {
      this.pushEvent(`${TEAM_LABELS[team]}${card.shortName}触发连锁压制`, "hit");
    }
  }

  private resolveUnits() {
    const activeUnits = this.units
      .filter((unit) => unit.alive)
      .sort((a, b) => a.nextAttackAt - b.nextAttackAt || a.nextMoveAt - b.nextMoveAt);

    for (const unit of activeUnits) {
      if (!unit.alive || this.result.status !== "running") {
        continue;
      }

      const definition = QIBO_DEFINITIONS[unit.definitionId];

      if (this.time >= unit.nextAttackAt) {
        if (this.resolveUnitAction(unit, definition)) {
          unit.nextAttackAt = this.time + this.attackDelayFor(unit);
          continue;
        }

        unit.nextAttackAt = Math.max(unit.nextAttackAt, this.time + 0.15);
      }

      if (this.time >= unit.nextMoveAt) {
        this.moveUnit(unit);
        unit.nextMoveAt = this.time + this.moveDelayFor(unit);
      }
    }
  }

  private resolveUnitAction(unit: UnitState, definition: UnitDefinition) {
    if (definition.specialAction === "energize" && unit.cost <= 1) {
      const ally = this.findEnergizeTarget(unit);

      if (ally) {
        ally.nextAttackAt = Math.min(ally.nextAttackAt, this.time + 0.18);
        ally.nextMoveAt = Math.min(ally.nextMoveAt, this.time + 0.22);
        this.pushEvent(`${unit.shortName}与${ally.shortName}协同充能`, "heal");
        return true;
      }
    }

    if (definition.specialAction === "healer") {
      const ally = this.findMostWoundedFriendly(unit.team, unit.position, unit.attackRange);

      if (ally) {
        this.healTarget(ally, unit.attack, unit.shortName);
        return true;
      }
    }

    if (definition.specialAction === "barrier") {
      const ally = this.findMostThreatenedFriendly(unit.team, unit.position, unit.attackRange);

      if (ally) {
        ally.state.barrier += Math.round(unit.attack * 1.45);
        this.pushEvent(`${unit.shortName}为${ally.state.shortName}补上护盾`, "heal");
        return true;
      }
    }

    if (definition.specialAction === "territoryPulse") {
      const targets = this.enemyTargets(unit.team).filter(
        (target) =>
          this.isTargetAlive(target) && this.distance(unit.position, target.state.position) <= 2
      );

      if (targets.length > 0) {
        for (const target of targets.slice(0, 3)) {
          this.damageTarget(
            target,
            Math.round(unit.attack * 0.42),
            unit.element,
            `${unit.shortName}领地`
          );
        }

        this.pushEvent(`${unit.shortName}展开领地压制`, "hit");
        return true;
      }
    }

    const target = this.selectTargetForUnit(unit, true);

    if (!target) {
      if (definition.specialAction === "energize") {
        const ally = this.findEnergizeTarget(unit);

        if (ally) {
          ally.nextAttackAt = Math.min(ally.nextAttackAt, this.time + 0.18);
          ally.nextMoveAt = Math.min(ally.nextMoveAt, this.time + 0.22);
          this.pushEvent(`${unit.shortName}与${ally.shortName}协同充能`, "heal");
          return true;
        }
      }

      return false;
    }

    this.damageTarget(target, unit.attack, unit.element, unit.shortName);

    const splashRadius = definition.splashRadius;

    if (splashRadius) {
      const splashTargets = this.enemyTargets(unit.team).filter((candidate) => {
        if (candidate === target || !this.isTargetAlive(candidate)) {
          return false;
        }

        return this.distance(candidate.state.position, target.state.position) <= splashRadius;
      });

      for (const splashTarget of splashTargets) {
        this.damageTarget(
          splashTarget,
          Math.round(unit.attack * 0.45),
          unit.element,
          `${unit.shortName}溅射`
        );
      }
    }

    if (
      (definition.statusOnHit === "slow" || definition.specialAction === "harassSlow") &&
      target.kind === "unit"
    ) {
      const slowDuration = definition.specialAction === "harassSlow" ? 2.8 : 2.2;
      target.state.slowedUntil = Math.max(target.state.slowedUntil, this.time + slowDuration);
      target.state.nextMoveAt += definition.specialAction === "harassSlow" ? 0.55 : 0.35;
      target.state.nextAttackAt += definition.specialAction === "harassSlow" ? 0.25 : 0;
      this.pushEvent(`${target.state.shortName}被${unit.shortName}侵扰缓速`, "hit");
    }

    return true;
  }

  private moveUnit(unit: UnitState) {
    const target = this.selectTargetForUnit(unit, false);

    if (!target) {
      return;
    }

    const goal = this.goalForUnit(unit, target.state.position);
    const next = this.chooseNextCell(unit, goal);

    if (!next || this.samePoint(unit.position, next)) {
      return;
    }

    unit.position = next;
  }

  private goalForUnit(unit: UnitState, targetPosition: BoardPoint) {
    if (unit.moveStyle === "guard") {
      return this.guardGoal(unit, targetPosition);
    }

    if (unit.moveStyle === "supportFollow") {
      return this.supportGoal(unit, targetPosition);
    }

    if (unit.moveStyle === "territory") {
      return this.territoryGoal(unit, targetPosition);
    }

    return targetPosition;
  }

  private chooseNextCell(unit: UnitState, goal: BoardPoint) {
    const candidates = this.movementCandidates(unit, goal)
      .filter((point) => this.isCellOpen(point))
      .sort((a, b) => this.distance(a, goal) - this.distance(b, goal));

    return candidates[0];
  }

  private movementCandidates(unit: UnitState, goal: BoardPoint) {
    const current = unit.position;
    const vertical = Math.sign(goal.row - current.row);
    const horizontal = Math.sign(goal.col - current.col);
    const flankLane = current.col < BOARD_COLUMNS / 2 ? 0 : BOARD_COLUMNS - 1;
    const towardFlank = Math.sign(flankLane - current.col);
    const candidates: BoardPoint[] = [];

    const add = (colDelta: number, rowDelta: number) => {
      const point = {
        col: current.col + colDelta,
        row: current.row + rowDelta
      };

      if (this.isInsideBoard(point)) {
        candidates.push(point);
      }
    };

    if (unit.moveStyle === "flank" && current.col !== flankLane) {
      add(towardFlank, 0);
    }

    if (unit.moveStyle === "flying") {
      add(horizontal, vertical);
    }

    if (unit.moveStyle === "supportFollow" && this.distance(current, goal) <= 2) {
      add(-horizontal, 0);
      add(0, -vertical);
    }

    if (unit.moveStyle === "artillery" && this.distance(current, goal) <= Math.max(1, unit.attackRange - 1)) {
      add(-horizontal, -vertical);
    }

    if (unit.moveStyle === "territory" && this.distance(current, goal) <= unit.attackRange) {
      add(horizontal, 0);
      add(-horizontal, 0);
    }

    add(horizontal, 0);
    add(0, vertical);
    add(horizontal, vertical);
    add(-horizontal, 0);
    add(0, -vertical);
    add(1, 0);
    add(-1, 0);

    return candidates.filter((point) => !this.samePoint(point, current));
  }

  private guardGoal(unit: UnitState, fallback: BoardPoint) {
    const friendlyCrystal = this.crystals[unit.team];
    const threat = this.enemyTargets(unit.team)
      .filter((target) => target.kind === "unit")
      .sort(
        (a, b) =>
          this.distance(a.state.position, friendlyCrystal.position) -
          this.distance(b.state.position, friendlyCrystal.position)
      )[0];

    if (threat && this.distance(threat.state.position, friendlyCrystal.position) <= 4) {
      return threat.state.position;
    }

    if (this.distance(unit.position, friendlyCrystal.position) > 2) {
      return friendlyCrystal.position;
    }

    return fallback;
  }

  private supportGoal(unit: UnitState, fallback: BoardPoint) {
    const supportTarget = this.findMostThreatenedFriendly(unit.team);

    if (supportTarget && supportTarget.kind === "unit" && supportTarget.state.uid !== unit.uid) {
      if (this.distance(unit.position, supportTarget.state.position) > Math.max(1, unit.attackRange - 1)) {
        return supportTarget.state.position;
      }

      return unit.position;
    }

    const friendlyCrystal = this.crystals[unit.team];

    if (this.distance(unit.position, friendlyCrystal.position) > 3) {
      return friendlyCrystal.position;
    }

    return fallback;
  }

  private territoryGoal(unit: UnitState, fallback: BoardPoint) {
    const lane = unit.position.col;
    const forwardRow = unit.team === "player" ? 5 : 6;
    const anchor = {
      col: lane,
      row: forwardRow
    };
    const threat = this.enemyTargets(unit.team)
      .filter((target) => target.kind === "unit" && target.state.position.col === lane)
      .sort(
        (a, b) =>
          this.distance(unit.position, a.state.position) -
          this.distance(unit.position, b.state.position)
      )[0];

    if (threat && this.distance(unit.position, threat.state.position) <= 4) {
      return threat.state.position;
    }

    if (this.distance(unit.position, anchor) > 1) {
      return anchor;
    }

    return fallback;
  }

  private selectTargetForUnit(unit: UnitState, requireRange: boolean): CombatTarget | undefined {
    const candidates = this.enemyTargets(unit.team).filter((target) => {
      if (!requireRange) {
        return true;
      }

      return this.distance(unit.position, target.state.position) <= unit.attackRange;
    });

    if (candidates.length === 0) {
      return undefined;
    }

    const enemyCrystal = this.targetForCrystal(this.enemyTeam(unit.team));

    if (
      unit.targetPriority === "crystal" &&
      (!requireRange || this.distance(unit.position, enemyCrystal.state.position) <= unit.attackRange)
    ) {
      return enemyCrystal;
    }

    if (unit.targetPriority === "lowestHp") {
      return candidates.sort((a, b) => this.targetHpPercent(a) - this.targetHpPercent(b))[0];
    }

    if (unit.targetPriority === "frontline") {
      return candidates.sort((a, b) => this.frontlineScore(unit.team, a) - this.frontlineScore(unit.team, b))[0];
    }

    if (unit.targetPriority === "backline") {
      return candidates.sort((a, b) => this.backlineScore(unit.team, a) - this.backlineScore(unit.team, b))[0];
    }

    return candidates.sort(
      (a, b) =>
        this.distance(unit.position, a.state.position) -
        this.distance(unit.position, b.state.position)
    )[0];
  }

  private frontlineScore(attackerTeam: TeamId, target: CombatTarget) {
    if (target.kind === "crystal") {
      return 99;
    }

    return attackerTeam === "player"
      ? BOARD_ROWS - target.state.position.row
      : target.state.position.row;
  }

  private backlineScore(attackerTeam: TeamId, target: CombatTarget) {
    if (target.kind === "crystal") {
      return -1;
    }

    return attackerTeam === "player"
      ? target.state.position.row
      : BOARD_ROWS - target.state.position.row;
  }

  private findNearestEnemyTarget(team: TeamId, origin: BoardPoint, range: number) {
    return this.enemyTargets(team)
      .filter((target) => this.distance(origin, target.state.position) <= range)
      .sort((a, b) => this.distance(origin, a.state.position) - this.distance(origin, b.state.position))[0];
  }

  private findMostWoundedFriendly(team: TeamId, origin?: BoardPoint, range?: number): CombatTarget | undefined {
    return this.friendlyTargets(team)
      .filter((target) => {
        if (!origin || range === undefined) {
          return true;
        }

        return this.distance(origin, target.state.position) <= range;
      })
      .filter((target) => target.state.hp < target.state.maxHp)
      .sort((a, b) => this.targetHpPercent(a) - this.targetHpPercent(b))[0];
  }

  private findMostThreatenedFriendly(team: TeamId, origin?: BoardPoint, range?: number): CombatTarget | undefined {
    return this.friendlyTargets(team)
      .filter((target) => {
        if (!origin || range === undefined) {
          return true;
        }

        return this.distance(origin, target.state.position) <= range;
      })
      .sort((a, b) => this.targetHpPercent(a) + a.state.barrier / 1000 - (this.targetHpPercent(b) + b.state.barrier / 1000))[0];
  }

  private findEnergizeTarget(unit: UnitState): UnitState | undefined {
    return this.units
      .filter(
        (ally) =>
          ally.team === unit.team &&
          ally.alive &&
          ally.uid !== unit.uid &&
          this.distance(unit.position, ally.position) <= unit.attackRange + 1
      )
      .sort((a, b) => {
        const aPressure = this.enemyTargets(unit.team).some(
          (target) => target.kind === "unit" && this.distance(target.state.position, a.position) <= 2
        )
          ? -1
          : 0;
        const bPressure = this.enemyTargets(unit.team).some(
          (target) => target.kind === "unit" && this.distance(target.state.position, b.position) <= 2
        )
          ? -1
          : 0;

        return aPressure - bPressure || b.cost - a.cost || a.nextAttackAt - b.nextAttackAt;
      })[0];
  }

  private enemyTargets(team: TeamId): CombatTarget[] {
    return this.friendlyTargets(this.enemyTeam(team));
  }

  private friendlyTargets(team: TeamId): CombatTarget[] {
    const unitTargets: CombatTarget[] = this.units
      .filter((unit) => unit.team === team && unit.alive)
      .map((unit) => ({
        kind: "unit",
        state: unit
      }));

    const crystal = this.targetForCrystal(team);
    return this.isTargetAlive(crystal) ? [...unitTargets, crystal] : unitTargets;
  }

  private targetForCrystal(team: TeamId): CombatTarget {
    return {
      kind: "crystal",
      state: this.crystals[team]
    };
  }

  private damageTarget(
    target: CombatTarget,
    baseDamage: number,
    sourceElement: UnitState["element"],
    sourceName: string
  ) {
    if (!this.isTargetAlive(target)) {
      return;
    }

    const armorReduction = Math.max(0, target.state.armor);
    const multiplier = this.elementMultiplier(sourceElement, target.state.element);
    let amount = Math.max(4, Math.round((baseDamage - armorReduction) * multiplier));

    if (target.state.barrier > 0) {
      const absorbed = Math.min(target.state.barrier, amount);
      target.state.barrier -= absorbed;
      amount -= absorbed;
    }

    if (amount <= 0) {
      return;
    }

    target.state.hp = Math.max(0, target.state.hp - amount);

    if (target.kind === "crystal") {
      this.pushEvent(`${sourceName}击中${TEAM_LABELS[target.state.team]}水晶 -${amount}`, "objective");
    } else if (amount >= baseDamage * 1.15) {
      this.pushEvent(`${sourceName}克制打击${target.state.shortName} -${amount}`, "hit");
    }

    if (target.state.hp <= 0) {
      this.resolveDeath(target);
    }
  }

  private healTarget(target: CombatTarget, amount: number, sourceName: string) {
    if (!this.isTargetAlive(target)) {
      return;
    }

    const before = target.state.hp;
    target.state.hp = Math.min(target.state.maxHp, target.state.hp + amount);
    const healed = target.state.hp - before;

    if (healed > 0) {
      this.pushEvent(`${sourceName}治疗${target.state.shortName} +${healed}`, "heal");
    }
  }

  private resolveDeath(target: CombatTarget) {
    if (target.kind === "crystal") {
      this.pushEvent(`${TEAM_LABELS[target.state.team]}水晶被摧毁`, "objective");
      return;
    }

    target.state.alive = false;
    this.pushEvent(`${TEAM_LABELS[target.state.team]}${target.state.shortName}退场`, "ko");

    const definition = QIBO_DEFINITIONS[target.state.definitionId];

    if (definition.deathEffect?.type === "burst") {
      const enemies = this.enemyTargets(target.state.team).filter(
        (candidate) =>
          this.isTargetAlive(candidate) &&
          this.distance(candidate.state.position, target.state.position) <= definition.deathEffect!.radius
      );

      for (const enemy of enemies) {
        this.damageTarget(
          enemy,
          definition.deathEffect.amount,
          target.state.element,
          `${target.state.shortName}亡语`
        );
      }
    }
  }

  private checkBattleEnd() {
    const playerCrystalDown = this.crystals.player.hp <= 0;
    const enemyCrystalDown = this.crystals.enemy.hp <= 0;

    if (playerCrystalDown || enemyCrystalDown) {
      let winner: TeamId | "draw" = "draw";

      if (playerCrystalDown !== enemyCrystalDown) {
        winner = playerCrystalDown ? "enemy" : "player";
      }

      this.finish("crystalDestroyed", winner);
      return;
    }

    if (this.time >= BATTLE_DURATION_SECONDS) {
      const playerScore = this.calculateScore("player");
      const enemyScore = this.calculateScore("enemy");
      let winner: TeamId | "draw" = "draw";

      if (playerScore.score !== enemyScore.score) {
        winner = playerScore.score > enemyScore.score ? "player" : "enemy";
      }

      this.finish("timeout", winner);
    }
  }

  private finish(reason: NonNullable<BattleResult["reason"]>, winner: TeamId | "draw") {
    this.result = {
      status: "finished",
      reason,
      winner,
      playerScore: this.calculateScore("player"),
      enemyScore: this.calculateScore("enemy")
    };
    this.pushEvent(this.resultText(winner, reason), "objective");
  }

  private resultText(winner: TeamId | "draw", reason: NonNullable<BattleResult["reason"]>) {
    if (winner === "draw") {
      return reason === "timeout" ? "60秒到时，双方评分相同" : "双方水晶同时破碎";
    }

    const label = winner === "player" ? "我方胜利" : "敌方胜利";
    return reason === "timeout" ? `${label}，60秒评分领先` : `${label}，率先摧毁水晶`;
  }

  private createResult(status: BattleStatus): BattleResult {
    return {
      status,
      playerScore: this.calculateScore("player"),
      enemyScore: this.calculateScore("enemy")
    };
  }

  private calculateScore(team: TeamId): BattleScore {
    const livingUnits = this.units.filter((unit) => unit.team === team && unit.alive);
    const livingHp = livingUnits.reduce((total, unit) => total + unit.hp, 0);
    const livingCost = livingUnits.reduce((total, unit) => total + unit.cost, 0);
    const crystalHpPercent = this.hpPercent(this.crystals[team]);
    const score = Math.round(crystalHpPercent * 1000 + livingHp * 0.8 + livingCost * 35);

    return {
      crystalHpPercent,
      livingHp,
      livingCost,
      score
    };
  }

  private livingCost(team: TeamId) {
    return this.units
      .filter((unit) => unit.team === team && unit.alive)
      .reduce((total, unit) => total + unit.cost, 0);
  }

  private attackDelayFor(unit: UnitState) {
    return unit.slowedUntil > this.time ? unit.attackDelay * 1.2 : unit.attackDelay;
  }

  private moveDelayFor(unit: UnitState) {
    return unit.slowedUntil > this.time ? unit.moveDelay * 1.7 : unit.moveDelay;
  }

  private elementMultiplier(attacker: UnitState["element"], defender: UnitState["element"]) {
    const strongAgainst: Partial<Record<UnitState["element"], UnitState["element"][]>> = {
      fire: ["wood", "ice"],
      water: ["fire"],
      wood: ["earth", "water"],
      earth: ["thunder"],
      ice: ["wind"],
      thunder: ["water"],
      wind: ["earth"],
      light: ["dark"],
      dark: ["light"]
    };

    const resistedBy: Partial<Record<UnitState["element"], UnitState["element"][]>> = {
      fire: ["water"],
      water: ["wood", "thunder"],
      wood: ["fire"],
      earth: ["wood", "wind"],
      ice: ["fire"],
      thunder: ["earth"],
      wind: ["ice"],
      light: ["dark"],
      dark: ["light"]
    };

    if (strongAgainst[attacker]?.includes(defender)) {
      return 1.18;
    }

    if (resistedBy[attacker]?.includes(defender)) {
      return 0.88;
    }

    return 1;
  }

  private targetHpPercent(target: CombatTarget) {
    return target.state.hp / target.state.maxHp;
  }

  private hpPercent(target: { hp: number; maxHp: number }) {
    return Math.max(0, Math.min(1, target.hp / target.maxHp));
  }

  private isTargetAlive(target: CombatTarget) {
    if (target.kind === "unit") {
      return target.state.alive && target.state.hp > 0;
    }

    return target.state.hp > 0;
  }

  private enemyTeam(team: TeamId): TeamId {
    return team === "player" ? "enemy" : "player";
  }

  private isInsideBoard(point: BoardPoint) {
    return point.col >= 0 && point.col < BOARD_COLUMNS && point.row >= 0 && point.row < BOARD_ROWS;
  }

  private isCellOpen(point: BoardPoint) {
    if (!this.isInsideBoard(point)) {
      return false;
    }

    const occupiedByUnit = this.units.some(
      (unit) => unit.alive && this.samePoint(unit.position, point)
    );
    const occupiedByCrystal =
      this.samePoint(this.crystals.player.position, point) ||
      this.samePoint(this.crystals.enemy.position, point);

    return !occupiedByUnit && !occupiedByCrystal;
  }

  private distance(a: BoardPoint, b: BoardPoint) {
    return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
  }

  private samePoint(a: BoardPoint, b: BoardPoint) {
    return a.col === b.col && a.row === b.row;
  }

  private pushEvent(text: string, tone: BattleEvent["tone"]) {
    this.events.push({
      id: this.nextEventId,
      time: this.time,
      text,
      tone
    });
    this.nextEventId += 1;
    this.events = this.events.slice(-32);
  }
}
