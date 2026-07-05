import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  userId: number;
  autoConnect?: boolean;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (channel: string, callback: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
  emit: (event: string, data: any) => void;
}

export function useWebSocket({
  url = import.meta.env.VITE_WS_URL || 'http://localhost:3000',
  userId,
  autoConnect = true,
}: UseWebSocketOptions): WebSocketContextType {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    if (!autoConnect || !userId) return;

    // Initialize socket connection
    socketRef.current = io(url, {
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Setup event listeners for all subscribed channels
    socket.on('market:update', (data) => {
      const callback = subscriptionsRef.current.get(`market:${data.pair}`);
      if (callback) callback(data);
    });

    socket.on('bot:update', (data) => {
      const callback = subscriptionsRef.current.get(`bot:${data.botId}`);
      if (callback) callback(data);
    });

    socket.on('orderbook:update', (data) => {
      const callback = subscriptionsRef.current.get(`orderbook:${data.pair}`);
      if (callback) callback(data);
    });

    socket.on('portfolio:update', (data) => {
      const callback = subscriptionsRef.current.get('portfolio');
      if (callback) callback(data);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [url, userId, autoConnect]);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    subscriptionsRef.current.set(channel, callback);

    if (socketRef.current && socketRef.current.connected) {
      if (channel.startsWith('market:')) {
        const pair = channel.replace('market:', '');
        socketRef.current.emit('subscribe:market', pair);
      } else if (channel.startsWith('bot:')) {
        const botId = parseInt(channel.replace('bot:', ''));
        socketRef.current.emit('subscribe:bot', botId);
      } else if (channel.startsWith('orderbook:')) {
        const pair = channel.replace('orderbook:', '');
        socketRef.current.emit('subscribe:orderbook', pair);
      } else if (channel === 'portfolio') {
        socketRef.current.emit('subscribe:portfolio');
      }
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel);

    if (socketRef.current && socketRef.current.connected) {
      if (channel.startsWith('market:')) {
        const pair = channel.replace('market:', '');
        socketRef.current.emit('unsubscribe:market', pair);
      } else if (channel.startsWith('bot:')) {
        const botId = parseInt(channel.replace('bot:', ''));
        socketRef.current.emit('unsubscribe:bot', botId);
      } else if (channel.startsWith('orderbook:')) {
        const pair = channel.replace('orderbook:', '');
        socketRef.current.emit('unsubscribe:orderbook', pair);
      } else if (channel === 'portfolio') {
        socketRef.current.emit('unsubscribe:portfolio');
      }
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
    emit,
  };
}
