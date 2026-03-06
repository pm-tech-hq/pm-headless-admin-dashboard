// Real-time Client Implementation

import {
  RealtimeConfig,
  RealtimeClient,
  RealtimeEvent,
  EventType,
  EventHandler,
  ConnectionState,
  UnsubscribeFn,
} from './types';

const DEFAULT_CONFIG: Required<RealtimeConfig> = {
  url: '',
  autoConnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  useFallbackPolling: true,
  pollingInterval: 5000,
};

export function createRealtimeClient(config: RealtimeConfig = {}): RealtimeClient {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  let ws: WebSocket | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let pollingTimer: NodeJS.Timeout | null = null;

  let state: ConnectionState = {
    status: 'disconnected',
    retryCount: 0,
  };

  const subscribers = new Map<string, Set<EventHandler>>();

  const updateState = (updates: Partial<ConnectionState>) => {
    state = { ...state, ...updates };
    emit({
      id: generateId(),
      type: 'notification',
      resource: 'connection',
      data: state,
      timestamp: Date.now(),
    });
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const emit = (event: RealtimeEvent) => {
    // Notify specific subscribers
    const handlers = subscribers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }

    // Notify wildcard subscribers
    const wildcardHandlers = subscribers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(event));
    }
  };

  const startHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, mergedConfig.heartbeatInterval);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const startPolling = () => {
    if (!mergedConfig.useFallbackPolling || pollingTimer) return;

    pollingTimer = setInterval(async () => {
      // In a real implementation, this would poll an API endpoint
      // for updates when WebSocket is not available
      emit({
        id: generateId(),
        type: 'notification',
        resource: 'polling',
        data: { message: 'Polling for updates...' },
        timestamp: Date.now(),
      });
    }, mergedConfig.pollingInterval);
  };

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (state.retryCount >= mergedConfig.maxReconnectAttempts) {
      updateState({
        status: 'error',
        error: 'Max reconnection attempts reached',
      });

      // Fall back to polling if WebSocket fails
      if (mergedConfig.useFallbackPolling) {
        startPolling();
      }
      return;
    }

    updateState({ status: 'disconnected', retryCount: state.retryCount + 1 });

    reconnectTimer = setTimeout(() => {
      connect();
    }, mergedConfig.reconnectInterval * Math.pow(1.5, state.retryCount));
  };

  const connect = () => {
    if (!mergedConfig.url) {
      // No WebSocket URL provided, use polling as fallback
      if (mergedConfig.useFallbackPolling) {
        updateState({ status: 'connected' });
        startPolling();
      }
      return;
    }

    if (ws?.readyState === WebSocket.OPEN) {
      return;
    }

    updateState({ status: 'connecting' });

    try {
      ws = new WebSocket(mergedConfig.url);

      ws.onopen = () => {
        updateState({
          status: 'connected',
          lastConnected: new Date(),
          retryCount: 0,
          error: undefined,
        });
        stopPolling();
        startHeartbeat();
      };

      ws.onclose = () => {
        stopHeartbeat();
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        updateState({
          status: 'error',
          error: 'WebSocket connection error',
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle pong responses
          if (data.type === 'pong') {
            return;
          }

          emit(data as RealtimeEvent);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      updateState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Connection failed',
      });
      scheduleReconnect();
    }
  };

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    stopHeartbeat();
    stopPolling();

    if (ws) {
      ws.close();
      ws = null;
    }

    updateState({ status: 'disconnected', retryCount: 0 });
  };

  const subscribe = <T = unknown>(
    eventType: EventType | '*',
    handler: EventHandler<T>
  ): UnsubscribeFn => {
    if (!subscribers.has(eventType)) {
      subscribers.set(eventType, new Set());
    }

    const handlers = subscribers.get(eventType)!;
    handlers.add(handler as EventHandler);

    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        subscribers.delete(eventType);
      }
    };
  };

  const publish = <T = unknown>(event: Omit<RealtimeEvent<T>, 'id' | 'timestamp'>) => {
    const fullEvent: RealtimeEvent<T> = {
      ...event,
      id: generateId(),
      timestamp: Date.now(),
    };

    // If WebSocket is connected, send through it
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(fullEvent));
    }

    // Also emit locally for immediate feedback
    emit(fullEvent as RealtimeEvent);
  };

  const getState = (): ConnectionState => ({ ...state });

  // Auto-connect if configured
  if (mergedConfig.autoConnect) {
    // Delay to allow client to be set up
    setTimeout(connect, 0);
  }

  return {
    connect,
    disconnect,
    subscribe,
    publish,
    getState,
  };
}

// Singleton instance for the application
let globalClient: RealtimeClient | null = null;

export function getRealtimeClient(config?: RealtimeConfig): RealtimeClient {
  if (!globalClient) {
    globalClient = createRealtimeClient(config);
  }
  return globalClient;
}

export function resetRealtimeClient(): void {
  if (globalClient) {
    globalClient.disconnect();
    globalClient = null;
  }
}
