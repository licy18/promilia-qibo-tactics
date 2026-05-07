import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { elementIconPath } from "./game/assets/elementManifest";
import { qiboAvatarPath } from "./game/assets/qiboManifest";
import { createGame } from "./game/createGame";
import {
  BATTLE_DURATION_SECONDS,
  CHARACTER_CARDS,
  ELEMENT_COLORS,
  ELEMENT_LABELS,
  MAX_DEPLOYED_UNITS,
  MAX_SQUAD_COST,
  QIBO_DEFINITIONS,
  SQUAD_PRESETS,
  getSquadCost
} from "./game/simulation/content";
import type { BattleUiSnapshot, ElementId, SquadPlacement, SquadPreset } from "./game/simulation/types";

const FORMATION_CELLS = 12;
const LANES = [0, 1, 2, 3, 4, 5];

const DEFAULT_BATTLE: BattleUiSnapshot = {
  time: 0,
  duration: BATTLE_DURATION_SECONDS,
  status: "ready",
  playerCrystalHpPercent: 1,
  enemyCrystalHpPercent: 1,
  playerLivingCost: MAX_SQUAD_COST,
  enemyLivingCost: MAX_SQUAD_COST,
  playerScore: 0,
  enemyScore: 0,
  recentEvents: []
};

type FormationCell = string | null;

type DragPayload =
  | {
      type: "pool";
      definitionId: string;
    }
  | {
      type: "board";
      index: number;
    };

