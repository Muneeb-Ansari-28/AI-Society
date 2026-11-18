import React, { useState } from 'react';
import type { AgentState } from '../types/simulation';
import { AGENT_PERSONALITIES } from '../game/personalities';
import { api } from '../services/api';
import { Heart, Shield, MessageSquareQuote, Loader2, X, Users, Sparkles } from 'lucide-react';

interface RelationshipPanelProps {
  agents: AgentState[];
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

export const RelationshipPanel: React.FC<RelationshipPanelProps> = ({
  agents,
  isOpen,
  onClose,
  onSelectAgent,
}) => {
  const [selectedPair, setSelectedPair] = useState<[string, string]>(['alex', 'mia']);
  const [isConversing, setIsConversing] = useState(false);

  if (!isOpen) return null;

  const agentList = Object.keys(AGENT_PERSONALITIES);

  const getRelationshipInfo = (sourceId: string, targetId: string) => {
    const sourceAgent = agents.find((a) => a.id === sourceId);
    return sourceAgent?.relationships?.[targetId] || { trust: 50, friendship: 50, last_interaction: '' };
  };

  const handleTriggerConvo = async (idA: string, idB: string) => {
    if (isConversing || idA === idB) return;
    setIsConversing(true);
    try {
      await api.triggerConversation(idA, idB);
    } catch (err) {
      console.warn('Failed to trigger conversation:', err);
    } finally {
      setIsConversing(false);
    }
  };

  const currentRelA = getRelationshipInfo(selectedPair[0], selectedPair[1]);
  const currentRelB = getRelationshipInfo(selectedPair[1], selectedPair[0]);

  const profileA = AGENT_PERSONALITIES[selectedPair[0]];
  const profileB = AGENT_PERSONALITIES[selectedPair[1]];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-400" />
            <h3 className="font-bold text-gray-100 text-sm tracking-wide">
              Social Network & Relationship Matrix
            </h3>
            <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full font-mono">
              5 Villagers Active
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* 5x5 Grid Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Village Affinity Grid (Click any cell)
              </span>
              <span className="text-[10px] text-gray-500">Color = Friendship · Number = Trust</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-1.5 text-gray-500 font-mono text-[10px]"></th>
                    {agentList.map((id) => (
                      <th key={id} className="p-1.5 font-bold text-gray-300 text-[11px]">
                        <span className="mr-1">{AGENT_PERSONALITIES[id].avatar}</span>
                        <span>{AGENT_PERSONALITIES[id].name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentList.map((rowId) => (
                    <tr key={rowId} className="border-t border-gray-800/60">
                      <td className="p-1.5 font-bold text-gray-300 text-left text-[11px] whitespace-nowrap">
                        <span className="mr-1">{AGENT_PERSONALITIES[rowId].avatar}</span>
                        <span>{AGENT_PERSONALITIES[rowId].name}</span>
                      </td>
                      {agentList.map((colId) => {
                        if (rowId === colId) {
                          return (
                            <td key={colId} className="p-1.5 bg-gray-950/40 text-gray-600 font-mono text-[10px]">
                              —
                            </td>
                          );
                        }

                        const rel = getRelationshipInfo(rowId, colId);
                        const isSelected =
                          (selectedPair[0] === rowId && selectedPair[1] === colId) ||
                          (selectedPair[0] === colId && selectedPair[1] === rowId);

                        // Heatmap color based on friendship
                        const bgHue =
                          rel.friendship >= 70
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                            : rel.friendship >= 50
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                            : 'bg-amber-950/30 text-amber-300 border-amber-800/40';

                        return (
                          <td key={colId} className="p-1">
                            <button
                              onClick={() => setSelectedPair([rowId, colId])}
                              className={`w-full py-1.5 px-1 rounded-lg border text-[11px] font-mono transition-all flex items-center justify-center gap-1 ${bgHue} ${
                                isSelected ? 'ring-2 ring-emerald-400 font-bold scale-105' : 'hover:scale-105'
                              }`}
                            >
                              <span>{rel.friendship}%</span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Mutual Inspector for Selected Pair */}
          <div className="bg-gray-950/70 p-4 rounded-xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
              <div
                onClick={() => {
                  onSelectAgent(selectedPair[0]);
                  onClose();
                }}
                className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                title={`Click to inspect ${profileA.name}`}
              >
                <span className="text-2xl">{profileA.avatar}</span>
                <div>
                  <h4 className="font-bold text-gray-200 text-sm flex items-center gap-1.5">
                    <span>{profileA.name}</span>
                    <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800">Inspect</span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">{profileA.occupation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerConvo(selectedPair[0], selectedPair[1])}
                  disabled={isConversing}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-all"
                >
                  {isConversing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Generating Dialogue...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquareQuote size={13} />
                      <span>Trigger AI Conversation (Llama 3.2)</span>
                    </>
                  )}
                </button>
              </div>

              <div
                onClick={() => {
                  onSelectAgent(selectedPair[1]);
                  onClose();
                }}
                className="flex items-center gap-3 text-right cursor-pointer hover:opacity-85 transition-opacity"
                title={`Click to inspect ${profileB.name}`}
              >
                <div>
                  <h4 className="font-bold text-gray-200 text-sm flex items-center justify-end gap-1.5">
                    <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800">Inspect</span>
                    <span>{profileB.name}</span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">{profileB.occupation}</span>
                </div>
                <span className="text-2xl">{profileB.avatar}</span>
              </div>
            </div>

            {/* Directional Bars: A -> B and B -> A */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Perspective A -> B */}
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <span className="text-[11px] font-bold text-gray-300 block mb-1">
                  How {profileA.name} views {profileB.name}:
                </span>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Shield size={10} className="text-blue-400" />
                        <span>Trust</span>
                      </span>
                      <span className="font-mono text-gray-300">{currentRelA.trust}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${currentRelA.trust}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Heart size={10} className="text-rose-400" />
                        <span>Friendship</span>
                      </span>
                      <span className="font-mono text-gray-300">{currentRelA.friendship}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${currentRelA.friendship}%` }}
                      />
                    </div>
                  </div>
                </div>
                {currentRelA.last_interaction && (
                  <p className="text-[10px] text-gray-400 italic bg-gray-950 p-1.5 rounded border border-gray-800 leading-tight">
                    &ldquo;{currentRelA.last_interaction}&rdquo;
                  </p>
                )}
              </div>

              {/* Perspective B -> A */}
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800/80 space-y-2">
                <span className="text-[11px] font-bold text-gray-300 block mb-1">
                  How {profileB.name} views {profileA.name}:
                </span>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Shield size={10} className="text-blue-400" />
                        <span>Trust</span>
                      </span>
                      <span className="font-mono text-gray-300">{currentRelB.trust}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${currentRelB.trust}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Heart size={10} className="text-rose-400" />
                        <span>Friendship</span>
                      </span>
                      <span className="font-mono text-gray-300">{currentRelB.friendship}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${currentRelB.friendship}%` }}
                      />
                    </div>
                  </div>
                </div>
                {currentRelB.last_interaction && (
                  <p className="text-[10px] text-gray-400 italic bg-gray-950 p-1.5 rounded border border-gray-800 leading-tight">
                    &ldquo;{currentRelB.last_interaction}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-950/80 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-amber-400" />
            <span>Social bonds evolve after conversations, trades, and fulfilled promises.</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
