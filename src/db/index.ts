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

/**
 * Supabase (pooler ou connexion directe) impose le SSL. Sans ça, postgres.js
 * échoue avec « connection is insecure (try using sslmode=require) ».
 * On active `ssl:'require'` pour un hôte Supabase ; on laisse tel quel en local.
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

function createDb() {
  if (!databaseUrl) return null;
  const client =
    globalForDb._pgClient ??
    postgres(databaseUrl, {
      // `prepare:false` requis pour le pooler Supabase (mode transaction).
      prepare: false,
      // `fetch_types:false` : sur le pooler Supabase, la requête interne que
      // postgres.js émet pour découvrir les types de tableaux se désynchronise
      // du pipeline (surtout mêlée à des requêtes concurrentes) et renvoie des
      // colonnes `undefined` — d'où le crash « Cannot read properties of
      // undefined (reading 'map') » au mapping des colonnes tableau (ex.
      // `visible_moment_ids`). En le désactivant, les tableaux reviennent en
      // texte et sont parsés de façon fiable par Drizzle.
      fetch_types: false,
      ssl: sslMode(databaseUrl),
      // Serverless (Vercel) + pooler Supabase : une fonction ne sert qu'une
      // requête à la fois → 1 connexion par instance suffit. Un pool plus grand
      // ne fait qu'accumuler des connexions inactives qui, réutilisées « à
      // chaud » après le gel de la fonction, sont périmées côté pooler et
      // pendent la requête → 504 FUNCTION_INVOCATION_TIMEOUT au 2e chargement.
      max: 1,
      idle_timeout: 20, // ferme les connexions inactives
      max_lifetime: 60 * 30, // recycle les connexions (évite les sockets trop vieux)
      connect_timeout: 15, // échoue vite au lieu de rester pendu à la connexion
    });
  if (process.env.NODE_ENV !== 'production') globalForDb._pgClient = client;
  return drizzle(client, { schema });
}

export const db = createDb();
export { schema };
