# Official Content Expansion and Character Cards Plan

Deferred implementation / 以后另外实施

## Summary

This plan records the next official-content expansion for Promilia Qibo Tactics. It is intentionally saved as a future implementation plan only. This step does not add new Qibo units, change combat code, download assets, or rebalance gameplay.

The future work has two goals:

- Expand the playable Qibo roster from 11 to 25 units.
- Replace the current custom crystal cards with 5 official Azur Promilia character command cards.

Primary data sources:

- BWIKI Qibo list: https://wiki.biligame.com/ap/%E5%A5%87%E6%B3%A2%E4%B8%80%E8%A7%88
- BWIKI character archive: https://wiki.biligame.com/ap/%E8%A7%92%E8%89%B2%E5%9B%BE%E9%89%B4
- Official site: https://azurpromilia.manjuu.com/zh/home/

BWIKI content is based on test information and should be checked again against the final game before any public release.

## Scope

### In Scope

- Add 14 more official Qibo definitions so the playable roster reaches 25 units.
- Add the official `防护` tag and map it to a defensive combat mode.
- Add a ground-element defensive line: 岩甲蜥, 穿甲蜥, 钻山蜥.
- Replace the current custom character cards with official character command cards.
- Add local manifests and local image assets for new Qibo and character portraits.
- Update the formation UI, battle crystal display, battle log text, presets, README, and core gameplay design document.

### Out of Scope

- No full 85-unit Qibo encyclopedia in this stage.
- No gacha, progression, leveling, equipment, or deck-building system.
- No direct import of BWIKI HP, attack, or defense values while those detail-page values are 0.
- No attempt to exactly reproduce RPG skill multipliers, animation timing, energy systems, or hit counts.
- No implementation work is part of this saved-plan commit.

## Qibo Expansion

Keep the current 11 Qibo and add 14 more playable units:

| Unit | Official No. | Element | Tag | Stage | Avatar Key |
| --- | ---: | --- | --- | --- | --- |
| 水灵偶 | 17 | 水 | 缓冲 | 成长期 | `500003` |
| 汐灵偶 | 18 | 水 | 缓冲 | 成熟期 | `500004` |
| 火灵仔 | 19 | 火 | 领地 | 幼年期 | `500005` |
| 焰灵偶 | 21 | 火 | 领地 | 成熟期 | `500007` |
| 冰灵偶 | 23 | 冰 | 侵扰 | 成长期 | `500115` |
| 霜灵偶 | 24 | 冰 | 侵扰 | 成熟期 | `500116` |
| 风灵偶 | 26 | 风 | 领地 | 成长期 | `500127` |
| 岚灵偶 | 27 | 风 | 领地 | 成熟期 | `500128` |
| 木灵仔 | 28 | 木 | 协同 | 幼年期 | `500147` |
| 蔓灵偶 | 30 | 木 | 协同 | 成熟期 | `500149` |
| 电灵偶 | 33 | 雷 | 协同 | 成熟期 | `500175` |
| 岩甲蜥 | 93 | 地 | 防护 | 幼年期 | `500051` |
| 穿甲蜥 | 94 | 地 | 防护 | 成长期 | `500052` |
| 钻山蜥 | 95 | 地 | 防护 | 成熟期 | `500053` |

Fee rules stay stage-based:

- 幼年期: 1-2 cost.
- 成长期: 3-4 cost.
- 成熟期: 5-6 cost.
- 超限体: reserved as 6 cost.

Recommended combat mapping:

- 缓冲: healing, shielding, damage reduction, or low-HP protection.
- 领地: lane control, area pressure, interception, or zone pulse damage.
- 侵扰: ranged harassment, slow, interruption, or attack-tempo disruption.
- 协同: ally-following, attack-speed support, energy support, shielding, or combo pressure.
- 防护: frontline guarding, crystal protection, armor reduction resistance, knockback, or fortify pulse.

## Official Character Cards

Rename the current "水晶角色卡" concept to "角色指挥卡". A character command card remains an independent crystal/base token, does not count toward the 6-Qibo limit, and can still be assigned to a lane.

Initial official character set:

| Character | Rarity | Element | Profession | Faction | Species | Portrait Key |
| --- | ---: | --- | --- | --- | --- | --- |
| 末音 | 5 | 雷 | 猛攻 | 阿瓦利安 | 高等精灵族 | `109001` |
| 洛卿 | 5 | 水 | 赋予 | 辰王朝 | 龙人族 | `101006` |
| 璐璐卡 | 5 | 水 | 增幅 | 夏露露村 | 兽人族 | `108002` |
| 忒拉拉 | 4 | 火/风 | 爆发 | 夏露露村 | 兽人族 | `108001` |
| 阿比 | 5 | 水/木 | 破坏 | 洛斯兰瑟 | 龙人族 | `107003` |

Suggested auto-battler skill abstractions:

- 末音: `雷鸣追击`, chain thunder damage, good against spread-out low-HP targets.
- 洛卿: `雨帘结界`, water barrier plus small ally defense or attack support.
- 璐璐卡: `活力之灵`, heal the most wounded ally and add short damage reduction.
- 忒拉拉: `炽腾猎袭`, fire burst in an area with light frontline pressure.
- 阿比: `龙之咆哮`, water/wood suppression that reduces armor or delays enemy tempo.

## Implementation Notes

- Extend `CharacterCardDefinition` with `rarity`, `profession`, `faction`, `species`, `elements`, `portraitKey`, `sourceUrl`, `abilityName`, and `abilityFlavor`.
- Add `CharacterProfession` with `猛攻 | 爆发 | 增幅 | 赋予 | 破坏`.
- Add character portrait manifest and local assets under `public/assets/characters/`.
- Keep the battle engine boundary: characters are command crystals, not moving board units.
- Upgrade the character selector from a select dropdown into 5 visible official character cards.
- Update the battlefield crystal from a text gem into an avatar diamond with primary element color and team border.
- Use official character names and skill names in battle logs.
- Keep missing-image fallback behavior so no blank character or Qibo card appears.

## Preset Direction

- Defensive or heavy presets should prefer 洛卿 or 璐璐卡.
- Swarm or low-cost pressure presets should prefer 末音.
- Burst presets should prefer 忒拉拉.
- Armor-break or tempo-control presets should prefer 阿比.
- Every preset must remain at or below 15 cost and 6 deployed Qibo.

## Test Plan

- Run `npm.cmd run typecheck`.
- Run `npm.cmd run build`.
- Manual verification:
  - The Qibo pool displays 25 units.
  - The character command area displays 5 official characters.
  - Character portraits, elements, professions, skill names, and battle-log text match.
  - Multi-element characters display primary and secondary elements, while combat uses one primary element for balance.
  - Character command cards do not count toward the 6-Qibo limit.
  - All presets can start battle and stay within the 15-cost limit.
  - Missing portraits fall back to an element badge instead of a blank card or blank crystal.

## Assumptions

- The existing 2D React + Phaser structure remains the implementation target.
- Official identity information comes from BWIKI and the official site, but combat numbers remain custom prototype balance.
- This future work should be implemented in a separate development pass.
- Public distribution requires another review of asset permissions and final official game data.
