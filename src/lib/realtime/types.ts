// Real-time Event Types

export type EventType =
  | 'data:created'
  | 'data:updated'
  | 'data:deleted'
  | 'widget:refresh'
  | 'dashboard:update'
  | 'schema:detected'
  | 'datasource:health'
  | 'notification'
  | 'error';

export interface RealtimeEvent<T = unknown> {
  id: string;
  type: EventType;
  resource: string;
  resourceId?: string;
  data: T;
  timestamp: number;
  userId?: string;
}

export interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  error?: string;
  retryCount: number;
}

export interface RealtimeConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  useFallbackPolling?: boolean;
  pollingInterval?: number;
}

export type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void;
export type UnsubscribeFn = () => void;

export interface RealtimeClient {
  connect: () => void;
  disconnect: () => void;
  subscribe: <T = unknown>(eventType: EventType | '*', handler: EventHandler<T>) => UnsubscribeFn;
  publish: <T = unknown>(event: Omit<RealtimeEvent<T>, 'id' | 'timestamp'>) => void;
  getState: () => ConnectionState;
}
