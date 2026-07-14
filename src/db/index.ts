import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

/** True quand une base Postgres est configurée ; sinon l'app tourne en démo. */
export const hasDatabase = Boolean(databaseUrl);

// Réutilise le client à travers les rechargements HMR en développement.
const globalForDb = globalThis as unknown as {
  _pgClient?: ReturnType<typeof postgres>;
};

function createDb() {
  if (!databaseUrl) return null;
  const client =
    globalForDb._pgClient ??
    postgres(databaseUrl, {
      // `prepare:false` requis pour le pooler Supabase (mode transaction).
      prepare: false,
      max: 5,
      idle_timeout: 20,
    });
  if (process.env.NODE_ENV !== 'production') globalForDb._pgClient = client;
  return drizzle(client, { schema });
}

export const db = createDb();
export { schema };
