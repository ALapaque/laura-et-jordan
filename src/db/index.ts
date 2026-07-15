/**
 * Accès aux données : voir `src/lib/queries.ts` (API HTTP Supabase / PostgREST,
 * sans état). Ce module ne garde plus qu'un enrobage léger, `withDbRetry`,
 * conservé pour ne pas toucher les nombreux sites d'appel (pages SSR, routes
 * `/api/*`).
 *
 * Plus de client Postgres TCP ici : le HTTP est sans état, donc il n'y a plus
 * de socket périmé après le « gel » d'une instance serverless à recréer, ni de
 * timeout artificiel à armer (c'est ce timeout qui jetait `db-timeout` et
 * cassait la page). On se contente d'un unique nouvel essai en cas d'aléa
 * réseau ponctuel.
 */
export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}
