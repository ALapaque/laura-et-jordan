import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

/** True quand une base Postgres est configurée ; sinon l'app tourne en démo. */
export const hasDatabase = Boolean(databaseUrl);

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;
type PgClient = ReturnType<typeof postgres>;

/**
 * Supabase (pooler ou connexion directe) impose le SSL. Sans ça, postgres.js
 * échoue avec « connection is insecure (try using sslmode=require) ».
 */
function sslMode(url: string): 'require' | undefined {
  try {
    if (/sslmode=require/i.test(url)) return 'require';
    const host = new URL(url).hostname;
    if (host.includes('supabase') || host.includes('pooler')) return 'require';
  } catch {
    // URL malformée — laisser postgres.js gérer
  }
  return undefined;
}

function makeClient(url: string): PgClient {
  return postgres(url, {
    // `prepare:false` requis pour le pooler Supabase (mode transaction).
    prepare: false,
    // `fetch_types:false` : évite la requête interne de découverte de types qui
    // se désynchronise du pipeline via le pooler (colonnes tableau `undefined`).
    fetch_types: false,
    ssl: sslMode(url),
    max: 3,
    idle_timeout: 20, // ferme les connexions inactives
    max_lifetime: 60 * 30, // recycle les connexions
    connect_timeout: 15, // échoue vite au lieu de rester pendu à la connexion
  });
}

// Client réutilisé entre les rechargements HMR en développement.
const globalForDb = globalThis as unknown as {
  _pgHolder?: { client: PgClient; db: DrizzleClient };
};

function build(): { client: PgClient; db: DrizzleClient } {
  const client = makeClient(databaseUrl!);
  return { client, db: drizzle(client, { schema }) };
}

let holder: { client: PgClient; db: DrizzleClient } | null = databaseUrl
  ? (globalForDb._pgHolder ?? build())
  : null;
if (databaseUrl && process.env.NODE_ENV !== 'production') globalForDb._pgHolder = holder!;

/**
 * `db` est un proxy vers l'instance Drizzle *courante*. On peut ainsi recréer le
 * pool (voir `resetDbPool`) sans que les nombreux imports de `db` deviennent
 * périmés : le proxy suit toujours le client vivant. `null` en mode démo.
 */
export const db: DrizzleClient | null = databaseUrl
  ? (new Proxy(
      {},
      {
        get(_t, prop) {
          const inst = holder!.db as unknown as Record<string | symbol, unknown>;
          const val = inst[prop];
          return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(inst) : val;
        },
      },
    ) as unknown as DrizzleClient)
  : null;

/**
 * Recrée le pool de connexions. Utile en serverless : après le « gel » de
 * l'instance Vercel, la connexion au pooler Supabase est périmée et une requête
 * réutilisée reste pendue (→ 504 au 2e chargement). On jette l'ancien client et
 * on en refait un neuf ; le prochain accès rouvre une connexion saine.
 */
let resetting: Promise<void> | null = null;
export function resetDbPool(): Promise<void> {
  if (!databaseUrl) return Promise.resolve();
  if (resetting) return resetting; // des accès concurrents partagent le même reset
  const old = holder;
  resetting = (async () => {
    if (holder === old) {
      holder = build();
      if (process.env.NODE_ENV !== 'production') globalForDb._pgHolder = holder;
      // Ferme l'ancien client en arrière-plan (ne bloque pas la requête en cours).
      if (old?.client) void old.client.end({ timeout: 2 }).catch(() => {});
    }
  })().finally(() => {
    resetting = null;
  });
  return resetting;
}

function raceTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('db-timeout')), ms);
  });
  return Promise.race([p.finally(() => clearTimeout(timer)), timeout]);
}

/**
 * Exécute un accès base avec garde-fou serverless : si la requête pend (connexion
 * périmée après un gel) ou échoue, on recrée le pool et on réessaie UNE fois sur
 * une connexion fraîche. Empêche les blocages de 300 s et « auto-répare ».
 * En mode démo (`db === null`), exécute simplement `fn`.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, timeoutMs = 7000): Promise<T> {
  if (!db) return fn();
  try {
    return await raceTimeout(fn(), timeoutMs);
  } catch {
    await resetDbPool();
    return await raceTimeout(fn(), timeoutMs);
  }
}

export { schema };
