import type {
  CharacterCardDefinition,
  ElementId,
  SquadPreset,
  UnitDefinition
} from "./types";

export const BOARD_COLUMNS = 6;
export const BOARD_ROWS = 12;
export const ACTIVE_ROWS = 8;
export const MAX_SQUAD_COST = 15;
export const MAX_DEPLOYED_UNITS = 6;
export const BATTLE_DURATION_SECONDS = 60;

export const ELEMENT_LABELS: Record<ElementId, string> = {
  fire: "火",
  water: "水",
  wood: "木",
  earth: "地",
  ice: "冰",
  thunder: "雷",
  wind: "风",
  light: "光",
  dark: "暗"
};

export const ELEMENT_COLORS: Record<ElementId, number> = {
  fire: 0xfa8c92,
  water: 0x44c2e6,
  wood: 0x4fd5a8,
  earth: 0xebc242,
  ice: 0x3cd6d1,
  thunder: 0x8099f9,
  wind: 0xf9b274,
  light: 0xe3cf3d,
  dark: 0xb48ef5
};

const OFFICIAL_QIBO: Record<
  string,
  Pick<
    UnitDefinition,
    | "name"
    | "shortName"
    | "officialNo"
    | "officialTag"
    | "species"
    | "stage"
    | "bodySize"
    | "heightCm"
    | "avatarKey"
    | "element"
  >
> = {
  sproutRunner: {
    name: "小芽狐",
    shortName: "狐",
    officialNo: 1,
    officialTag: "猛袭",
    species: "异生类·兽形族",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 65,
    avatarKey: "500258",
    element: "wood"
  },
  sparkImp: {
    name: "雷灵仔",
    shortName: "雷",
    officialNo: 31,
    officialTag: "协同",
    species: "幻生类·元素族",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 35,
    avatarKey: "500173",
    element: "thunder"
  },
  stoneShell: {
    name: "河狸仔",
    shortName: "狸",
    officialNo: 7,
    officialTag: "变换",
    species: "异生类·兽形族",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 50,
    avatarKey: "500261",
    element: "water"
  },
  tideMedic: {
    name: "水灵仔",
    shortName: "水",
    officialNo: 16,
    officialTag: "缓冲",
    species: "幻生类·元素族",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 35,
    avatarKey: "500002",
    element: "water"
  },
  galeDiver: {
    name: "风灵仔",
    shortName: "风",
    officialNo: 25,
    officialTag: "领地",
    species: "幻生类·元素族",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 40,
    avatarKey: "500126",
    element: "wind"
  },
  frostCaller: {
    name: "冰灵仔",
    shortName: "冰",
    officialNo: 22,
    officialTag: "侵扰",
    species: "幻生类·元素族",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 40,
    avatarKey: "500114",
    element: "ice"
  },
  emberMortar: {
    name: "火灵偶",
    shortName: "火",
    officialNo: 20,
    officialTag: "领地",
    species: "幻生类·元素族",
    stage: "成长期",
    bodySize: "小",
    heightCm: 60,
    avatarKey: "500006",
    element: "fire"
  },
  vineWeaver: {
    name: "木灵偶",
    shortName: "木",
    officialNo: 29,
    officialTag: "协同",
    species: "幻生类·元素族",
    stage: "成长期",
    bodySize: "小",
    heightCm: 70,
    avatarKey: "500148",
    element: "wood"
  },
  thunderRhino: {
    name: "雷灵偶",
    shortName: "偶",
    officialNo: 32,
    officialTag: "协同",
    species: "幻生类·元素族",
    stage: "成长期",
    bodySize: "小",
    heightCm: 60,
    avatarKey: "500174",
    element: "thunder"
  },
  starBulwark: {
    name: "哈加",
    shortName: "哈",
    officialNo: 34,
    officialTag: "领地",
    species: "普生类",
    stage: "成熟期",
    bodySize: "中",
    heightCm: 150,
    avatarKey: "500120",
    element: "wind"
  },
  nightProwler: {
    name: "目绒兔",
    shortName: "兔",
    officialNo: 14,
    officialTag: "缓冲",
    species: "普生类",
    stage: "幼年期",
    bodySize: "小",
    heightCm: 43,
    avatarKey: "500093",
    element: "light"
  }
};

function qibo(
  id: keyof typeof OFFICIAL_QIBO,
  partial: Omit<
    UnitDefinition,
    | "id"
    | "name"
    | "shortName"
    | "officialNo"
    | "officialTag"
    | "species"
    | "stage"
    | "bodySize"
    | "heightCm"
    | "avatarKey"
    | "element"
  >
): UnitDefinition {
  const official = OFFICIAL_QIBO[id];

  return {
    id,
    ...official,
    ...partial,
    traits: [official.officialTag, official.stage, ...partial.traits]
  };
}

