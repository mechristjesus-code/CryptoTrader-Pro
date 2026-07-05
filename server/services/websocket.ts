import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../db';
import { bots } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

interface UserSubscription {
  userId: number;
  subscriptions: Set<string>;
  socket: Socket;
}

interface MarketDataUpdate {
  pair: string;
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  timestamp: number;
}

interface BotUpdate {
  botId: number;
  status: 'active' | 'inactive' | 'error';
  lastTrade?: {
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    timestamp: number;
  };
  equity: number;
  profit: number;
  timestamp: number;
}

interface OrderBookUpdate {
  pair: string;
  bids: Array<{ price: number; volume: number }>;
  asks: Array<{ price: number; volume: number }>;
  timestamp: number;
}

class WebSocketService {
  private io: SocketIOServer;
  private userSubscriptions: Map<string, UserSubscription> = new Map();
  private marketDataIntervals: Map<string, NodeJS.Timeout> = new Map();
  private botUpdateIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      const socketId = socket.id;
      this.userSubscriptions.set(socketId, {
        userId,
        subscriptions: new Set(),
        socket,
      });

      // Handle market data subscriptions
      socket.on('subscribe:market', (pair: string) => {
        const subscription = this.userSubscriptions.get(socketId);
        if (subscription) {
          subscription.subscriptions.add(`market:${pair}`);
          socket.join(`market:${pair}`);
          this.startMarketDataStream(pair);
        }
      });

      socket.on('unsubscribe:market', (pair: string) => {
        const subscription = this.userSubscriptions.get(socketId);
        if (subscription) {
          subscription.subscriptions.delete(`market:${pair}`);
          socket.leave(`market:${pair}`);
          this.stopMarketDataStream(pair);
        }
      });

      // Handle bot updates subscription
      socket.on('subscribe:bot', (botId: number) => {
        const subscription = this.userSubscriptions.get(socketId);
        if (subscription) {
          subscription.subscriptions.add(`bot:${botId}`);
          socket.join(`bot:${botId}`);
          this.startBotUpdateStream(botId);
        }
      });

      socket.on('unsubscribe:bot', (botId: number) => {
        const subscription = this.userSubscriptions.get(socketId);
        if (subscription) {
          subscription.subscriptions.delete(`bot:${botId}`);
          socket.leave(`bot:${botId}`);
          this.stopBotUpdateStream(botId);
        }
      });

      // Handle order book subscriptions
      socket.on('subscribe:orderbook', (pair: string) => {
        const subscription = this.userSubscriptions.get(socketId);
        if (subscription) {
          subscription.subscriptions.add(`orderbook:${pair}`);
          socket.join(`orderbook:${pair}`);
          this.startOrderBookStream(pair);
        }
      });

      socket.on('unsubscribe:orderbook', (pair: string) => {
        const subscription = this.userSubscriptions.get(socketId);
        if (subscription) {
          subscription.subscriptions.delete(`orderbook:${pair}`);
          socket.leave(`orderbook:${pair}`);
          this.stopOrderBookStream(pair);
        }
      });

      // Handle portfolio updates
      socket.on('subscribe:portfolio', () => {
        socket.join(`portfolio:${userId}`);
        this.startPortfolioUpdateStream(userId);
      });

