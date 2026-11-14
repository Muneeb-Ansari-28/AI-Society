import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { VillageScene } from './scenes/VillageScene';

export function createGameConfig(containerId: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: containerId,
    width: 794,
    height: 630,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1a202c',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 794,
      height: 630,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, VillageScene],
  };
}
