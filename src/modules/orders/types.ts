import { OrderStatus } from '@prisma/client';

export interface OrderResponse {
  id: number;
  customer_name: string;
  product_name: string;
  status: OrderStatus;
  updated_at: Date;
}

export interface CreateOrderInput {
  customer_name: string;
  product_name: string;
  status?: OrderStatus;
}

export interface UpdateOrderInput {
  customer_name?: string;
  product_name?: string;
  status?: OrderStatus;
}

export interface OrderNotificationPayload {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: number;
  timestamp: string;
  data?: OrderResponse;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
