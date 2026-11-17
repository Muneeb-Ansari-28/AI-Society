import React, { useState, useEffect } from 'react';
import type { AgentState, RelationshipInfo, MemoryItem, PromiseItem } from '../types/simulation';
import { AGENT_PERSONALITIES } from '../game/personalities';
import { VILLAGE_LOCATIONS } from '../game/VillageLocations';
import { EventBus } from '../game/EventBus';
import { Heart, Zap, Crosshair, Send, MapPin, Package, X, Sparkles, Brain, Loader2, Users, MessageSquareQuote, Shield, Search, CheckCircle2, Clock, Handshake, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface AgentPanelProps {
  agent: AgentState | null;
  onClose: () => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ agent, onClose }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'social' | 'memory'>('status');
  const [chatInput, setChatInput] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [conversingWith, setConversingWith] = useState<string | null>(null);

  // Phase 4 Memory Architecture state
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [detailedMemories, setDetailedMemories] = useState<MemoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<MemoryItem[] | null>(null);
  const [promises, setPromises] = useState<PromiseItem[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const agentId = agent?.id;

  useEffect(() => {
    if (!agentId) return;
    const fetchMemoryData = async () => {
      setIsLoadingMemories(true);
      try {
        const [mems, prom] = await Promise.all([
          api.getAgentMemories(agentId, 25),
          api.getAgentPromises(agentId),
        ]);
        setDetailedMemories(mems);
        setPromises(prom);
      } catch (err) {
        console.warn('Failed to fetch memory data:', err);
      } finally {
        setIsLoadingMemories(false);
      }
    };
    if (activeTab === 'memory') {
      fetchMemoryData();
    }
  }, [agentId, activeTab]);

  if (!agent) {
    return (
      <div className="w-84 bg-gray-900/95 border-l border-gray-800 p-5 flex flex-col justify-center items-center text-center text-gray-500">
        <span className="text-4xl mb-3">👥</span>
        <h3 className="font-semibold text-gray-300 text-sm mb-1">Select a Villager</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Click any character walking in the village or choose from the top bar to inspect their personality, goals, relationships, and dynamic dialogue.
        </p>
      </div>
    );
  }

  const personality = AGENT_PERSONALITIES[agent.id];
  const currentLocationObj = VILLAGE_LOCATIONS[agent.currentLocation];

  // Emotion/Mood badge calculation
  const getEmotionBadge = (happiness: number) => {
    if (happiness >= 80) return { emoji: '🤩', label: 'Cheerful', color: 'text-amber-300 bg-amber-950/60 border-amber-800/80' };
    if (happiness >= 65) return { emoji: '😊', label: 'Content', color: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/80' };
    if (happiness >= 45) return { emoji: '😐', label: 'Neutral', color: 'text-blue-300 bg-blue-950/60 border-blue-800/80' };
    return { emoji: '🥱', label: 'Weary', color: 'text-rose-300 bg-rose-950/60 border-rose-800/80' };
  };

  const emotion = getEmotionBadge(agent.happiness);

  const handleTriggerDecision = async () => {
    if (isDeciding) return;
    setIsDeciding(true);
    try {
      await api.triggerDecision(agent.id);
    } catch (err) {
      console.warn('Backend decision trigger failed:', err);
      EventBus.emit('agent-say', {
        agentId: agent.id,
        message: `${personality?.name}: Thinking over what needs to be done today!`,
      });
    } finally {
      setIsDeciding(false);
    }
  };

  const handleTriggerConversation = async (targetId: string) => {
    if (conversingWith) return;
    setConversingWith(targetId);
    try {
      await api.triggerConversation(agent.id, targetId);
    } catch (err) {
      console.warn('Conversation trigger failed:', err);
    } finally {
      setConversingWith(null);
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

  const handleMemorySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memorySearchQuery.trim() || !agent) return;
    setIsSearching(true);
    try {
      const results = await api.searchAgentMemories(agent.id, memorySearchQuery.trim(), 5);
      setSearchResults(results);
    } catch (err) {
      console.warn('Memory search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setMemorySearchQuery('');
    setSearchResults(null);
  };

  const handleFulfillPromise = async (promiseId: number) => {
    try {
      await api.fulfillPromise(promiseId);
      setPromises((prev) =>
        prev.map((p) => (p.id === promiseId ? { ...p, status: 'fulfilled' as const } : p))
      );
    } catch (err) {
      console.warn('Failed to fulfill promise:', err);
    }
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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-emerald-400 font-mono font-medium">
                {agent.occupation}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${emotion.color} flex items-center gap-1 font-medium`}>
                <span>{emotion.emoji}</span>
                <span>{emotion.label}</span>
              </span>
            </div>
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

      {/* Tabs: Status vs Social vs Mind */}
      <div className="flex border-b border-gray-800 text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'status'
              ? 'border-emerald-500 text-emerald-400 bg-gray-950/40'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>📋</span>
          <span>Status</span>
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'social'
              ? 'border-emerald-500 text-emerald-400 bg-gray-950/40'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users size={12} />
          <span>Social</span>
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'memory'
              ? 'border-emerald-500 text-emerald-400 bg-gray-950/40'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Brain size={12} className="text-purple-400" />
          <span>Mind & Memory</span>
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {activeTab === 'status' ? (
          <>
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
                    <span>Llama 3.2 Deciding...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-300" />
                    <span>Prompt AI Decision (Llama 3.2)</span>
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
          </>
        ) : activeTab === 'social' ? (
          <div className="space-y-3">
            {/* SOCIAL TIES & RELATIONSHIPS TAB */}
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Users size={13} className="text-emerald-400" />
                <span>Relationships with Villagers</span>
              </h4>
              <span className="text-[10px] text-gray-500">Scale: 0-100</span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(AGENT_PERSONALITIES)
                .filter(([otherId]) => otherId !== agent.id)
                .map(([otherId, otherProfile]) => {
                  const rel: RelationshipInfo = agent.relationships?.[otherId] || {
                    name: otherProfile.name,
                    occupation: otherProfile.occupation,
                    trust: 50,
                    friendship: 50,
                  };
                  const isBusy = conversingWith === otherId;

                  return (
                    <div
                      key={otherId}
                      className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 space-y-2 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{otherProfile.avatar}</span>
                          <div>
                            <span className="text-xs font-bold text-gray-200">{otherProfile.name}</span>
                            <span className="text-[10px] text-gray-400 block font-mono">
                              {otherProfile.occupation}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerConversation(otherId)}
                          disabled={Boolean(conversingWith)}
                          className="flex items-center gap-1 px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50"
                          title={`Trigger AI conversation between ${agent.name} and ${otherProfile.name}`}
                        >
                          {isBusy ? (
                            <>
                              <Loader2 size={10} className="animate-spin" />
                              <span>Talking...</span>
                            </>
                          ) : (
                            <>
                              <MessageSquareQuote size={10} />
                              <span>Talk AI</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Trust & Friendship Bars */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <div className="flex justify-between text-gray-400 mb-0.5">
                            <span className="flex items-center gap-0.5">
                              <Shield size={10} className="text-blue-400" />
                              <span>Trust</span>
                            </span>
                            <span className="font-mono text-gray-300">{rel.trust}%</span>
                          </div>
                          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${rel.trust}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-gray-400 mb-0.5">
                            <span className="flex items-center gap-0.5">
                              <Heart size={10} className="text-rose-400" />
                              <span>Friendship</span>
                            </span>
                            <span className="font-mono text-gray-300">{rel.friendship}%</span>
                          </div>
                          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${rel.friendship}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {rel.last_interaction && (
                        <p className="text-[10px] text-gray-400 italic bg-gray-900/60 p-1.5 rounded border border-gray-800/60 leading-tight">
                          &ldquo;{rel.last_interaction}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* MIND & MEMORY TAB (PHASE 4 ARCHITECTURE) */
          <div className="space-y-3 text-xs">
            {/* Semantic Memory Search (ChromaDB) */}
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Search size={12} />
                  <span>Semantic Vector Search</span>
                </span>
                <span className="text-[9px] text-gray-500 font-mono">ChromaDB + nomic</span>
              </div>
              <form onSubmit={handleMemorySearch} className="flex gap-1.5">
                <input
                  type="text"
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  placeholder="Query memories (e.g. bread, tools, deal)..."
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={isSearching || !memorySearchQuery.trim()}
                  className="px-2 py-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                </button>
                {searchResults && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-1.5 py-1 text-gray-400 hover:text-white text-xs bg-gray-800 rounded-lg"
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </form>

              {/* Search Results Display */}
              {searchResults && (
                <div className="space-y-1.5 pt-1 border-t border-gray-800/80">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Semantic Hits ({searchResults.length})</span>
                    <span className="text-purple-400">Ranked by Vector Distance</span>
                  </div>
                  {searchResults.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic py-1">No semantically similar memories found.</p>
                  ) : (
                    searchResults.map((hit, idx) => (
                      <div key={idx} className="bg-gray-900/90 p-2 rounded-lg border border-purple-900/50 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-purple-300 font-medium">
                            {hit.similarity ? `${Math.round(hit.similarity * 100)}% Match` : 'Relevant'}
                          </span>
                          <span className="text-amber-400 font-mono">⭐ {hit.importance}</span>
                        </div>
                        <p className="text-gray-200 text-[11px] leading-snug">{hit.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Active Promises & Commitments */}
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Handshake size={12} />
                  <span>Promises & Commitments</span>
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {promises.filter((p) => p.status === 'active').length} Active
                </span>
              </div>

              {promises.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic py-1">No active promises or debts currently recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {promises.map((p) => {
                    const isPromiser = p.agent_id === agent.id;
                    const otherId = isPromiser ? p.target_agent_id : p.agent_id;
                    const otherProf = AGENT_PERSONALITIES[otherId];

                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded-lg border text-[11px] space-y-1 ${
                          p.status === 'fulfilled'
                            ? 'bg-emerald-950/20 border-emerald-900/40 text-gray-400'
                            : 'bg-gray-900/90 border-gray-800 text-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-gray-300 flex items-center gap-1">
                            <span>{otherProf?.avatar || '👤'}</span>
                            <span>{isPromiser ? `Promised ${otherProf?.name || otherId}` : `${otherProf?.name || otherId} promised`}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[9px]">
                            <Clock size={10} className="text-gray-500" />
                            <span>Due Day {p.deadline_day}</span>
                          </span>
                        </div>
                        <p className="text-emerald-200/90 leading-snug">&ldquo;{p.content}&rdquo;</p>
                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              p.status === 'fulfilled'
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                                : 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                            }`}
                          >
                            {p.status === 'fulfilled' ? '✓ Fulfilled' : '⏳ Active'}
                          </span>
                          {p.status === 'active' && isPromiser && (
                            <button
                              onClick={() => handleFulfillPromise(p.id)}
                              className="text-[9px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60"
                            >
                              <CheckCircle2 size={10} />
                              <span>Fulfill</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Memories Log (Short & Long Term) */}
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Brain size={12} className="text-purple-400" />
                  <span>Memory Log (Short & Long-Term)</span>
                </span>
                <button
                  onClick={async () => {
                    setIsLoadingMemories(true);
                    try {
                      const mems = await api.getAgentMemories(agent.id, 25);
                      setDetailedMemories(mems);
                    } finally {
                      setIsLoadingMemories(false);
                    }
                  }}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-0.5"
                  title="Refresh memories"
                >
                  <RefreshCw size={10} className={isLoadingMemories ? 'animate-spin' : ''} />
                  <span>{detailedMemories.length} Stored</span>
                </button>
              </div>

              {isLoadingMemories ? (
                <div className="flex items-center justify-center py-4 text-gray-500 gap-1.5 text-xs">
                  <Loader2 size={13} className="animate-spin" />
                  <span>Loading agent memories...</span>
                </div>
              ) : detailedMemories.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic py-1">No recorded memories yet today.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {detailedMemories.map((mem) => {
                    const isLongTerm = mem.importance >= 0.3;
                    return (
                      <div
                        key={mem.id}
                        className="bg-gray-900/80 p-2 rounded-lg border border-gray-800/80 space-y-1 text-[11px]"
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="capitalize px-1 py-0.2 bg-gray-800 rounded text-[9px] text-gray-300">
                              {mem.event_type}
                            </span>
                            {mem.day && <span className="font-mono text-[9px]">Day {mem.day}</span>}
                          </span>
                          <span
                            className={`font-mono text-[9px] px-1 rounded ${
                              mem.importance >= 0.7
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                          >
                            ⭐ {mem.importance} {isLongTerm ? '(ChromaDB)' : ''}
                          </span>
                        </div>
                        <p className="text-gray-200 leading-snug">{mem.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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
