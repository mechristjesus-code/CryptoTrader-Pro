import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getDb } from './db';
import { marketData, bots, deals } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface ClientSubscription {
  userId: number;
  subscriptions: Set<string>; // e.g., 'market:BTC/USD', 'bot:123', 'deals:456'
}

const clients = new Map<WebSocket, ClientSubscription>();

export function initializeWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');

    // Initialize client subscription
    clients.set(ws, {
      userId: 0,
      subscriptions: new Set(),
    });

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        await handleMessage(ws, message);
      } catch (error) {
        console.error('[WebSocket] Message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  return wss;
}

async function handleMessage(ws: WebSocket, message: any) {
  const subscription = clients.get(ws);
  if (!subscription) return;

  switch (message.type) {
    case 'auth':
      // Authenticate user
      subscription.userId = message.userId;
      ws.send(JSON.stringify({ type: 'auth_success', userId: message.userId }));
      break;

    case 'subscribe':
      // Subscribe to updates: market:BTC/USD, bot:123, deals:456
      if (message.channel) {
        subscription.subscriptions.add(message.channel);
        ws.send(JSON.stringify({ type: 'subscribed', channel: message.channel }));
      }
      break;

    case 'unsubscribe':
      // Unsubscribe from updates
      if (message.channel) {
        subscription.subscriptions.delete(message.channel);
        ws.send(JSON.stringify({ type: 'unsubscribed', channel: message.channel }));
      }
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

/**
 * Broadcast market data updates to subscribed clients
 */
export async function broadcastMarketData(symbol: string, data: any) {
  const channel = `market:${symbol}`;

  clients.forEach((subscription, ws) => {
    if (subscription.subscriptions.has(channel) && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'market_update',
        channel,
        data,
        timestamp: Date.now(),
      }));
    }
  });
}

/**
 * Broadcast bot status updates to subscribed clients
 */
export async function broadcastBotUpdate(userId: number, botId: number, data: any) {
  const channel = `bot:${botId}`;

  clients.forEach((subscription, ws) => {
    if (
      subscription.userId === userId &&
      subscription.subscriptions.has(channel) &&
      ws.readyState === WebSocket.OPEN
    ) {
      ws.send(JSON.stringify({
        type: 'bot_update',
        channel,
        botId,
        data,
        timestamp: Date.now(),
      }));
    }
  });
}

/**
 * Broadcast deal completion to subscribed clients
 */
export async function broadcastDealUpdate(userId: number, dealId: number, data: any) {
  const channel = `deals:${dealId}`;

  clients.forEach((subscription, ws) => {
    if (
      subscription.userId === userId &&
      subscription.subscriptions.has(channel) &&
      ws.readyState === WebSocket.OPEN
    ) {
      ws.send(JSON.stringify({
        type: 'deal_update',
        channel,
        dealId,
        data,
        timestamp: Date.now(),
      }));
    }
  });
}

/**
 * Broadcast to all connected clients (e.g., system announcements)
 */
export function broadcastToAll(message: any) {
  clients.forEach((_, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(): number {
  return clients.size;
}

/**
 * Clean up expired entries periodically
 */
export function startCleanupInterval(intervalMs: number = 600000) {
  setInterval(() => {
    const now = Date.now();
    const storeKeys = Object.keys(clients);
    storeKeys.forEach((key) => {
      const client = clients.get(key as any);
      if (client && now > (client as any).resetTime + 600000) {
        clients.delete(key as any);
      }
    });
  }, intervalMs);
}
