import { randomBytes } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Génère un token opaque base62 via `crypto` (jamais dérivé du nom).
 * 10 caractères ⇒ 62^10 ≈ 8.4e17 possibilités : non devinable.
 */
export function generateToken(length = 10): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}
