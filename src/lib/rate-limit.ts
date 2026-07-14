import { createHash } from 'node:crypto';

/**
 * Limiteur token-bucket léger en mémoire (spec §1 : suffisant en mono-instance ;
 * remplacer par @upstash/ratelimit + Redis si multi-instance un jour).
 */
interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();
let lastPrune = Date.now();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // secondes
}

export function rateLimit(
  key: string,
  { capacity = 5, refillPerSec = 0.2 }: { capacity?: number; refillPerSec?: number } = {},
): RateLimitResult {
  const now = Date.now();

  // Purge opportuniste des buckets inactifs (> 1h) pour borner la mémoire.
  if (now - lastPrune > 60_000) {
    for (const [k, b] of buckets) {
      if (now - b.updatedAt > 3_600_000) buckets.delete(k);
    }
    lastPrune = now;
  }

  const b = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsed * refillPerSec);
  b.updatedAt = now;

  if (b.tokens < 1) {
    buckets.set(key, b);
    return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / refillPerSec) };
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}

/** Extrait l'IP cliente derrière un proxy (x-forwarded-for / x-real-ip). */
export function clientIpFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? '0.0.0.0';
}

/** Hash salé de l'IP (jamais d'IP en clair — spec §3, §6). */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'dev-salt-change-me';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}
