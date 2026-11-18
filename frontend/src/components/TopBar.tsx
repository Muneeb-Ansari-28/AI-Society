import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Save, Download, Sun, Clock, Users, Loader2 } from 'lucide-react';
import type { WorldState } from '../types/simulation';
import { EventBus } from '../game/EventBus';
import { api } from '../services/api';
import type { WSConnectionStatus } from '../services/websocket';

interface TopBarProps {
  worldState: WorldState;
  wsStatus: WSConnectionStatus;
  onSaveNotice: (message?: string) => void;
  onOpenSocial: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  worldState,
  wsStatus,
  onSaveNotice,
  onOpenSocial,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const togglePlay = () => {
    const nextRunning = !worldState.isRunning;
    EventBus.emit('toggle-simulation', nextRunning);
    if (nextRunning) {
      api.startSimulation().catch(() => {});
    } else {
      api.pauseSimulation().catch(() => {});
    }
  };

  const setSpeed = (speed: number) => {
    EventBus.emit('set-speed', speed);
    api.setSpeed(speed).catch(() => {});
  };

  const resetWorld = async () => {
    if (window.confirm('Reset village world to Day 1 Morning initial state?')) {
      try {
        await api.resetSimulation();
        EventBus.emit('reset-world');
        onSaveNotice('World reset to Day 1 Morning initial state.');
      } catch (err) {
        console.warn('Reset failed:', err);
      }
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await api.saveSimulation('quicksave');
      onSaveNotice(res.message || 'Snapshot quicksaved successfully!');
    } catch {
      onSaveNotice('Failed to save simulation snapshot.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async () => {
    if (isLoading) return;
    if (window.confirm('Load the most recent quicksave snapshot? Any unsaved progress will be replaced.')) {
      setIsLoading(true);
      try {
        const res = await api.loadSimulation('quicksave');
        onSaveNotice(res.message || 'Snapshot quicksave restored successfully!');
      } catch {
        onSaveNotice('No quicksave snapshot found to restore.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <header className="h-16 bg-gray-900/95 border-b border-gray-800 px-6 flex items-center justify-between backdrop-blur select-none">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏘️</span>
          <div>
            <h1 className="font-bold text-base text-gray-100 leading-tight">Tiny Society</h1>
            <p className="text-xs text-gray-400 font-mono">Autonomous AI Village</p>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-800 mx-2" />

        <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-full text-xs text-emerald-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>5 agents active</span>
        </div>

        {/* AI Backend Connection Badge */}
        {wsStatus === 'connected' ? (
          <div className="hidden md:flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/80 px-2.5 py-1 rounded-full text-xs text-emerald-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ollama: llama3.2 (Live)</span>
          </div>
        ) : wsStatus === 'connecting' ? (
          <div className="hidden md:flex items-center gap-1.5 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-full text-xs text-amber-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Connecting AI...</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 bg-gray-900 border border-gray-700 px-2.5 py-1 rounded-full text-xs text-gray-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span>Local Sim Standalone</span>
          </div>
        )}
      </div>

      {/* Middle: Controls */}
      <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800">
        <button
          onClick={togglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            worldState.isRunning
              ? 'bg-amber-600/90 hover:bg-amber-500 text-white shadow'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
          }`}
          title={worldState.isRunning ? 'Pause Simulation' : 'Resume Simulation'}
        >
          {worldState.isRunning ? <Pause size={14} /> : <Play size={14} />}
          <span>{worldState.isRunning ? 'Pause' : 'Resume'}</span>
        </button>

        <div className="flex items-center gap-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-xs">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setSpeed(spd)}
              className={`px-2 py-1 rounded transition-colors ${
                worldState.speed === spd
                  ? 'bg-gray-700 text-white font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-800 mx-1" />

        {/* Quick Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors disabled:opacity-50"
          title="Save Full Snapshot (Agents, Memories, World)"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin text-emerald-400" /> : <Save size={14} />}
          <span>Save</span>
        </button>

        {/* Quick Load */}
        <button
          onClick={handleLoad}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors disabled:opacity-50"
          title="Restore Quicksave Snapshot"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <Download size={14} />}
          <span>Load</span>
        </button>

        {/* Social Matrix Toggle */}
        <button
          onClick={onOpenSocial}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-950/70 border border-indigo-800/80 hover:bg-indigo-900 text-indigo-200 transition-colors"
          title="Open Village Social Network & Relationships"
        >
          <Users size={14} className="text-indigo-400" />
          <span>Relationships</span>
        </button>

        <button
          onClick={resetWorld}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          title="Reset Simulation to Day 1"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Right: Clock & Weather */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-950/80 px-3 py-1.5 rounded-xl border border-gray-800">
          <Clock size={15} className="text-amber-400" />
          <span className="font-mono font-bold text-sm text-gray-100">{worldState.timeString}</span>
          <span className="text-xs text-gray-400">Day {worldState.day}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-950/80 px-3 py-1.5 rounded-xl border border-gray-800 text-xs text-gray-300">
          <Sun size={15} className="text-yellow-400" />
          <span>{worldState.weather}</span>
          <span className="text-gray-500">•</span>
          <span className="text-emerald-400">{worldState.period}</span>
        </div>
      </div>
    </header>
  );
};
