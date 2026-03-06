// Prisma Client singleton for database access
// Uses adapter pattern for Prisma 7.x with better-sqlite3

import { PrismaClient } from '@/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Get the database path (database is in root directory as per prisma config)
const dbPath = path.join(process.cwd(), 'dev.db');

// PrismaClient singleton pattern for Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Create Prisma adapter with file URL configuration
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
