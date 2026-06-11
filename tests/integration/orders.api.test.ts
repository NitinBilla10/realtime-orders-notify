import request from 'supertest';
import { app } from '../../src/app';

// Mock Prisma
jest.mock('../../src/config/database', () => {
  const orders: any[] = [];
  let nextId = 1;

  return {
    prisma: {
      order: {
        findMany: jest.fn(async () => [...orders].reverse()),
        findUnique: jest.fn(async ({ where }: any) =>
          orders.find((o) => o.id === where.id) || null
        ),
        create: jest.fn(async ({ data }: any) => {
          const order = {
            id: nextId++,
            customer_name: data.customer_name,
            product_name: data.product_name,
            status: data.status || 'pending',
            updated_at: new Date(),
          };
          orders.push(order);
          return order;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const idx = orders.findIndex((o) => o.id === where.id);
          if (idx === -1) throw { code: 'P2025' };
          orders[idx] = { ...orders[idx], ...data };
          return orders[idx];
        }),
        delete: jest.fn(async ({ where }: any) => {
          const idx = orders.findIndex((o) => o.id === where.id);
          if (idx === -1) throw { code: 'P2025' };
          const [deleted] = orders.splice(idx, 1);
          return deleted;
        }),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
    },
    connectDatabase: jest.fn(),
    disconnectDatabase: jest.fn(),
  };
});

// Mock logger
jest.mock('../../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock websocket
jest.mock('../../src/websocket/socket', () => ({
  getActiveClients: jest.fn(() => 0),
  broadcastOrderUpdate: jest.fn(),
}));

describe('Orders API', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          customer_name: 'John Doe',
          product_name: 'Laptop',
          status: 'pending',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer_name).toBe('John Doe');
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ customer_name: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/orders', () => {
    it('should return all orders', async () => {
      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app).get('/api/orders/9999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .put('/api/orders/9999')
        .send({ status: 'shipped' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app).delete('/api/orders/9999');

      expect(res.status).toBe(404);
    });
  });

  describe('404 Route', () => {
    it('should return 404 for unknown route', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Route not found');
    });
  });
});
