import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { SimulationEvent } from '../types/simulation';
import {
  ScrollText,
  MessageSquare,
  Briefcase,
  Footprints,
  HeartHandshake,
  Trash2,
  ArrowDownCircle,
  Filter,
} from 'lucide-react';

interface EventLogProps {
  events: SimulationEvent[];
  onClear?: () => void;
}

type FilterCategory = 'all' | 'talk' | 'work' | 'move' | 'social';

export const EventLog: React.FC<EventLogProps> = ({ events, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    if (activeFilter === 'talk') {
      return events.filter((e) => e.type === 'talk' || e.type === 'conversation');
    }
    if (activeFilter === 'work') {
      return events.filter((e) => e.type === 'work' || e.type === 'craft');
    }
    if (activeFilter === 'move') {
      return events.filter((e) => e.type === 'move');
    }
    if (activeFilter === 'social') {
      return events.filter(
        (e) => e.type === 'help' || e.type === 'social' || e.type === 'promise'
      );
    }
    return events;
  }, [events, activeFilter]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredEvents, autoScroll]);

  const handleClear = () => {
    if (onClear) onClear();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work':
      case 'craft':
        return <Briefcase size={12} className="text-amber-400" />;
      case 'conversation':
      case 'talk':
        return <MessageSquare size={12} className="text-emerald-400" />;
      case 'move':
        return <Footprints size={12} className="text-blue-400" />;
      case 'help':
      case 'social':
      case 'promise':
        return <HeartHandshake size={12} className="text-purple-400" />;
      default:
        return <ScrollText size={12} className="text-gray-400" />;
    }
  };

  const tabs: { key: FilterCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Filter size={11} /> },
    { key: 'talk', label: 'Talks', icon: <MessageSquare size={11} /> },
    { key: 'work', label: 'Work', icon: <Briefcase size={11} /> },
    { key: 'move', label: 'Move', icon: <Footprints size={11} /> },
    { key: 'social', label: 'Social & Promises', icon: <HeartHandshake size={11} /> },
  ];

  return (
    <div className="bg-gray-900/95 border-t border-gray-800 p-3 h-40 flex flex-col select-none">
      {/* Header Bar with Tabs & Controls */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <ScrollText size={14} className="text-emerald-400" />
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
              Village Event Feed
            </h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-950 p-0.5 rounded-lg border border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-gray-800 text-emerald-300 font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
            Showing {filteredEvents.length} of {events.length}
          </span>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
              autoScroll
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-gray-950 border-gray-800 text-gray-400'
            }`}
            title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
          >
            <ArrowDownCircle size={11} />
            <span>Auto-scroll</span>
          </button>

          <button
            onClick={handleClear}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
            title="Clear event history"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Event Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs text-gray-300"
      >
        {filteredEvents.length === 0 ? (
          <div className="text-gray-600 text-xs italic text-center py-5">
            {events.length === 0
              ? 'Simulation initialized. Waiting for village events...'
              : `No events matching "${activeFilter}" category.`}
          </div>
        ) : (
          filteredEvents.map((ev) => (
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
