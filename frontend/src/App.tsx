import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { VillagersBar } from './components/VillagersBar';
import { VillageGame } from './components/VillageGame';
import { AgentPanel } from './components/AgentPanel';
import { EventLog } from './components/EventLog';
import { LocationModal } from './components/LocationModal';
import { ConversationCard } from './components/ConversationCard';
import type { AgentState, SimulationEvent, VillageLocation, WorldState } from './types/simulation';
import { EventBus } from './game/EventBus';
import { simulationWs, type WSConnectionStatus } from './services/websocket';

export const App: React.FC = () => {
  const [worldState, setWorldState] = useState<WorldState>({
    day: 1,
    timeString: '08:30 AM',
    period: 'Morning',
    weather: 'Sunny',
    isRunning: true,
    speed: 1,
  });

  const [wsStatus, setWsStatus] = useState<WSConnectionStatus>('disconnected');
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<VillageLocation | null>(null);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    // 0. Connect backend WebSocket
    simulationWs.connect();
    setWsStatus(simulationWs.getStatus());

    const handleWsStatus = (status: WSConnectionStatus) => {
      setWsStatus(status);
    };

    // 1. World state updates from Phaser loop
    const handleWorldUpdate = (state: WorldState) => {
      setWorldState(state);
    };

    // 2. Agents list update from Phaser
    const handleAgentsUpdate = (agentList: AgentState[]) => {
      setAgents(agentList);
    };

    // 3. Selection updates
    const handleAgentSelected = (agent: AgentState | null) => {
      setSelectedAgentId(agent ? agent.id : null);
    };

    const handleLocationSelected = (loc: VillageLocation | null) => {
      setSelectedLocation(loc);
    };

    // 4. Events logged
    const handleEventLogged = (ev: SimulationEvent) => {
      setEvents((prev) => [...prev, ev]);
    };

    EventBus.on('ws-status-changed', handleWsStatus);
    EventBus.on('world-updated', handleWorldUpdate);
    EventBus.on('agents-updated', handleAgentsUpdate);
    EventBus.on('agent-selected', handleAgentSelected);
    EventBus.on('location-selected', handleLocationSelected);
    EventBus.on('event-logged', handleEventLogged);

    return () => {
      EventBus.off('ws-status-changed', handleWsStatus);
      EventBus.off('world-updated', handleWorldUpdate);
      EventBus.off('agents-updated', handleAgentsUpdate);
      EventBus.off('agent-selected', handleAgentSelected);
      EventBus.off('location-selected', handleLocationSelected);
      EventBus.off('event-logged', handleEventLogged);
      simulationWs.disconnect();
    };
  }, []);

  const handleSaveNotice = () => {
    setSaveNotice('Simulation state and agent memories saved to persistent SQLite database.');
    setTimeout(() => {
      setSaveNotice(null);
    }, 4000);
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {/* Toast Save Notification */}
      {saveNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-xl shadow-2xl text-xs flex items-center gap-2 backdrop-blur animate-in fade-in">
          <span>💾</span>
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Top Navbar: Status, Clock, Simulation Controls */}
      <TopBar worldState={worldState} wsStatus={wsStatus} onSaveNotice={handleSaveNotice} />

      {/* Villagers Quick-Select Strip */}
      <VillagersBar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => setSelectedAgentId(id)}
      />

      {/* Main Simulation Viewport + Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: Interactive Phaser Canvas */}
        <div className="flex-1 relative p-2 bg-gray-950 flex items-center justify-center">
          <VillageGame />

          {/* Landmark click modal */}
          <LocationModal
            location={selectedLocation}
            selectedAgentId={selectedAgentId}
            onClose={() => setSelectedLocation(null)}
          />
        </div>

        {/* Right: Selected Agent Inspector Panel */}
        <AgentPanel
          agent={selectedAgent}
          onClose={() => {
            setSelectedAgentId(null);
            EventBus.emit('select-agent', null);
          }}
        />
      </div>

      {/* Bottom: Real-Time Event Log */}
      <EventLog events={events} />

      {/* Floating Dynamic Conversation Card */}
      <ConversationCard />
    </div>
  );
};

export default App;
