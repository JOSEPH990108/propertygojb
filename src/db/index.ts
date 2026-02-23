// src\db\index.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | any;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Using mock DB mode.');
  db = null;
} else {
  const queryClient = postgres(process.env.DATABASE_URL);
  db = drizzle(queryClient, { schema });
}

export { db };
export * from './schema';