export const QIBO_DEFINITIONS: Record<string, UnitDefinition> = {
  sproutRunner: qibo("sproutRunner", {
    cost: 1,
    role: "猛袭突击",
    combatProfile: "猛袭突击",
    moveStyle: "advance",
    targetPriority: "lowestHp",
    stats: {
      hp: 112,
      attack: 18,
      armor: 2,
      attackRange: 1,
      attackDelay: 0.78,
      moveDelay: 0.42,
      windup: 0.18
    },
    traits: ["快速推进", "优先收割低血", "轻量突击"]
  }),
  sparkImp: qibo("sparkImp", {
    cost: 1,
    role: "协同游击",
    combatProfile: "协同连携",
    moveStyle: "supportFollow",
    targetPriority: "lowestHp",
    stats: {
      hp: 98,
      attack: 16,
      armor: 1,
      attackRange: 2,
      attackDelay: 1.05,
      moveDelay: 0.52,
      windup: 0.12
    },
    specialAction: "energize",
    traits: ["跟随友军", "连携加速", "低费协同"]
  }),
  stoneShell: qibo("stoneShell", {
    cost: 2,
    role: "变换护卫",
    combatProfile: "变换护卫",
    moveStyle: "guard",
    targetPriority: "frontline",
    stats: {
      hp: 265,
      attack: 24,
      armor: 10,
      attackRange: 1,
      attackDelay: 1.25,
      moveDelay: 0.7,
      windup: 0.55
    },
    traits: ["适应防守", "高护甲", "保护水晶"]
  }),
  tideMedic: qibo("tideMedic", {
    cost: 2,
    role: "缓冲治疗",
    combatProfile: "缓冲治疗",
    moveStyle: "supportFollow",
    targetPriority: "frontline",
    stats: {
      hp: 155,
      attack: 18,
      armor: 3,
      attackRange: 3,
      attackDelay: 1.6,
      moveDelay: 0.8,
      windup: 0.7
    },
    specialAction: "healer",
    traits: ["治疗最低血量友军", "跟随支援"]
  }),
  galeDiver: qibo("galeDiver", {
    cost: 2,
    role: "领地巡游",
    combatProfile: "领地巡游",
    moveStyle: "territory",
    targetPriority: "backline",
    stats: {
      hp: 185,
      attack: 30,
      armor: 3,
      attackRange: 1,
      attackDelay: 1.05,
      moveDelay: 0.48,
      windup: 0.3
    },
    traits: ["守分路", "轻飞行", "拦截后排"]
  }),
  frostCaller: qibo("frostCaller", {
    cost: 2,
    role: "侵扰控制",
    combatProfile: "侵扰控制",
    moveStyle: "artillery",
    targetPriority: "frontline",
    stats: {
      hp: 165,
      attack: 26,
      armor: 3,
      attackRange: 3,
      attackDelay: 1.5,
      moveDelay: 0.86,
      windup: 0.85
    },
    specialAction: "harassSlow",
    statusOnHit: "slow",
    traits: ["远程骚扰", "减速干扰", "削弱推进"]
  }),
  emberMortar: qibo("emberMortar", {
    cost: 4,
    role: "领地火力",
    combatProfile: "领地压制",
    moveStyle: "territory",
    targetPriority: "frontline",
    stats: {
      hp: 235,
      attack: 48,
      armor: 4,
      attackRange: 4,
      attackDelay: 1.75,
      moveDelay: 0.95,
      windup: 1.05
    },
    splashRadius: 1,
    deathEffect: {
      type: "burst",
      amount: 34,
      radius: 1
    },
    specialAction: "territoryPulse",
    traits: ["领地火力", "范围伤害", "亡语爆裂"]
  }),
  vineWeaver: qibo("vineWeaver", {
    cost: 3,
    role: "协同护盾",
    combatProfile: "协同护盾",
    moveStyle: "supportFollow",
    targetPriority: "nearest",
    stats: {
      hp: 210,
      attack: 26,
      armor: 4,
      attackRange: 3,
      attackDelay: 1.5,
      moveDelay: 0.82,
      windup: 0.8
    },
    specialAction: "barrier",
    traits: ["跟随友军", "周期护盾", "协同防护"]
  }),
  thunderRhino: qibo("thunderRhino", {
    cost: 4,
    role: "协同雷击",
    combatProfile: "协同雷击",
    moveStyle: "advance",
    targetPriority: "frontline",
    stats: {
      hp: 315,
      attack: 58,
      armor: 7,
      attackRange: 1,
      attackDelay: 1.12,
      moveDelay: 0.52,
      windup: 0.95
    },
    specialAction: "energize",
    traits: ["雷击连携", "中高移速", "协同输出"]
  }),
  starBulwark: qibo("starBulwark", {
    cost: 5,
    role: "领地重装",
    combatProfile: "领地重装",
    moveStyle: "territory",
    targetPriority: "frontline",
    stats: {
      hp: 500,
      attack: 54,
      armor: 13,
      attackRange: 1,
      attackDelay: 1.35,
      moveDelay: 0.9,
      windup: 0.7
    },
    specialAction: "territoryPulse",
    traits: ["高耐久", "控线", "领地拦截"]
  }),
  nightProwler: qibo("nightProwler", {
    cost: 2,
    role: "缓冲庇护",
    combatProfile: "缓冲庇护",
    moveStyle: "supportFollow",
    targetPriority: "lowestHp",
    stats: {
      hp: 170,
      attack: 22,
      armor: 4,
      attackRange: 2,
      attackDelay: 1.35,
      moveDelay: 0.58,
      windup: 0.5
    },
    specialAction: "barrier",
    traits: ["光属性庇护", "减伤支援", "跟随友军"]
  })
};

