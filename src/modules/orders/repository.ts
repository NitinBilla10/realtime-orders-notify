import { prisma } from '../../config/database';
import { CreateOrderInput, UpdateOrderInput } from './types';
import { Order } from '@prisma/client';

export class OrderRepository {
  async findAll(): Promise<Order[]> {
    return prisma.order.findMany({
      orderBy: { updated_at: 'desc' },
    });
  }

  async findById(id: number): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
    });
  }

  async create(data: CreateOrderInput): Promise<Order> {
    return prisma.order.create({
      data: {
        customer_name: data.customer_name,
        product_name: data.product_name,
        status: data.status || 'pending',
      },
    });
  }

  async update(id: number, data: UpdateOrderInput): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: number): Promise<Order> {
    return prisma.order.delete({
      where: { id },
    });
  }
}
