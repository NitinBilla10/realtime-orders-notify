import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../config/logger';
import { env } from '../config/env';

let io: SocketIOServer;
let activeClients = 0;

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket: Socket) => {
    activeClients++;
    logger.info(`🔌 Client connected: ${socket.id} | Active clients: ${activeClients}`);

    socket.emit('welcome', {
      message: 'Connected to Real-Time Orders Notification System',
      clientId: socket.id,
      activeClients,
    });

    socket.on('disconnect', (reason: string) => {
      activeClients--;
      logger.info(`❌ Client disconnected: ${socket.id} | Reason: ${reason} | Active clients: ${activeClients}`);
    });

    socket.on('error', (error: Error) => {
      logger.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeWebSocket first.');
  }
  return io;
}

export function getActiveClients(): number {
  return activeClients;
}

export function broadcastOrderUpdate(payload: any): void {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot broadcast');
    return;
  }
  logger.info(`📡 Broadcasting order update: ${payload.event} on record ${payload.recordId}`);
  io.emit('order-update', payload);
}
