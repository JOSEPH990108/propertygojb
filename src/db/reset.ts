// src\db\reset.ts
import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';

// 1. Load environment variables correctly
const projectDir = process.cwd();
loadEnvConfig(projectDir);

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not set. Check .env.local');
}

const client = postgres(process.env.DATABASE_URL);

async function reset() {
  console.log('🧨 Destroying database schema...');
  
  try {
    // Drop the public schema and recreate it (Wipes everything)
    await client`DROP SCHEMA IF EXISTS public CASCADE`;
    await client`CREATE SCHEMA public`;
    
    // Restore default permissions
    await client`GRANT ALL ON SCHEMA public TO public`;
    await client`GRANT ALL ON SCHEMA public TO current_user`;

    console.log('✅ Database wiped clean.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset Failed:', error);
    process.exit(1);
  }
}

reset();