export type ActionType =
  | 'idle'
  | 'move'
  | 'work'
  | 'talk'
  | 'trade'
  | 'help'
  | 'rest';

export interface AgentPersonality {
  id: string;
  name: string;
  occupation: string;
  avatar: string;
  color: string;
  personality: string;
  goals: string;
  conflict: string;
  homeLocation: string;
  workLocation: string;
}

export interface RelationshipInfo {
  name: string;
  occupation: string;
  trust: number;
  friendship: number;
  last_interaction?: string;
}

export interface AgentState {
  id: string;
  name: string;
  occupation: string;
  color: string;
  energy: number;
  happiness: number;
  currentAction: ActionType;
  actionDetail: string;
  currentLocation: string;
  targetLocation: string | null;
  x: number;
  y: number;
  inventory: Record<string, number>;
  relationships: Record<string, RelationshipInfo>;
  recentMemories: string[];
  dialogue?: string | null;
}

export interface VillageLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'farm' | 'shop' | 'square' | 'house' | 'nature' | 'work';
  description: string;
  ownerId?: string;
}

export interface SimulationEvent {
  id: string;
  time: string;
  agentId: string;
  agentName: string;
  type: string;
  description: string;
}

export interface ConversationTurn {
  speaker: string;
  speaker_name: string;
  text: string;
}

export interface ConversationEvent {
  initiator_id: string;
  initiator_name: string;
  receiver_id: string;
  receiver_name: string;
  location: string;
  topic: string;
  dialogue: ConversationTurn[];
  outcome: string;
  trust_delta: number;
  friendship_delta: number;
  relationship: { trust: number; friendship: number; last_interaction?: string };
  time: string;
}

export interface WorldState {
  day: number;
  timeString: string;
  period: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  weather: 'Sunny' | 'Breezy' | 'Cloudy' | 'Rainy';
  isRunning: boolean;
  speed: number;
}
