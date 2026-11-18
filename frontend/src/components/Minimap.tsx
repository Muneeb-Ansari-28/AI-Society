import React, { useState } from 'react';
import type { AgentState } from '../types/simulation';
import { AGENT_PERSONALITIES } from '../game/personalities';
import { EventBus } from '../game/EventBus';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';

interface MinimapProps {
  agents: AgentState[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

// World bounds in Phaser are 1280 x 1280
const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 1280;
const MAP_SIZE = 160; // Rendered size in pixels

const LANDMARKS = [
  { name: 'Farm', x: 260, y: 320, color: '#15803d', icon: '🌾' },
  { name: 'Plaza', x: 640, y: 640, color: '#0284c7', icon: '⛲' },
  { name: 'Shop', x: 880, y: 480, color: '#b45309', icon: '🪙' },
  { name: 'Bakery', x: 440, y: 760, color: '#c2410c', icon: '🍞' },
  { name: 'Clinic', x: 920, y: 840, color: '#047857', icon: '🌿' },
  { name: 'Workshop', x: 280, y: 920, color: '#4338ca', icon: '🪵' },
];

export const Minimap: React.FC<MinimapProps> = ({ agents, selectedAgentId, onSelectAgent }) => {
  const [collapsed, setCollapsed] = useState(false);

  const scaleX = (x: number) => Math.max(8, Math.min(MAP_SIZE - 8, (x / WORLD_WIDTH) * MAP_SIZE));
  const scaleY = (y: number) => Math.max(8, Math.min(MAP_SIZE - 8, (y / WORLD_HEIGHT) * MAP_SIZE));

  return (
    <div className="bg-gray-950/90 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow-xl select-none">
      {/* Header */}
      <div
        className="px-2.5 py-1.5 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Map size={12} className="text-emerald-400" />
          <span>Village Radar</span>
        </span>
        <button className="text-gray-400 hover:text-white">
          {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-2 flex flex-col items-center">
          {/* Radar Screen */}
          <div
            className="relative bg-emerald-950/30 rounded-lg border border-emerald-900/40 overflow-hidden shadow-inner"
            style={{ width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px` }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b15_1px,transparent_1px),linear-gradient(to_bottom,#064e3b15_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Landmarks */}
            {LANDMARKS.map((lm, idx) => (
              <div
                key={idx}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-60"
                style={{ left: `${scaleX(lm.x)}px`, top: `${scaleY(lm.y)}px` }}
              >
                <span className="text-[10px] leading-none">{lm.icon}</span>
                <span className="text-[7px] text-gray-400 font-mono scale-90 -mt-0.5">{lm.name}</span>
              </div>
            ))}

            {/* Live Villager Blips */}
            {agents.map((ag) => {
              const personality = AGENT_PERSONALITIES[ag.id];
              const isSelected = ag.id === selectedAgentId;
              const posX = scaleX(ag.x);
              const posY = scaleY(ag.y);

              return (
                <div
                  key={ag.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAgent(ag.id);
                    EventBus.emit('focus-agent', ag.id);
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 z-10 group ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-125'
                  }`}
                  style={{ left: `${posX}px`, top: `${posY}px` }}
                  title={`${ag.name} (${ag.currentAction})`}
                >
                  {/* Blip dot */}
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-md border ${
                      isSelected ? 'ring-2 ring-white border-transparent' : 'border-black/50'
                    }`}
                    style={{ backgroundColor: personality?.color || '#3b82f6' }}
                  >
                    <span className="text-white drop-shadow">{ag.name[0]}</span>
                  </div>

                  {/* Ping animation for selected */}
                  {isSelected && (
                    <span
                      className="absolute -inset-1 rounded-full animate-ping opacity-60 pointer-events-none"
                      style={{ backgroundColor: personality?.color || '#3b82f6' }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between w-full mt-2 text-[9px] text-gray-400 px-0.5">
            <span>5 Active Villagers</span>
            <span className="text-emerald-400 font-mono">Live Sync</span>
          </div>
        </div>
      )}
    </div>
  );
};
