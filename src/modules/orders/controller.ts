import { Request, Response, NextFunction } from 'express';
import { OrderService } from './service';
import { createOrderSchema, updateOrderSchema, orderIdSchema } from './validation';
import { ApiResponse } from './types';

const orderService = new OrderService();

export class OrderController {
  static async getAll(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { id } = orderIdSchema.parse(req.params);
      const order = await orderService.getOrderById(id);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const data = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(data);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { id } = orderIdSchema.parse(req.params);
      const data = updateOrderSchema.parse(req.body);
      const order = await orderService.updateOrder(id, data);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { id } = orderIdSchema.parse(req.params);
      await orderService.deleteOrder(id);
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
