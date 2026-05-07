export type TeamId = "player" | "enemy";

export type ElementId =
  | "fire"
  | "water"
  | "wood"
  | "earth"
  | "ice"
  | "thunder"
  | "wind"
  | "light"
  | "dark";

export type TargetPriority =
  | "nearest"
  | "crystal"
  | "frontline"
  | "backline"
  | "lowestHp";

export type MoveStyle =
  | "advance"
  | "flank"
  | "guard"
  | "artillery"
  | "flying"
  | "territory"
  | "supportFollow";

export type SpecialAction =
  | "healer"
  | "barrier"
  | "energize"
  | "territoryPulse"
  | "harassSlow";

export type OfficialStage = "幼年期" | "成长期" | "成熟期" | "超限体";

export type OfficialTag = "猛袭" | "协同" | "变换" | "缓冲" | "领地" | "侵扰";

export interface BoardPoint {
  col: number;
  row: number;
}

export interface UnitStats {
  hp: number;
  attack: number;
  armor: number;
  attackRange: number;
  attackDelay: number;
  moveDelay: number;
  windup: number;
}

export interface UnitDefinition {
  id: string;
  name: string;
  shortName: string;
  officialNo: number;
  officialTag: OfficialTag;
  species: string;
  stage: OfficialStage;
  bodySize: string;
  heightCm: number;
  avatarKey: string;
  cost: number;
  element: ElementId;
  role: string;
  combatProfile: string;
  moveStyle: MoveStyle;
  targetPriority: TargetPriority;
  stats: UnitStats;
  splashRadius?: number;
  statusOnHit?: "slow";
  deathEffect?: {
    type: "burst";
    amount: number;
    radius: number;
  };
  specialAction?: SpecialAction;
  traits: string[];
}

export interface CharacterCardDefinition {
  id: string;
  name: string;
  shortName: string;
  element: ElementId;
  maxHp: number;
  armor: number;
  attackDamage: number;
  attackRange: number;
  attackDelay: number;
  abilityInterval: number;
  ability:
    | {
        type: "healLowest";
        amount: number;
      }
    | {
        type: "shieldLowest";
        amount: number;
      }
    | {
        type: "chain";
        amount: number;
        jumps: number;
      };
  traits: string[];
}

export interface SquadPlacement {
  definitionId: string;
  lane: number;
  rank: 0 | 1;
}

export interface SquadPreset {
  id: string;
  name: string;
  style: "重装流" | "均衡流" | "铺场流";
  summary: string;
  cardId: string;
  cardLane: number;
  placements: SquadPlacement[];
}

export interface UnitState {
  uid: string;
  definitionId: string;
  name: string;
  shortName: string;
  officialNo: number;
  officialTag: OfficialTag;
  avatarKey: string;
  cost: number;
  team: TeamId;
  element: ElementId;
  role: string;
  combatProfile: string;
  moveStyle: MoveStyle;
  targetPriority: TargetPriority;
  hp: number;
  maxHp: number;
  armor: number;
  attack: number;
  attackRange: number;
  attackDelay: number;
  moveDelay: number;
  barrier: number;
  position: BoardPoint;
  alive: boolean;
  nextAttackAt: number;
  nextMoveAt: number;
  slowedUntil: number;
}

export interface CrystalState {
  team: TeamId;
  cardId: string;
  name: string;
  shortName: string;
  element: ElementId;
  hp: number;
  maxHp: number;
  armor: number;
  barrier: number;
  position: BoardPoint;
  nextAttackAt: number;
  nextAbilityAt: number;
}

export interface BattleEvent {
  id: number;
  time: number;
  text: string;
  tone: "info" | "hit" | "heal" | "ko" | "objective";
}

export type BattleStatus = "ready" | "running" | "finished";

export interface BattleScore {
  crystalHpPercent: number;
  livingHp: number;
  livingCost: number;
  score: number;
}

export interface BattleResult {
  status: BattleStatus;
  winner?: TeamId | "draw";
  reason?: "crystalDestroyed" | "timeout" | "manual";
  playerScore: BattleScore;
  enemyScore: BattleScore;
}

export interface BattleSnapshot {
  time: number;
  duration: number;
  status: BattleStatus;
  winner?: TeamId | "draw";
  result: BattleResult;
  units: UnitState[];
  crystals: Record<TeamId, CrystalState>;
  recentEvents: BattleEvent[];
}

export interface BattleUiSnapshot {
  time: number;
  duration: number;
  status: BattleStatus;
  winner?: TeamId | "draw";
  reason?: BattleResult["reason"];
  playerCrystalHpPercent: number;
  enemyCrystalHpPercent: number;
  playerLivingCost: number;
  enemyLivingCost: number;
  playerScore: number;
  enemyScore: number;
  recentEvents: BattleEvent[];
}
