import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config';

interface VillageGameProps {
  onGameReady?: (game: Phaser.Game) => void;
}

export const VillageGame: React.FC<VillageGameProps> = ({ onGameReady }) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;
    if (gameInstanceRef.current) return; // Prevent double init in dev mode

    const config = createGameConfig(gameContainerRef.current.id);
    const game = new Phaser.Game(config);
    gameInstanceRef.current = game;

    if (onGameReady) {
      onGameReady(game);
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, [onGameReady]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-950 overflow-hidden rounded-xl border border-gray-800 shadow-2xl">
      <div
        id="phaser-game-container"
        ref={gameContainerRef}
        className="w-full h-full flex items-center justify-center"
      />
      <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-gray-700/60 text-xs text-gray-300 pointer-events-none flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Drag to pan · Scroll to zoom · Click villager or landmark</span>
      </div>
    </div>
  );
};
