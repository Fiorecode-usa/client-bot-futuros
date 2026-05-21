import { io, type Socket } from 'socket.io-client';
import { tokenStore } from './tokenStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = tokenStore.getIdToken();
  socket = io(baseURL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