export const CHARACTER_CARDS: Record<string, CharacterCardDefinition> = {
  bastion: {
    id: "bastion",
    name: "碧潮壁垒",
    shortName: "壁",
    element: "water",
    maxHp: 1380,
    armor: 8,
    attackDamage: 36,
    attackRange: 3,
    attackDelay: 1.4,
    abilityInterval: 7,
    ability: {
      type: "shieldLowest",
      amount: 90
    },
    traits: ["高耐久", "主动火力", "低血护盾"]
  },
  songwarden: {
    id: "songwarden",
    name: "星谣守望",
    shortName: "谣",
    element: "light",
    maxHp: 1180,
    armor: 5,
    attackDamage: 26,
    attackRange: 3,
    attackDelay: 1.25,
    abilityInterval: 4.5,
    ability: {
      type: "healLowest",
      amount: 82
    },
    traits: ["持续治疗", "适合拉锯", "保护精英单位"]
  },
  stormspire: {
    id: "stormspire",
    name: "雷棱尖塔",
    shortName: "棱",
    element: "thunder",
    maxHp: 1030,
    armor: 4,
    attackDamage: 56,
    attackRange: 4,
    attackDelay: 1.65,
    abilityInterval: 6,
    ability: {
      type: "chain",
      amount: 38,
      jumps: 3
    },
    traits: ["低耐久", "强主动攻击", "清铺场"]
  }
};

export const SQUAD_PRESETS: SquadPreset[] = [
  {
    id: "heavy",
    name: "重装破阵",
    style: "重装流",
    summary: "[5,4,4,2] 哈加控线，双成长期输出压阵。",
    cardId: "songwarden",
    cardLane: 2,
    placements: [
      { definitionId: "starBulwark", lane: 2, rank: 0 },
      { definitionId: "emberMortar", lane: 1, rank: 1 },
      { definitionId: "thunderRhino", lane: 3, rank: 0 },
      { definitionId: "frostCaller", lane: 4, rank: 1 }
    ]
  },
  {
    id: "balanced",
    name: "均衡控场",
    style: "均衡流",
    summary: "[1,2,2,3,4,2] 官方标签混编，攻守支援齐全。",
    cardId: "bastion",
    cardLane: 2,
    placements: [
      { definitionId: "sproutRunner", lane: 0, rank: 0 },
      { definitionId: "stoneShell", lane: 2, rank: 0 },
      { definitionId: "frostCaller", lane: 1, rank: 1 },
      { definitionId: "vineWeaver", lane: 3, rank: 1 },
      { definitionId: "thunderRhino", lane: 4, rank: 0 },
      { definitionId: "nightProwler", lane: 5, rank: 1 }
    ]
  },
  {
    id: "swarm",
    name: "铺场偷家",
    style: "铺场流",
    summary: "[1,1,2,2,2,4] 幼年期多路牵制，火灵偶补范围火力。",
    cardId: "stormspire",
    cardLane: 3,
    placements: [
      { definitionId: "sproutRunner", lane: 0, rank: 0 },
      { definitionId: "sparkImp", lane: 1, rank: 0 },
      { definitionId: "tideMedic", lane: 2, rank: 1 },
      { definitionId: "galeDiver", lane: 3, rank: 0 },
      { definitionId: "frostCaller", lane: 4, rank: 1 },
      { definitionId: "thunderRhino", lane: 5, rank: 0 }
    ]
  }
];

export function getSquadCost(squad: SquadPreset) {
  return squad.placements.reduce(
    (total, placement) => total + QIBO_DEFINITIONS[placement.definitionId].cost,
    0
  );
}

export function getSquadById(id: string) {
  return SQUAD_PRESETS.find((squad) => squad.id === id) ?? SQUAD_PRESETS[0];
}
