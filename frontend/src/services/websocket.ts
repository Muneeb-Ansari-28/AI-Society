import { EventBus } from '../game/EventBus';

export type WSConnectionStatus = 'connected' | 'disconnected' | 'connecting';

class SimulationWebSocket {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectTimer: number | null = null;
  private status: WSConnectionStatus = 'disconnected';
  private shouldReconnect = true;

  constructor() {
    const host = window.location.hostname || 'localhost';
    this.url = `ws://${host}:8000/ws/simulation`;
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');
    this.shouldReconnect = true;

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.setStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      this.socket.onclose = () => {
        this.setStatus('disconnected');
        this.socket = null;
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WS] Socket error (backend may still be starting):', err);
        this.setStatus('disconnected');
      };
    } catch (err) {
      console.warn('[WS] Connection attempt failed:', err);
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  public getStatus(): WSConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  private setStatus(status: WSConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      EventBus.emit('ws-status-changed', status);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && this.status !== 'connected') {
        this.connect();
      }
    }, 4000);
  }

  private handleMessage(msg: { type: string; data: any }): void {
    switch (msg.type) {
      case 'agent_action':
        EventBus.emit('backend-agent-action', msg.data);
        break;
      case 'world_tick':
        EventBus.emit('backend-world-tick', msg.data);
        break;
      case 'event_logged':
        EventBus.emit('backend-event-logged', msg.data);
        break;
      case 'simulation_status':
        EventBus.emit('backend-simulation-status', msg.data);
        break;
      case 'simulation_speed':
        EventBus.emit('backend-simulation-speed', msg.data);
        break;
      case 'world_reset':
        EventBus.emit('backend-world-reset', msg.data);
        break;
      default:
        // Generic forwarder
        EventBus.emit(`backend-${msg.type}`, msg.data);
        break;
    }
  }
}

export const simulationWs = new SimulationWebSocket();
