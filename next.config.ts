import type { NextConfig } from 'next';

/**
 * Security headers + CSP.
 * The Supabase origin is derived from the public URL so Storage media, the
 * Auth endpoint and realtime all pass `connect-src`/`img-src`/`media-src`.
 *
 * We use `'unsafe-inline'` for scripts/styles (Next.js App Router injects
 * inline runtime scripts and styled-jsx). A stricter nonce-based CSP can be
 * layered in `middleware.ts` later — see README "Sécurité".
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
let supabaseOrigin = '';
let supabaseHostname = '';
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl);
    supabaseOrigin = u.origin;
    supabaseHostname = u.hostname;
  }
} catch {
  // ignore malformed url — CSP falls back to the wildcard Supabase domains
}

const isDev = process.env.NODE_ENV === 'development';

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${supabaseOrigin} https://*.supabase.co`,
  `media-src 'self' blob: ${supabaseOrigin} https://*.supabase.co`,
  `font-src 'self' data:`,
  `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co`,
  // Map embeds (OpenStreetMap / Google Maps) are allowed but not required.
  `frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
]
  .join('; ')
  .replace(/\s+/g, ' ')
  .trim();

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Les uploads de photos (moments, galerie, détails pratiques) passent par des
  // Server Actions. Next.js limite leur corps à 1 Mo PAR DÉFAUT → une photo de
  // 2 Mo échouait avant même notre validation (8 Mo). On relève la limite.
  // NB : Vercel plafonne aussi le corps d'une fonction serverless (~4,5 Mo) ;
  // pour des photos plus lourdes il faudrait un upload direct vers le Storage.
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: 'https', hostname: supabaseHostname }]
      : [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
