'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRealtimeClient } from './client';
import {
  RealtimeEvent,
  EventType,
  ConnectionState,
  RealtimeConfig,
} from './types';

/**
 * Hook to access the realtime connection state
 */
export function useRealtimeConnection(config?: RealtimeConfig) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    retryCount: 0,
  });

  useEffect(() => {
    const client = getRealtimeClient(config);

    // Subscribe to connection state changes
    const unsubscribe = client.subscribe<ConnectionState>('notification', (event) => {
      if (event.resource === 'connection') {
        setConnectionState(event.data);
      }
    });

    // Get initial state
    setConnectionState(client.getState());

    return () => {
      unsubscribe();
    };
  }, [config]);

  const connect = useCallback(() => {
    const client = getRealtimeClient();
    client.connect();
  }, []);

  const disconnect = useCallback(() => {
    const client = getRealtimeClient();
    client.disconnect();
  }, []);

  return {
    ...connectionState,
    connect,
    disconnect,
  };
}

/**
 * Hook to subscribe to specific event types
 */
export function useRealtimeEvent<T = unknown>(
  eventType: EventType | '*',
  handler: (event: RealtimeEvent<T>) => void,
  deps: React.DependencyList = []
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const client = getRealtimeClient();

    const unsubscribe = client.subscribe<T>(eventType, (event) => {
      handlerRef.current(event);
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/**
 * Hook to get the latest event of a specific type
 */
export function useLatestEvent<T = unknown>(eventType: EventType | '*') {
  const [event, setEvent] = useState<RealtimeEvent<T> | null>(null);

  useRealtimeEvent<T>(eventType, setEvent);

  return event;
}

/**
 * Hook to accumulate events in a buffer
 */
export function useEventBuffer<T = unknown>(
  eventType: EventType | '*',
  maxSize = 100
) {
  const [events, setEvents] = useState<RealtimeEvent<T>[]>([]);

  useRealtimeEvent<T>(eventType, (event) => {
    setEvents((prev) => {
      const updated = [event, ...prev];
      return updated.slice(0, maxSize);
    });
  });

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, clear };
}

/**
 * Hook to publish events
 */
export function usePublish() {
  const publish = useCallback(
    <T = unknown>(event: Omit<RealtimeEvent<T>, 'id' | 'timestamp'>) => {
      const client = getRealtimeClient();
      client.publish(event);
    },
    []
  );

  return publish;
}

/**
 * Hook for auto-refreshing data based on realtime events
 */
export function useRealtimeRefresh(
  resourceType: string,
  resourceId?: string,
  onRefresh?: () => void
) {
  const lastRefresh = useRef<number>(Date.now());

  useRealtimeEvent('data:created', (event) => {
    if (event.resource === resourceType) {
      lastRefresh.current = Date.now();
      onRefresh?.();
    }
  });

  useRealtimeEvent('data:updated', (event) => {
    if (event.resource === resourceType && (!resourceId || event.resourceId === resourceId)) {
      lastRefresh.current = Date.now();
      onRefresh?.();
    }
  });

  useRealtimeEvent('data:deleted', (event) => {
    if (event.resource === resourceType && (!resourceId || event.resourceId === resourceId)) {
      lastRefresh.current = Date.now();
      onRefresh?.();
    }
  });

  return lastRefresh.current;
}

/**
 * Hook for widget-specific refresh
 */
export function useWidgetRefresh(widgetId: string, onRefresh: () => void) {
  useRealtimeEvent('widget:refresh', (event) => {
    if (event.resourceId === widgetId || event.resourceId === '*') {
      onRefresh();
    }
  });
}

/**
 * Hook for polling-based data refresh (fallback when WebSocket unavailable)
 */
export function usePollingRefresh(
  fetchFn: () => Promise<void>,
  intervalMs = 30000,
  enabled = true
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const refresh = async () => {
      if (!mounted) return;

      setIsRefreshing(true);
      setError(null);

      try {
        await fetchFn();
        if (mounted) {
          setLastRefresh(new Date());
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Refresh failed'));
        }
      } finally {
        if (mounted) {
          setIsRefreshing(false);
        }
      }
    };

    // Initial fetch
    refresh();

    // Set up interval
    const timer = setInterval(refresh, intervalMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [fetchFn, intervalMs, enabled]);

  const manualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      await fetchFn();
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Refresh failed'));
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn]);

  return {
    isRefreshing,
    lastRefresh,
    error,
    refresh: manualRefresh,
  };
}
