import Phaser from "phaser";
import { ELEMENT_ICON_ASSETS } from "../assets/elementManifest";
import { QIBO_AVATAR_ASSETS } from "../assets/qiboManifest";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    for (const asset of ELEMENT_ICON_ASSETS) {
      this.load.image(asset.key, asset.filePath);
    }

    for (const asset of QIBO_AVATAR_ASSETS) {
      this.load.image(asset.key, asset.filePath);
    }
  }

  create() {
    this.scene.start("GameScene");
  }
}
