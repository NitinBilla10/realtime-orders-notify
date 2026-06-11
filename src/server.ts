import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeWebSocket } from './websocket/socket';
import { PostgresListener } from './listeners/postgres-listener';

const server = http.createServer(app);
const postgresListener = new PostgresListener();

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize WebSocket
    initializeWebSocket(server);

    // Start PostgreSQL listener
    await postgresListener.start();

    // Start HTTP server
    server.listen(env.PORT, () => {
      logger.info(`\n🚀 Server running on http://localhost:${env.PORT}`);
      logger.info(`📊 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`🌐 Dashboard: http://localhost:${env.PORT}`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`🔔 PostgreSQL listener active\n`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Stop PostgreSQL listener
    await postgresListener.stop();

    // Disconnect database
    await disconnectDatabase();

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
