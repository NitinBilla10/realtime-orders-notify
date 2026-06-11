import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const PORT = process.env.PORT || 3000;

const envSchema = z.object({
  PORT: z.string().default(String(PORT)).transform(Number),
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
