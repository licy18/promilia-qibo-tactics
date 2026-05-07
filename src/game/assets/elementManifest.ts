import type { ElementId } from "../simulation/types";

export interface ElementIconAsset {
  key: string;
  element: ElementId;
  filePath: string;
  sourceName: string;
}

export const ELEMENT_ICON_ASSETS: ElementIconAsset[] = [
  "fire",
  "wind",
  "earth",
  "wood",
  "ice",
  "water",
  "thunder",
  "light",
  "dark"
].map((element) => ({
  key: `element-${element}`,
  element: element as ElementId,
  filePath: `/assets/elements/${element}.png`,
  sourceName: `BWIKI ${element} element icon`
}));

export function elementIconPath(element: ElementId) {
  return `/assets/elements/${element}.png`;
}

export function elementIconKey(element: ElementId) {
  return `element-${element}`;
}
