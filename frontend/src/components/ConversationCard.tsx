import React, { useState, useEffect } from 'react';
import { EventBus } from '../game/EventBus';
import type { ConversationEvent } from '../types/simulation';
import { AGENT_PERSONALITIES } from '../game/personalities';
import { X, MessageSquare, TrendingUp } from 'lucide-react';

export const ConversationCard: React.FC = () => {
  const [currentConvo, setCurrentConvo] = useState<ConversationEvent | null>(null);

  useEffect(() => {
    const handleConvo = (data: ConversationEvent) => {
      setCurrentConvo(data);
    };

    EventBus.on('conversation-logged', handleConvo);
    return () => {
      EventBus.off('conversation-logged', handleConvo);
    };
  }, []);

  if (!currentConvo) return null;

  const agentA = AGENT_PERSONALITIES[currentConvo.initiator_id];
  const agentB = AGENT_PERSONALITIES[currentConvo.receiver_id];

  return (
    <div className="fixed bottom-14 left-4 z-40 max-w-md w-full bg-gray-900/95 border border-emerald-500/70 rounded-2xl shadow-2xl backdrop-blur-md p-4 animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <MessageSquare size={14} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-gray-200">
              {currentConvo.initiator_name} & {currentConvo.receiver_name}
            </h4>
            <p className="text-[10px] text-emerald-400/90 font-mono">
              Topic: {currentConvo.topic}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentConvo(null)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Dialogue turns */}
      <div className="space-y-2 mb-3">
        {currentConvo.dialogue.map((turn, idx) => {
          const isA = turn.speaker === currentConvo.initiator_id;
          const personality = isA ? agentA : agentB;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                isA
                  ? 'bg-gray-950/80 border-gray-800'
                  : 'bg-emerald-950/30 border-emerald-900/60'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm flex-shrink-0"
                style={{ backgroundColor: `${personality?.color || '#3b82f6'}25` }}
              >
                {personality?.avatar || '👤'}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-gray-300 block mb-0.5">
                  {turn.speaker_name}
                </span>
                <p className="text-gray-200 text-xs leading-relaxed">
                  &ldquo;{turn.text}&rdquo;
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social Outcome & Relationship Delta */}
      <div className="flex items-center justify-between text-[11px] bg-gray-950/80 px-2.5 py-1.5 rounded-lg border border-gray-800 text-gray-400">
        <span className="truncate pr-2 italic">
          {currentConvo.outcome}
        </span>
        <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-semibold flex-shrink-0">
          <TrendingUp size={12} />
          <span>+{currentConvo.trust_delta} Trust</span>
          <span>•</span>
          <span>+{currentConvo.friendship_delta} Friendship</span>
        </div>
      </div>
    </div>
  );
};
