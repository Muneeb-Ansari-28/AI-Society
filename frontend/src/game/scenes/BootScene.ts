import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Show a loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading Tiny Society...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#48bb78',
    });
    loadingText.setOrigin(0.5, 0.5);

    // Preload village map
    this.load.image('village_map', '/assets/environment/village_map.png');

    // Preload 5 character spritesheets (3 cols x 4 rows = 12 frames, 48x64 each)
    const characters = ['alex', 'mia', 'noah', 'emma', 'leo'];
    for (const charId of characters) {
      this.load.spritesheet(`char_${charId}`, `/assets/characters/${charId}.png`, {
        frameWidth: 48,
        frameHeight: 64,
      });
    }
  }

  create() {
    const characters = ['alex', 'mia', 'noah', 'emma', 'leo'];

    for (const charId of characters) {
      // Row 0: Down (frames 0, 1, 2)
      this.anims.create({
        key: `walk_${charId}_down`,
        frames: this.anims.generateFrameNumbers(`char_${charId}`, { start: 0, end: 2 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `idle_${charId}_down`,
        frames: [{ key: `char_${charId}`, frame: 1 }],
        frameRate: 1,
      });

      // Row 1: Left (frames 3, 4, 5)
      this.anims.create({
        key: `walk_${charId}_left`,
        frames: this.anims.generateFrameNumbers(`char_${charId}`, { start: 3, end: 5 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `idle_${charId}_left`,
        frames: [{ key: `char_${charId}`, frame: 4 }],
        frameRate: 1,
      });

      // Row 2: Right (frames 6, 7, 8)
      this.anims.create({
        key: `walk_${charId}_right`,
        frames: this.anims.generateFrameNumbers(`char_${charId}`, { start: 6, end: 8 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `idle_${charId}_right`,
        frames: [{ key: `char_${charId}`, frame: 7 }],
        frameRate: 1,
      });

      // Row 3: Up (frames 9, 10, 11)
      this.anims.create({
        key: `walk_${charId}_up`,
        frames: this.anims.generateFrameNumbers(`char_${charId}`, { start: 9, end: 11 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `idle_${charId}_up`,
        frames: [{ key: `char_${charId}`, frame: 10 }],
        frameRate: 1,
      });
    }

    // Launch main village simulation scene
    this.scene.start('VillageScene');
  }
}
