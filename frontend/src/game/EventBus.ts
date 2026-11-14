import Phaser from 'phaser';

// Global EventBus instance for bidirectional communication between Phaser and React
export const EventBus = new Phaser.Events.EventEmitter();
