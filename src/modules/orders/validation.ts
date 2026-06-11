import { z } from 'zod';

export const createOrderSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name must be less than 255 characters'),
  product_name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  status: z.enum(['pending', 'shipped', 'delivered']).optional().default('pending'),
});

export const updateOrderSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name must be less than 255 characters')
    .optional(),
  product_name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .optional(),
  status: z.enum(['pending', 'shipped', 'delivered']).optional(),
});

export const orderIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});
