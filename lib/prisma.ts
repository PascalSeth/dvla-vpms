import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const SCHEMA_VERSION = "2026_09_10_supervisor_autobadge_v4";
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
  schemaVersion?: string;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

// Handle idle client errors gracefully so stale connections are safely discarded
pool.on("error", (err) => {
  console.warn("PostgreSQL pool idle client reset:", err.message);
});

const adapter = new PrismaPg(pool);

const prisma =
  globalForPrisma.prisma && globalForPrisma.schemaVersion === SCHEMA_VERSION
    ? globalForPrisma.prisma
    : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
  globalForPrisma.prisma = prisma;
  globalForPrisma.schemaVersion = SCHEMA_VERSION;
}

export default prisma;
