'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getRealtimeClient, resetRealtimeClient } from './client';
import { RealtimeClient, RealtimeConfig, ConnectionState } from './types';

interface RealtimeContextValue {
  client: RealtimeClient | null;
  connectionState: ConnectionState;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  client: null,
  connectionState: { status: 'disconnected', retryCount: 0 },
  isConnected: false,
});

interface RealtimeProviderProps {
  children: React.ReactNode;
  config?: RealtimeConfig;
}

export function RealtimeProvider({ children, config }: RealtimeProviderProps) {
  const [client, setClient] = useState<RealtimeClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    retryCount: 0,
  });

  useEffect(() => {
    // Initialize the client
    const realtimeClient = getRealtimeClient(config);
    setClient(realtimeClient);

    // Subscribe to connection state changes
    const unsubscribe = realtimeClient.subscribe<ConnectionState>(
      'notification',
      (event) => {
        if (event.resource === 'connection') {
          setConnectionState(event.data);
        }
      }
    );

    // Get initial state
    setConnectionState(realtimeClient.getState());

    return () => {
      unsubscribe();
      // Don't reset the client on unmount - keep it alive for the app
    };
  }, [config]);

  const value: RealtimeContextValue = {
    client,
    connectionState,
    isConnected: connectionState.status === 'connected',
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Connection status indicator component
export function ConnectionIndicator() {
  const { connectionState, isConnected } = useRealtime();

  const statusColors = {
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    disconnected: 'bg-gray-400',
    error: 'bg-red-500',
  };

  const statusLabels = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${statusColors[connectionState.status]} ${
          connectionState.status === 'connecting' ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-neutral-500">
        {statusLabels[connectionState.status]}
      </span>
    </div>
  );
}

// Notification toast for realtime events
interface NotificationToast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const { client } = useRealtime();

  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.subscribe('notification', (event) => {
      if (event.resource !== 'connection' && event.resource !== 'polling') {
        const notification: NotificationToast = {
          id: event.id,
          message: typeof event.data === 'string'
            ? event.data
            : (event.data as { message?: string })?.message || 'New notification',
          type: 'info',
          timestamp: event.timestamp,
        };

        setNotifications((prev) => [notification, ...prev].slice(0, 5));

        // Auto-remove after 5 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        }, 5000);
      }
    });

    return () => unsubscribe();
  }, [client]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg border border-neutral-200 p-4 max-w-sm
                   animate-in slide-in-from-right"
        >
          <p className="text-sm text-neutral-700">{notification.message}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}