      socket.on('unsubscribe:portfolio', () => {
        socket.leave(`portfolio:${userId}`);
        this.stopPortfolioUpdateStream(userId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.userSubscriptions.delete(socketId);
      });
    });
  }

  private startMarketDataStream(pair: string): void {
    if (this.marketDataIntervals.has(pair)) {
      return;
    }

    const interval = setInterval(() => {
      const marketData = this.generateMockMarketData(pair);
      this.io.to(`market:${pair}`).emit('market:update', marketData);
    }, 1000); // Update every second

    this.marketDataIntervals.set(pair, interval);
  }

  private stopMarketDataStream(pair: string): void {
    const interval = this.marketDataIntervals.get(pair);
    if (interval) {
      clearInterval(interval);
      this.marketDataIntervals.delete(pair);
    }
  }

  private startBotUpdateStream(botId: number): void {
    if (this.botUpdateIntervals.has(`bot:${botId}`)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const bot = await db.query.bots.findFirst({
          where: eq(bots.id, botId),
        });

        if (bot) {
          const botUpdate = this.generateMockBotUpdate(botId);
          this.io.to(`bot:${botId}`).emit('bot:update', botUpdate);
        }
      } catch (error) {
        console.error(`Error fetching bot ${botId}:`, error);
      }
    }, 2000); // Update every 2 seconds

    this.botUpdateIntervals.set(`bot:${botId}`, interval);
  }

  private stopBotUpdateStream(botId: number): void {
    const interval = this.botUpdateIntervals.get(`bot:${botId}`);
    if (interval) {
      clearInterval(interval);
      this.botUpdateIntervals.delete(`bot:${botId}`);
    }
  }

  private startOrderBookStream(pair: string): void {
    if (this.marketDataIntervals.has(`orderbook:${pair}`)) {
      return;
    }

    const interval = setInterval(() => {
      const orderBookData = this.generateMockOrderBook(pair);
      this.io.to(`orderbook:${pair}`).emit('orderbook:update', orderBookData);
    }, 500); // Update every 500ms

    this.marketDataIntervals.set(`orderbook:${pair}`, interval);
  }

  private stopOrderBookStream(pair: string): void {
    const interval = this.marketDataIntervals.get(`orderbook:${pair}`);
    if (interval) {
      clearInterval(interval);
      this.marketDataIntervals.delete(`orderbook:${pair}`);
    }
  }

  private startPortfolioUpdateStream(userId: number): void {
    if (this.botUpdateIntervals.has(`portfolio:${userId}`)) {
      return;
    }

    const interval = setInterval(() => {
      const portfolioUpdate = this.generateMockPortfolioUpdate(userId);
      this.io.to(`portfolio:${userId}`).emit('portfolio:update', portfolioUpdate);
    }, 3000); // Update every 3 seconds

    this.botUpdateIntervals.set(`portfolio:${userId}`, interval);
  }

  private stopPortfolioUpdateStream(userId: number): void {
    const interval = this.botUpdateIntervals.get(`portfolio:${userId}`);
    if (interval) {
      clearInterval(interval);
      this.botUpdateIntervals.delete(`portfolio:${userId}`);
    }
  }

  // Mock data generators (replace with real data from APIs)
  private generateMockMarketData(pair: string): MarketDataUpdate {
    const basePrice = pair === 'BTC/USD' ? 43500 : pair === 'ETH/USD' ? 2300 : 1;
    const variation = (Math.random() - 0.5) * 100;
    const price = basePrice + variation;

    return {
      pair,
      price,
      bid: price - 5,
      ask: price + 5,
      volume24h: Math.random() * 1000000,
      change24h: (Math.random() - 0.5) * 10,
      timestamp: Date.now(),
    };
  }

  private generateMockBotUpdate(botId: number): BotUpdate {
    return {
      botId,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      equity: 50000 + Math.random() * 10000,
      profit: Math.random() * 5000,
      timestamp: Date.now(),
    };
  }

  private generateMockOrderBook(pair: string): OrderBookUpdate {
    const basePrice = pair === 'BTC/USD' ? 43500 : 2300;
    const bids = Array.from({ length: 20 }, (_, i) => ({
      price: basePrice - (i + 1) * 10,
      volume: Math.random() * 10,
    }));
    const asks = Array.from({ length: 20 }, (_, i) => ({
      price: basePrice + (i + 1) * 10,
      volume: Math.random() * 10,
    }));

    return {
      pair,
      bids,
      asks,
      timestamp: Date.now(),
    };
  }

  private generateMockPortfolioUpdate(userId: number) {
    return {
      userId,
      totalValue: 124892 + (Math.random() - 0.5) * 5000,
      dayChange: (Math.random() - 0.5) * 10000,
      dayChangePercent: (Math.random() - 0.5) * 5,
      unrealizedPnL: Math.random() * 10000,
      timestamp: Date.now(),
    };
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public broadcastToUser(userId: number, event: string, data: any): void {
    this.io.to(`portfolio:${userId}`).emit(event, data);
  }
}

export default WebSocketService;
