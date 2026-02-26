import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket, getSocket, type SocketEvents } from '@/shared/lib/socket';
import { useAuthStore } from '@/features/auth';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  on: <K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void
  ) => void;
  off: <K extends keyof SocketEvents>(
    event: K,
    callback: (data: SocketEvents[K]) => void
  ) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketInstance = initializeSocket(accessToken);
    setSocket(socketInstance);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    // Set initial state
    setIsConnected(socketInstance.connected);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, accessToken]);

  const on = useCallback(
    <K extends keyof SocketEvents>(
      event: K,
      callback: (data: SocketEvents[K]) => void
    ) => {
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.on(event, callback as never);
      }
    },
    []
  );

  const off = useCallback(
    <K extends keyof SocketEvents>(
      event: K,
      callback: (data: SocketEvents[K]) => void
    ) => {
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.off(event, callback as never);
      }
    },
    []
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, on, off }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
