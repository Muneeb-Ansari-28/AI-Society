import React from 'react';
import type { AgentState } from '../types/simulation';
import { AGENT_PERSONALITIES } from '../game/personalities';
import { EventBus } from '../game/EventBus';

interface VillagersBarProps {
  agents: AgentState[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

export const VillagersBar: React.FC<VillagersBarProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
}) => {
  const getActionEmoji = (action: string, id: string): string => {
    switch (action) {
      case 'work':
        if (id === 'alex') return '🌾';
        if (id === 'mia') return '🥖';
        if (id === 'noah') return '🛒';
        if (id === 'emma') return '🌿';
        if (id === 'leo') return '🔨';
        return '💼';
      case 'talk':
        return '💬';
      case 'trade':
        return '⚖️';
      case 'help':
        return '🤝';
      case 'rest':
        return '💤';
      case 'move':
        return '🚶';
      default:
        return '👀';
    }
  };

  return (
    <div className="bg-gray-900/90 border-b border-gray-800 px-6 py-2 flex items-center gap-3 overflow-x-auto select-none">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-2">
        Villagers
      </span>

      <div className="flex items-center gap-2">
        {Object.values(AGENT_PERSONALITIES).map((p) => {
          const liveState = agents.find((a) => a.id === p.id);
          const isSelected = selectedAgentId === p.id;
          const action = liveState?.currentAction || 'idle';
          const actionIcon = getActionEmoji(action, p.id);

          return (
            <button
              key={p.id}
              onClick={() => {
                onSelectAgent(p.id);
                EventBus.emit('select-agent', p.id);
              }}
              style={{
                borderColor: isSelected ? p.color : undefined,
                boxShadow: isSelected ? `0 0 12px ${p.color}40` : undefined,
              }}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'bg-gray-800 text-white font-medium scale-105'
                  : 'bg-gray-950/80 hover:bg-gray-800/80 border-gray-800 text-gray-300'
              }`}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold shadow-inner"
                style={{ backgroundColor: `${p.color}25`, color: p.color }}
              >
                {p.avatar}
              </div>

              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-bold text-gray-100">{p.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">({p.occupation})</span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <span>{actionIcon}</span>
                  <span className="truncate max-w-[90px] capitalize">
                    {action === 'work' ? liveState?.actionDetail.split(' ')[0] || 'working' : action}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
