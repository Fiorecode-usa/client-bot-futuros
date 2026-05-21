import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';

export function useSocket(): { socket: Socket | null; connected: boolean } {
  const { tokens } = useAuth();
  const ref = useRef<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!tokens) return;
    const s = connectSocket();
    ref.current = s;
    const onConnect = (): void => setConnected(true);
    const onDisconnect = (): void => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [tokens]);

  useEffect(() => {
    return () => {
      if (!tokens) {
        disconnectSocket();
      }
    };
  }, [tokens]);

  return { socket: ref.current, connected };
}
