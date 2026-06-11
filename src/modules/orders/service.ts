import { OrderRepository } from './repository';
import { CreateOrderInput, UpdateOrderInput } from './types';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';
import { Order } from '@prisma/client';

export class OrderService {
  private repository: OrderRepository;

  constructor(repository?: OrderRepository) {
    this.repository = repository || new OrderRepository();
  }

  async getAllOrders(): Promise<Order[]> {
    logger.info('Fetching all orders');
    return this.repository.findAll();
  }

  async getOrderById(id: number): Promise<Order> {
    logger.info(`Fetching order with id: ${id}`);
    const order = await this.repository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }

  async createOrder(data: CreateOrderInput): Promise<Order> {
    logger.info('Creating new order', { customer: data.customer_name, product: data.product_name });
    return this.repository.create(data);
  }

  async updateOrder(id: number, data: UpdateOrderInput): Promise<Order> {
    logger.info(`Updating order with id: ${id}`, data);
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Order not found', 404);
    }
    return this.repository.update(id, data);
  }

  async deleteOrder(id: number): Promise<Order> {
    logger.info(`Deleting order with id: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Order not found', 404);
    }
    return this.repository.delete(id);
  }
}
