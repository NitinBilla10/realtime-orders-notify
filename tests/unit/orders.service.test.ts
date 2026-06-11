import { OrderService } from '../../src/modules/orders/service';
import { OrderRepository } from '../../src/modules/orders/repository';
import { AppError } from '../../src/utils/app-error';

// Mock the logger
jest.mock('../../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('OrderService', () => {
  let service: OrderService;
  let mockRepository: jest.Mocked<OrderRepository>;

  const mockOrder = {
    id: 1,
    customer_name: 'John Doe',
    product_name: 'Laptop',
    status: 'pending' as const,
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new OrderService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOrders', () => {
    it('should return all orders', async () => {
      mockRepository.findAll.mockResolvedValue([mockOrder]);

      const result = await service.getAllOrders();

      expect(result).toEqual([mockOrder]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no orders', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllOrders();

      expect(result).toEqual([]);
    });
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      mockRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.getOrderById(1);

      expect(result).toEqual(mockOrder);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw AppError when order not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getOrderById(999)).rejects.toThrow(AppError);
      await expect(service.getOrderById(999)).rejects.toThrow('Order not found');
    });
  });

  describe('createOrder', () => {
    it('should create and return order', async () => {
      const input = { customer_name: 'Jane', product_name: 'Phone' };
      const created = { ...mockOrder, ...input, id: 2 };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.createOrder(input);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe('updateOrder', () => {
    it('should update and return order', async () => {
      const updateData = { status: 'shipped' as const };
      const updated = { ...mockOrder, status: 'shipped' as const };
      mockRepository.findById.mockResolvedValue(mockOrder);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.updateOrder(1, updateData);

      expect(result.status).toBe('shipped');
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw AppError when order not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateOrder(999, { status: 'shipped' })).rejects.toThrow('Order not found');
    });
  });

  describe('deleteOrder', () => {
    it('should delete order', async () => {
      mockRepository.findById.mockResolvedValue(mockOrder);
      mockRepository.delete.mockResolvedValue(mockOrder);

      const result = await service.deleteOrder(1);

      expect(result).toEqual(mockOrder);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw AppError when order not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteOrder(999)).rejects.toThrow('Order not found');
    });
  });
});
