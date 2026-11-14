import React, { useRef, useEffect } from 'react';
import type { SimulationEvent } from '../types/simulation';
import { ScrollText, MessageSquare, Briefcase, Footprints, HeartHandshake } from 'lucide-react';

interface EventLogProps {
  events: SimulationEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work':
        return <Briefcase size={12} className="text-amber-400" />;
      case 'conversation':
      case 'talk':
        return <MessageSquare size={12} className="text-emerald-400" />;
      case 'move':
        return <Footprints size={12} className="text-blue-400" />;
      case 'help':
      case 'social':
        return <HeartHandshake size={12} className="text-purple-400" />;
      default:
        return <ScrollText size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900/90 border-t border-gray-800 p-3 h-36 flex flex-col select-none">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <ScrollText size={13} className="text-emerald-400" />
          <span>Village Event Feed</span>
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">
          {events.length} events logged
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs text-gray-300"
      >
        {events.length === 0 ? (
          <div className="text-gray-600 text-xs italic text-center py-4">
            Simulation initialized. Waiting for village events...
          </div>
        ) : (
          events.slice(-30).map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2 py-0.5 px-2 rounded hover:bg-gray-850/60 transition-colors"
            >
              <span className="text-gray-500 text-[11px] whitespace-nowrap mt-0.5">
                {ev.time}
              </span>
              <span className="mt-0.5">{getTypeIcon(ev.type)}</span>
              <div className="flex-1 leading-snug">
                <span className="font-semibold text-gray-200 mr-1.5">
                  {ev.agentName}:
                </span>
                <span className="text-gray-300 text-[11.5px] font-sans">
                  {ev.description}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
