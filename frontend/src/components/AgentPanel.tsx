import React, { useState } from 'react';
import type { AgentState } from '../types/simulation';
import { AGENT_PERSONALITIES } from '../game/personalities';
import { VILLAGE_LOCATIONS } from '../game/VillageLocations';
import { EventBus } from '../game/EventBus';
import { Heart, Zap, Crosshair, Send, MapPin, Package, X, Sparkles, Brain, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AgentPanelProps {
  agent: AgentState | null;
  onClose: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ agent, onClose }) => {
  const [chatInput, setChatInput] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  if (!agent) {
    return (
      <div className="w-84 bg-gray-900/95 border-l border-gray-800 p-5 flex flex-col justify-center items-center text-center text-gray-500">
        <span className="text-4xl mb-3">👥</span>
        <h3 className="font-semibold text-gray-300 text-sm mb-1">Select a Villager</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Click any character walking in the village or choose from the top bar to inspect their personality, goals, energy, and dialogue.
        </p>
      </div>
    );
  }

  const personality = AGENT_PERSONALITIES[agent.id];
  const currentLocationObj = VILLAGE_LOCATIONS[agent.currentLocation];

  const handleTriggerDecision = async () => {
    if (isDeciding) return;
    setIsDeciding(true);
    try {
      await api.triggerDecision(agent.id);
    } catch (err) {
      console.warn('Backend decision trigger failed (fallback to local):', err);
      // Trigger local speech as fallback
      EventBus.emit('agent-say', {
        agentId: agent.id,
        message: `${personality?.name}: I am considering what to do next today!`,
      });
    } finally {
      setIsDeciding(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setIsChatting(true);

    try {
      const res = await api.interactWithAgent(agent.id, userMsg);
      EventBus.emit('agent-say', {
        agentId: agent.id,
        message: res.response,
      });
    } catch {
      // Offline fallback
      EventBus.emit('agent-say', {
        agentId: agent.id,
        message: `Greetings! It's a fine day to work around ${currentLocationObj?.name || 'the village'}.`,
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleCommandMove = (locId: string) => {
    EventBus.emit('command-agent-move', {
      agentId: agent.id,
      locationId: locId,
    });
  };

  const handleFocusCamera = () => {
    EventBus.emit('focus-agent', agent.id);
  };

  return (
    <div className="w-84 bg-gray-900/95 border-l border-gray-800 flex flex-col h-full overflow-y-auto select-none">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-800/80 flex items-center justify-between"
        style={{ borderTop: `3px solid ${personality?.color || '#48bb78'}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shadow"
            style={{ backgroundColor: `${personality?.color || '#48bb78'}25` }}
          >
            {personality?.avatar || '👤'}
          </div>
          <div>
            <h2 className="font-bold text-gray-100 text-base leading-tight flex items-center gap-1.5">
              <span>{agent.name}</span>
            </h2>
            <p className="text-xs text-emerald-400 font-mono font-medium">
              {agent.occupation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleFocusCamera}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Focus camera on character"
          >
            <Crosshair size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Status Bars: Energy & Happiness */}
        <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800 space-y-2.5">
          <div>
            <div className="flex justify-between text-xs text-gray-300 font-medium mb-1">
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-amber-400" />
                <span>Energy</span>
              </span>
              <span className="font-mono text-gray-400">{agent.energy}%</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${agent.energy}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-300 font-medium mb-1">
              <span className="flex items-center gap-1">
                <Heart size={13} className="text-rose-400" />
                <span>Happiness</span>
              </span>
              <span className="font-mono text-gray-400">{agent.happiness}%</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${agent.happiness}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Activity & Location */}
        <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">📍</span>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Current Location
              </span>
              <span className="text-xs text-gray-200 font-medium">
                {currentLocationObj?.name || 'Village Paths'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 border-t border-gray-800/80">
            <span className="text-sm mt-0.5">⚡</span>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Current Action
              </span>
              <p className="text-xs text-emerald-300 font-medium">
                {agent.actionDetail || 'Observing surroundings'}
              </p>
            </div>
          </div>
        </div>

        {/* Trigger Llama 3.2 Decision Button */}
        <div>
          <button
            onClick={handleTriggerDecision}
            disabled={isDeciding}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            {isDeciding ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Llama 3.2 Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-300" />
                <span>Ask AI to Decide (Llama 3.2)</span>
              </>
            )}
          </button>
        </div>

        {/* Recent Memories */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Brain size={12} className="text-purple-400" />
            <span>Recent Memories</span>
          </h4>
          <div className="bg-gray-950/70 p-2.5 rounded-xl border border-gray-800 space-y-1.5 text-xs">
            {agent.recentMemories && agent.recentMemories.length > 0 ? (
              agent.recentMemories.slice(0, 3).map((mem, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-gray-300 text-[11px] leading-snug">
                  <span className="text-gray-500 mt-0.5">•</span>
                  <span>{mem}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 text-[11px] italic">Woke up ready for a new morning.</span>
            )}
          </div>
        </div>

        {/* Personality & Goals */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" />
            <span>Personality & Goal</span>
          </h4>
          <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800 space-y-2 text-xs">
            <div>
              <span className="text-gray-400 font-medium block mb-0.5">Traits:</span>
              <p className="text-gray-300 leading-relaxed">{personality?.personality}</p>
            </div>
            <div>
              <span className="text-gray-400 font-medium block mb-0.5">Active Goal:</span>
              <p className="text-emerald-300/90 leading-relaxed font-mono text-[11px]">
                {personality?.goals}
              </p>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div>
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
            <Package size={12} className="text-blue-400" />
            <span>Pockets & Resources</span>
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-950/70 p-2 rounded-lg border border-gray-800 text-center">
              <span className="text-xs block">🪙</span>
              <span className="text-xs font-bold text-gray-200">{agent.inventory?.coins ?? 15}</span>
              <span className="text-[10px] text-gray-500 block">Coins</span>
            </div>
            <div className="bg-gray-950/70 p-2 rounded-lg border border-gray-800 text-center">
              <span className="text-xs block">🌾</span>
              <span className="text-xs font-bold text-gray-200">{agent.inventory?.food ?? 3}</span>
              <span className="text-[10px] text-gray-500 block">Food</span>
            </div>
            <div className="bg-gray-950/70 p-2 rounded-lg border border-gray-800 text-center">
              <span className="text-xs block">🪵</span>
              <span className="text-xs font-bold text-gray-200">{agent.inventory?.wood ?? 1}</span>
              <span className="text-[10px] text-gray-500 block">Wood</span>
            </div>
          </div>
        </div>

        {/* Command Navigation */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} className="text-purple-400" />
            <span>Send to Location</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(VILLAGE_LOCATIONS).slice(0, 6).map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleCommandMove(loc.id)}
                className="px-2.5 py-1.5 text-[11px] bg-gray-950 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-800 truncate text-left transition-colors"
                title={loc.name}
              >
                {loc.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Chat / Observation */}
        <div className="pt-2 border-t border-gray-800">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Talk with {agent.name} (Llama 3.2)
          </h4>
          <form onSubmit={handleSendMessage} className="flex gap-1.5">
            <input
              type="text"
              value={chatInput}
              disabled={isChatting}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask ${agent.name} something...`}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isChatting || !chatInput.trim()}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
            >
              {isChatting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
