# 星原奇波战记

**Promilia Qibo Tactics**

《星原奇波战记》是一款基于“奇波对战”概念构建的快速自走棋原型。玩家在战斗前选择角色水晶、配置最多 6 只奇波并完成 6x2 预置布阵；战斗开始后，奇波会根据官方标签抽象出的行动模式自动移动、索敌、攻击、治疗、护盾、侵扰或进行领地压制。

项目英文名为 **Promilia Qibo Tactics**，npm 包名为 `promilia-qibo-tactics`。

## 当前玩法

- 15 费阵容上限，最多上阵 6 只奇波。
- 6x12 战场，上下各 2 排为预置区，中间 6x8 为自动交战区。
- 角色卡作为“水晶/基地”参战，可攻击或释放治疗、护盾、连锁压制等能力。
- 奇波费用按生长阶段设定：幼年期 1-2 费、成长期 3-4 费、成熟期 5-6 费、超限体预留为 6 费。
- 战斗模式按官方标签和技能印象映射：猛袭、协同、变换、缓冲、领地、侵扰。
- 目前接入 11 个奇波，使用 BWIKI 记录的官方名称、元素、标签、编号、阶段、体型、身高和头像。
- 9 种属性图标来自 BWIKI，属性颜色按图标主体色取样。

> 注意：BWIKI 当前奇波详情页中的生命、攻击、防御等战斗数值显示为 0，因此本原型只同步官方身份信息；战斗数值仍为自走棋原型自定义平衡。

## 技术栈

- Vite
- React
- TypeScript
- Phaser 3
- Electron

## 运行脚本

```bash
npm run dev
```

启动 Vite 渲染端，默认配置为 `http://127.0.0.1:5174`。

```bash
npm run electron:dev
```

启动 Vite、监听 Electron 主进程构建，并打开桌面应用。

```bash
npm run typecheck
```

运行 TypeScript 项目检查。

```bash
npm run build
```

执行类型检查、构建前端资源，并编译 Electron 主进程。

## 项目结构

```text
electron/
  main.ts                 Electron 主进程
  preload.ts              渲染进程安全桥
src/
  App.tsx                 React HUD、拖拽编队、战报面板
  game/
    assets/               本地资源 manifest
    createGame.ts         Phaser.Game 工厂
    scenes/               BootScene 与 GameScene
    simulation/           战斗数据、类型、规则与自动战斗引擎
public/
  assets/
    elements/             9 种属性图标
    qibo/                 当前 11 个奇波头像
```

## 资源说明

本地原型资源位于：

- `public/assets/qibo`
- `public/assets/elements`

奇波头像和属性图标下载自《蓝色星原：旅谣》BWIKI 页面，用于本地开发原型。正式发布或分发前，需要重新确认素材授权与最终游戏资料。

---

# Promilia Qibo Tactics

**Chinese title: 星原奇波战记**

Promilia Qibo Tactics is a fast auto-battler prototype inspired by Qibo battles. Before combat, the player chooses a character crystal, deploys up to 6 Qibo units, and arranges them on a 6x2 setup board. Once the battle starts, all units act automatically according to behavior profiles derived from official Qibo tags and skill flavor.

The npm package name is `promilia-qibo-tactics`.

## Current Gameplay

- 15-cost squad limit, with up to 6 deployed Qibo units.
- 6x12 battlefield, with 2 setup rows per side and a 6x8 active combat area.
- Character cards function as combat crystals/bases and can attack or cast support abilities.
- Qibo cost follows growth stage rules: Juvenile 1-2, Growth 3-4, Mature 5-6, and Overlimit reserved as 6.
- Combat behavior is mapped from official tags: Assault, Synergy, Shift, Buffer, Territory, and Harass.
- The prototype currently includes 11 Qibo units with official names, elements, tags, numbers, stages, body sizes, heights, and avatars from BWIKI.
- All 9 element icons are stored locally, with element colors sampled from those icons.

> Note: Current BWIKI detail pages show combat stats such as HP, Attack, and Defense as 0. This prototype therefore syncs official identity metadata only; battle stats remain custom prototype balance values.

## Tech Stack

- Vite
- React
- TypeScript
- Phaser 3
- Electron

## Scripts

```bash
npm run dev
```

Starts the Vite renderer, configured for `http://127.0.0.1:5174`.

```bash
npm run electron:dev
```

Starts Vite, watches the Electron main process build, and opens the desktop app.

```bash
npm run typecheck
```

Runs TypeScript project checks.

```bash
npm run build
```

Runs type checks, builds the renderer, and compiles the Electron main process.

## Structure

```text
electron/
  main.ts                 Electron main process
  preload.ts              Safe renderer bridge
src/
  App.tsx                 React HUD, drag-and-drop formation, battle log
  game/
    assets/               Local asset manifests
    createGame.ts         Phaser.Game factory
    scenes/               BootScene and GameScene
    simulation/           Battle data, types, rules, and auto-battle engine
public/
  assets/
    elements/             9 element icons
    qibo/                 11 current Qibo avatars
```

## Asset Notes

Local prototype assets live under:

- `public/assets/qibo`
- `public/assets/elements`

Qibo avatars and element icons were downloaded from the Azur Promilia BWIKI pages for local prototype development. Before public release or distribution, asset permission and final game data should be reviewed again.
