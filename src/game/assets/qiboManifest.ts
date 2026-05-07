import { QIBO_DEFINITIONS } from "../simulation/content";

export interface QiboAvatarAsset {
  key: string;
  filePath: string;
  sourceName: string;
  sourceUrl: string;
}

export const QIBO_AVATAR_ASSETS: QiboAvatarAsset[] = Object.values(QIBO_DEFINITIONS).map(
  (unit) => ({
    key: unit.avatarKey,
    filePath: `/assets/qibo/${unit.avatarKey}.png`,
    sourceName: `${unit.name} BWIKI 头像`,
    sourceUrl: `https://wiki.biligame.com/ap/${encodeURIComponent(unit.name)}`
  })
);

export function qiboAvatarPath(avatarKey: string) {
  return `/assets/qibo/${avatarKey}.png`;
}
