import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { VillagersBar } from './components/VillagersBar';
import { VillageGame } from './components/VillageGame';
import { AgentPanel } from './components/AgentPanel';
import { EventLog } from './components/EventLog';
import { LocationModal } from './components/LocationModal';
import { ConversationCard } from './components/ConversationCard';
import { Minimap } from './components/Minimap';
import { RelationshipPanel } from './components/RelationshipPanel';
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

  const [wsStatus, setWsStatus] = useState<WSConnectionStatus>(() => simulationWs.getStatus());
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<VillageLocation | null>(null);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

  useEffect(() => {
    // 0. Connect backend WebSocket
    simulationWs.connect();

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

    // 5. Backend snapshot & reset events
    const handleSaveReceived = (data: { message?: string; timestamp?: string }) => {
      setSaveNotice(data.message || 'Simulation snapshot synchronized with database.');
      setTimeout(() => setSaveNotice(null), 4000);
    };

    const handleWorldResetReceived = () => {
      setSaveNotice('World state restored and re-synchronized.');
      setTimeout(() => setSaveNotice(null), 4000);
    };

    EventBus.on('ws-status-changed', handleWsStatus);
    EventBus.on('world-updated', handleWorldUpdate);
    EventBus.on('agents-updated', handleAgentsUpdate);
    EventBus.on('agent-selected', handleAgentSelected);
    EventBus.on('location-selected', handleLocationSelected);
    EventBus.on('event-logged', handleEventLogged);
    EventBus.on('backend-simulation_saved', handleSaveReceived);
    EventBus.on('backend-world-reset', handleWorldResetReceived);

    return () => {
      EventBus.off('ws-status-changed', handleWsStatus);
      EventBus.off('world-updated', handleWorldUpdate);
      EventBus.off('agents-updated', handleAgentsUpdate);
      EventBus.off('agent-selected', handleAgentSelected);
      EventBus.off('location-selected', handleLocationSelected);
      EventBus.off('event-logged', handleEventLogged);
      EventBus.off('backend-simulation_saved', handleSaveReceived);
      EventBus.off('backend-world-reset', handleWorldResetReceived);
      simulationWs.disconnect();
    };
  }, []);

  const handleSaveNotice = (message?: string) => {
    setSaveNotice(message || 'Simulation state and agent memories saved to persistent SQLite database.');
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
      <TopBar
        worldState={worldState}
        wsStatus={wsStatus}
        onSaveNotice={handleSaveNotice}
        onOpenSocial={() => setIsRelationshipOpen(true)}
      />

      {/* Villagers Quick-Select Strip */}
      <VillagersBar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => {
          setSelectedAgentId(id);
          const found = agents.find((a) => a.id === id) || null;
          EventBus.emit('select-agent', found);
        }}
      />

      {/* Main Simulation Viewport + Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: Interactive Phaser Canvas */}
        <div className="flex-1 relative p-2 bg-gray-950 flex items-center justify-center">
          <VillageGame />

          {/* Floating Minimap Radar (bottom-left overlay) */}
          <div className="absolute bottom-4 left-4 z-20">
            <Minimap
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={(id) => {
                setSelectedAgentId(id);
                const found = agents.find((a) => a.id === id) || null;
                EventBus.emit('select-agent', found);
              }}
            />
          </div>

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
      <EventLog events={events} onClear={() => setEvents([])} />

      {/* Floating Dynamic Conversation Card */}
      <ConversationCard />

      {/* Social Network & Relationship Matrix Modal */}
      <RelationshipPanel
        agents={agents}
        isOpen={isRelationshipOpen}
        onClose={() => setIsRelationshipOpen(false)}
        onSelectAgent={(id) => {
          setSelectedAgentId(id);
          const found = agents.find((a) => a.id === id) || null;
          EventBus.emit('select-agent', found);
          setIsRelationshipOpen(false);
        }}
      />
    </div>
  );
};

export default App;
