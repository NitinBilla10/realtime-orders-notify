import { Client } from 'pg';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { broadcastOrderUpdate } from '../websocket/socket';
import { OrderNotificationPayload } from '../modules/orders/types';

export class PostgresListener {
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private isShuttingDown = false;
  private channelName = 'orders_channel';

  async start(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      this.client = new Client({
        connectionString: env.DATABASE_URL,
      });

      this.client.on('error', (err: Error) => {
        logger.error('PostgreSQL listener connection error:', err);
        this.handleDisconnect();
      });

      this.client.on('end', () => {
        if (!this.isShuttingDown) {
          logger.warn('PostgreSQL listener connection ended unexpectedly');
          this.handleDisconnect();
        }
      });

      await this.client.connect();
      await this.client.query(`LISTEN ${this.channelName}`);

      this.reconnectAttempts = 0;
      logger.info(`✅ PostgreSQL listener connected and listening on channel: ${this.channelName}`);

      this.client.on('notification', (msg) => {
        this.handleNotification(msg);
      });
    } catch (error) {
      logger.error('Failed to connect PostgreSQL listener:', error);
      this.handleDisconnect();
    }
  }

  private handleNotification(msg: { channel: string; payload?: string }): void {
    try {
      if (!msg.payload) {
        logger.warn('Received notification without payload');
        return;
      }

      logger.info(`📨 Received notification on channel ${msg.channel}`);

      const payload: OrderNotificationPayload = JSON.parse(msg.payload);

      logger.info(`📦 Event: ${payload.event} | Table: ${payload.table} | Record ID: ${payload.recordId}`);

      broadcastOrderUpdate(payload);
    } catch (error) {
      logger.error('Error processing notification:', error);
    }
  }

  private async handleDisconnect(): Promise<void> {
    if (this.isShuttingDown) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.baseDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    logger.info(`Reconnecting PostgreSQL listener in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        if (this.client) {
          try {
            await this.client.end();
          } catch {
            // Ignore cleanup errors
          }
        }
        await this.connect();
      } catch (error) {
        logger.error('Reconnection failed:', error);
      }
    }, delay);
  }

  async stop(): Promise<void> {
    this.isShuttingDown = true;
    if (this.client) {
      try {
        await this.client.query(`UNLISTEN ${this.channelName}`);
        await this.client.end();
        logger.info('PostgreSQL listener stopped');
      } catch (error) {
        logger.error('Error stopping PostgreSQL listener:', error);
      }
    }
  }
}