const QIBO_OPTIONS = Object.values(QIBO_DEFINITIONS).sort(
  (a, b) => a.cost - b.cost || a.officialNo - b.officialNo
);
const CARD_OPTIONS = Object.values(CHARACTER_CARDS);

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement | null>(null);
  const [templateId, setTemplateId] = useState("balanced");
  const [enemySquadId, setEnemySquadId] = useState("swarm");
  const [cardId, setCardId] = useState("bastion");
  const [cardLane, setCardLane] = useState(2);
  const [formation, setFormation] = useState<FormationCell[]>(() => cellsFromPreset(SQUAD_PRESETS[1]));
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.25);
  const [paused, setPaused] = useState(false);
  const [battle, setBattle] = useState<BattleUiSnapshot>(DEFAULT_BATTLE);

  const playerSquad = useMemo(
    () => buildCustomSquad(formation, cardId, cardLane),
    [formation, cardId, cardLane]
  );
  const enemySquad = useMemo(
    () => SQUAD_PRESETS.find((squad) => squad.id === enemySquadId) ?? SQUAD_PRESETS[1],
    [enemySquadId]
  );
  const playerCost = getSquadCost(playerSquad);
  const playerCount = playerSquad.placements.length;
  const isFormationValid =
    playerCost <= MAX_SQUAD_COST && playerCount > 0 && playerCount <= MAX_DEPLOYED_UNITS;

  useEffect(() => {
    if (!gameContainerRef.current) {
      return;
    }

    const game = createGame(gameContainerRef.current);

    return () => {
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      setBattle((event as CustomEvent<BattleUiSnapshot>).detail);
    };

    window.addEventListener("qibattle:update", handleUpdate);

    return () => {
      window.removeEventListener("qibattle:update", handleUpdate);
    };
  }, []);

  const loadPreset = (id: string) => {
    const preset = SQUAD_PRESETS.find((squad) => squad.id === id) ?? SQUAD_PRESETS[0];

    setTemplateId(id);
    setCardId(preset.cardId);
    setCardLane(preset.cardLane);
    setFormation(cellsFromPreset(preset));
    setSelectedDefinitionId(null);
  };

  const startBattle = () => {
    if (!isFormationValid) {
      return;
    }

    setPaused(false);
    window.dispatchEvent(
      new CustomEvent("qibattle:command", {
        detail: {
          type: "start",
          playerSquadId: "custom",
          enemySquadId,
          playerSquad,
          speed
        }
      })
    );
  };

  const togglePause = () => {
    const nextPaused = !paused;
    setPaused(nextPaused);
    window.dispatchEvent(
      new CustomEvent("qibattle:command", {
        detail: {
          type: nextPaused ? "pause" : "resume"
        }
      })
    );
  };

  const skipBattle = () => {
    setPaused(false);
    window.dispatchEvent(
      new CustomEvent("qibattle:command", {
        detail: {
          type: "skip"
        }
      })
    );
  };

  const placeFromPool = (definitionId: string, index: number) => {
    setFormation((current) => {
      if (!current[index] && usedCells(current) >= MAX_DEPLOYED_UNITS) {
        return current;
      }

      return current.map((value, cellIndex) => (cellIndex === index ? definitionId : value));
    });
  };

  const swapBoardCells = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    setFormation((current) => {
      const next = [...current];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  };

  const removeCell = (index: number) => {
    setFormation((current) => current.map((value, cellIndex) => (cellIndex === index ? null : value)));
  };

  const handleCellDrop = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    const payload = readDragPayload(event);

    if (!payload) {
      return;
    }

    if (payload.type === "pool") {
      placeFromPool(payload.definitionId, index);
      return;
    }

    swapBoardCells(payload.index, index);
  };

  const handleBenchDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const payload = readDragPayload(event);

    if (payload?.type === "board") {
      removeCell(payload.index);
    }
  };

  const handleCellClick = (index: number) => {
    if (selectedDefinitionId) {
      placeFromPool(selectedDefinitionId, index);
      return;
    }

    if (formation[index]) {
      removeCell(index);
    }
  };

  return (
    <main className="app-shell">
      <section className="game-stage" aria-label="奇波自走棋战场">
        <div ref={gameContainerRef} className="phaser-container" />

        <aside className="control-panel" aria-label="战前编队">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Promilia Qibo Tactics</p>
              <h1>星原奇波战记</h1>
            </div>
            <span className={`battle-state ${battle.status}`}>{battleStateLabel(battle)}</span>
          </header>

          <div className="rule-strip">
            <span>{MAX_SQUAD_COST}费</span>
            <span>{MAX_DEPLOYED_UNITS}棋</span>
            <span>6x2布阵</span>
            <span>{BATTLE_DURATION_SECONDS}s</span>
          </div>

          <div className="selector-grid">
            <label>
              <span>载入模板</span>
              <select value={templateId} onChange={(event) => loadPreset(event.target.value)}>
                {SQUAD_PRESETS.map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>敌方阵容</span>
              <select value={enemySquadId} onChange={(event) => setEnemySquadId(event.target.value)}>
                {SQUAD_PRESETS.map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="crystal-lane" aria-label="水晶角色卡">
            <div className="crystal-card">
              <span className="crystal-gem">{CHARACTER_CARDS[cardId].shortName}</span>
              <label>
                <span>水晶角色卡</span>
                <select value={cardId} onChange={(event) => setCardId(event.target.value)}>
                  {CARD_OPTIONS.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="lane-buttons" aria-label="水晶分路">
              {LANES.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  className={cardLane === lane ? "selected" : ""}
                  onClick={() => setCardLane(lane)}
                >
                  {lane + 1}
                </button>
              ))}
            </div>
          </section>

          <div className="formation-header">
            <strong className={isFormationValid ? "valid" : "invalid"}>
              {playerCost} / {MAX_SQUAD_COST} 费
            </strong>
            <span>
              {playerCount} / {MAX_DEPLOYED_UNITS} 棋
            </span>
          </div>

          <FormationBoard
            formation={formation}
            selectedDefinitionId={selectedDefinitionId}
            onCellClick={handleCellClick}
            onCellDrop={handleCellDrop}
            onRemove={removeCell}
          />

          <section
            className="qibo-pool"
            aria-label="奇波卡池"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleBenchDrop}
          >
            <div className="pool-heading">
              <strong>奇波卡池</strong>
              <span>拖到上方格子，或点选后点格子</span>
            </div>
            <div className="qibo-card-grid">
              {QIBO_OPTIONS.map((unit) => (
                <QiboCard
                  key={unit.id}
                  definitionId={unit.id}
                  selected={selectedDefinitionId === unit.id}
                  onClick={() =>
                    setSelectedDefinitionId((current) => (current === unit.id ? null : unit.id))
                  }
                />
              ))}
            </div>
          </section>

          <label className="speed-control">
            <span>模拟速度</span>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.25"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
            <strong>{speed.toFixed(2)}x</strong>
          </label>

          <div className="command-row">
            <button type="button" onClick={startBattle} disabled={!isFormationValid}>
              开战
            </button>
            <button type="button" className="secondary" onClick={togglePause}>
              {paused ? "继续" : "暂停"}
            </button>
            <button type="button" className="secondary" onClick={skipBattle}>
              跳过
            </button>
          </div>
        </aside>

        <aside className="battle-panel" aria-label="战斗结算">
          <div className="meter-row player">
            <span>我方水晶</span>
            <Meter value={battle.playerCrystalHpPercent} />
            <strong>{Math.round(battle.playerCrystalHpPercent * 100)}%</strong>
          </div>
          <div className="meter-row enemy">
            <span>敌方水晶</span>
            <Meter value={battle.enemyCrystalHpPercent} />
            <strong>{Math.round(battle.enemyCrystalHpPercent * 100)}%</strong>
          </div>
          <div className="score-grid">
            <span>我方剩余费用 {battle.playerLivingCost}</span>
            <span>敌方剩余费用 {battle.enemyLivingCost}</span>
            <span>我方评分 {battle.playerScore}</span>
            <span>敌方评分 {battle.enemyScore}</span>
          </div>
          <ol className="event-log">
            {battle.recentEvents.map((event) => (
              <li key={event.id} className={event.tone}>
                <span>{event.time.toFixed(1)}s</span>
                {event.text}
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}

function FormationBoard({
  formation,
  selectedDefinitionId,
  onCellClick,
  onCellDrop,
  onRemove
}: {
  formation: FormationCell[];
  selectedDefinitionId: string | null;
  onCellClick: (index: number) => void;
  onCellDrop: (event: React.DragEvent, index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <section className="formation-board" aria-label="我方预置棋盘">
      <div className="board-lane-labels">
        {LANES.map((lane) => (
          <span key={lane}>{lane + 1}路</span>
        ))}
      </div>
      {[0, 1].map((rank) => (
        <div key={rank} className="formation-row">
          {LANES.map((lane) => {
            const index = rank * 6 + lane;
            const definitionId = formation[index];
            const unit = definitionId ? QIBO_DEFINITIONS[definitionId] : undefined;

            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                className={`formation-cell ${definitionId ? "occupied" : ""} ${
                  selectedDefinitionId ? "targetable" : ""
                }`}
                onClick={() => onCellClick(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onCellClick(index);
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onCellDrop(event, index)}
              >
                <span className="rank-tag">{rank === 0 ? "前" : "后"}</span>
                {unit ? (
                  <span
                    className="cell-qibo"
                    draggable
                    onDragStart={(event) => writeDragPayload(event, { type: "board", index })}
                    style={elementStyle(unit.element)}
                  >
                    <QiboAvatar definitionId={unit.id} />
                    <ElementIcon element={unit.element} />
                    <span>{unit.name}</span>
                    <small>{unit.cost}费</small>
                    <button
                      type="button"
                      className="remove-qibo"
                      aria-label={`移除${unit.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(index);
                      }}
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <span className="empty-cell">放置奇波</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function QiboCard({
  definitionId,
  selected,
  onClick
}: {
  definitionId: string;
  selected: boolean;
  onClick: () => void;
}) {
  const unit = QIBO_DEFINITIONS[definitionId];

  return (
    <button
      type="button"
      className={`qibo-card ${selected ? "selected" : ""}`}
      draggable
      onClick={onClick}
      onDragStart={(event) => writeDragPayload(event, { type: "pool", definitionId })}
      style={elementStyle(unit.element)}
    >
      <QiboAvatar definitionId={definitionId} />
      <span className="qibo-card-main">
        <strong>{unit.name}</strong>
        <small>
          <ElementIcon element={unit.element} />
          {unit.stage} · {unit.cost}费 · {unit.officialTag}
        </small>
        <em>
          NO.{unit.officialNo} · {unit.combatProfile}
        </em>
      </span>
      <span className="qibo-cost">{unit.cost}</span>
    </button>
  );
}

function QiboAvatar({ definitionId }: { definitionId: string }) {
  const unit = QIBO_DEFINITIONS[definitionId];

  return (
    <span className="qibo-avatar" style={elementStyle(unit.element)}>
      <img
        src={qiboAvatarPath(unit.avatarKey)}
        alt={unit.name}
        draggable={false}
        onError={(event) => {
          event.currentTarget.remove();
        }}
      />
      <span>{unit.shortName}</span>
    </span>
  );
}

function ElementIcon({ element }: { element: ElementId }) {
  return (
    <span className="element-icon" style={elementStyle(element)} title={ELEMENT_LABELS[element]}>
      <img
        src={elementIconPath(element)}
        alt={ELEMENT_LABELS[element]}
        draggable={false}
        onError={(event) => {
          event.currentTarget.remove();
        }}
      />
      <span>{ELEMENT_LABELS[element]}</span>
    </span>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <span className="meter">
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </span>
  );
}

function cellsFromPreset(preset: SquadPreset): FormationCell[] {
  const cells = Array<FormationCell>(FORMATION_CELLS).fill(null);

  for (const placement of preset.placements) {
    cells[placement.rank * 6 + placement.lane] = placement.definitionId;
  }

  return cells;
}

function buildCustomSquad(formation: FormationCell[], cardId: string, cardLane: number): SquadPreset {
  const placements: SquadPlacement[] = formation.flatMap((definitionId, index) => {
    if (!definitionId) {
      return [];
    }

    return {
      definitionId,
      lane: index % 6,
      rank: index >= 6 ? 1 : 0
    };
  });
  const costList = placements.map((placement) => QIBO_DEFINITIONS[placement.definitionId].cost);
  const cost = costList.reduce((total, value) => total + value, 0);
  const style = inferStyle(placements.length);

  return {
    id: "custom",
    name: "自定义编队",
    style,
    summary: `${formatCostList(costList)}，${formationSummary(placements.length, cost)}。`,
    cardId,
    cardLane,
    placements
  };
}

function inferStyle(count: number): SquadPreset["style"] {
  if (count <= 3) {
    return "重装流";
  }

  if (count >= 6) {
    return "铺场流";
  }

  return "均衡流";
}

function formatCostList(costs: number[]) {
  return costs.length > 0 ? `[${costs.join(",")}]` : "空阵";
}

function formationSummary(count: number, cost: number) {
  if (count === 0) {
    return "至少需要 1 只奇波";
  }

  if (cost > MAX_SQUAD_COST) {
    return "费用超限，无法开战";
  }

  if (count <= 3) {
    return "少量高质量单位，适合正面突破";
  }

  if (count >= 6) {
    return "多路线压迫，适合偷家和牵制";
  }

  return "攻守兼备，适合稳定试阵";
}

function battleStateLabel(battle: BattleUiSnapshot) {
  if (battle.status === "finished") {
    if (battle.winner === "draw") {
      return "平局";
    }

    return battle.winner === "player" ? "我方胜利" : "敌方胜利";
  }

  if (battle.status === "running") {
    return `${battle.time.toFixed(1)}s`;
  }

  return "待机";
}

function usedCells(formation: FormationCell[]) {
  return formation.filter(Boolean).length;
}

function elementStyle(element: ElementId): CSSProperties & { "--qibo-color": string } {
  return {
    "--qibo-color": `#${ELEMENT_COLORS[element].toString(16).padStart(6, "0")}`
  };
}

function writeDragPayload(event: React.DragEvent, payload: DragPayload) {
  event.dataTransfer.setData("application/qibattle", JSON.stringify(payload));
  event.dataTransfer.effectAllowed = payload.type === "pool" ? "copy" : "move";
}

function readDragPayload(event: React.DragEvent): DragPayload | undefined {
  const raw = event.dataTransfer.getData("application/qibattle");

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return undefined;
  }
}
