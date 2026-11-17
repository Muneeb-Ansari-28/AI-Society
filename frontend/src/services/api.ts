const API_BASE = 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  ollama_model: string;
  ollama_connected: boolean;
  version: string;
}

export interface InteractResponse {
  agent_id: string;
  agent_name: string;
  response: string;
  mood: string;
}

export interface DecisionResponse {
  agent: string;
  decision: {
    action: string;
    location: string;
    target?: string | null;
    reason: string;
    dialogue?: string | null;
  };
  execution: {
    status: string;
    agent_id: string;
    agent_name: string;
    action: string;
    location: string;
    target?: string | null;
    reason: string;
    dialogue?: string | null;
    action_detail: string;
    description: string;
    energy: number;
    happiness: number;
    inventory: Record<string, number>;
    time: string;
  };
}

export const api = {
  async checkHealth(): Promise<HealthResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getAgents(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return await res.json();
  },

  async getAgent(agentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}`);
    if (!res.ok) throw new Error(`Failed to fetch agent ${agentId}`);
    return await res.json();
  },

  async getAgentMemories(agentId: string, limit: number = 10): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/memories?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch memories for ${agentId}`);
    return await res.json();
  },

  async searchAgentMemories(agentId: string, query: string, limit: number = 5): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/memories/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) throw new Error(`Failed to search memories for ${agentId}`);
    return await res.json();
  },

  async getAgentPromises(agentId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/promises`);
    if (!res.ok) throw new Error(`Failed to fetch promises for ${agentId}`);
    return await res.json();
  },

  async fulfillPromise(promiseId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/agents/promises/${promiseId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to fulfill promise ${promiseId}`);
    return await res.json();
  },

  async getAgentRelationships(agentId: string): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/relationships`);
    if (!res.ok) throw new Error(`Failed to fetch relationships for ${agentId}`);
    return await res.json();
  },

  async triggerConversation(agentId: string, targetId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/converse/${targetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to trigger conversation between ${agentId} and ${targetId}`);
    return await res.json();
  },

  async triggerDecision(agentId: string): Promise<DecisionResponse> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Failed to trigger decision for ${agentId}`);
    return await res.json();
  },

  async interactWithAgent(agentId: string, message: string): Promise<InteractResponse> {
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`Failed to interact with agent ${agentId}`);
    return await res.json();
  },

  async getWorldState(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/simulation/world`);
    if (!res.ok) throw new Error('Failed to fetch world state');
    return await res.json();
  },

  async getEvents(limit: number = 30): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/simulation/events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  },

  async startSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/simulation/start`, { method: 'POST' });
    return await res.json();
  },

  async pauseSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/simulation/pause`, { method: 'POST' });
    return await res.json();
  },

  async setSpeed(speed: number): Promise<any> {
    const res = await fetch(`${API_BASE}/api/simulation/speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
    return await res.json();
  },

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
    return await res.json();
  },
};
