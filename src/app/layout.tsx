import type { Metadata, Viewport } from 'next';
import { Alex_Brush, EB_Garamond, JetBrains_Mono, Kaushan_Script } from 'next/font/google';
import './globals.css';

/**
 * Polices auto-hébergées via next/font (voir CLAUDE.md du projet design) :
 *  - Alex Brush     → prénoms & grands titres manuscrits
 *  - Kaushan Script → accents (« & »), en or
 *  - EB Garamond    → corps + labels en capitales espacées
 *  - JetBrains Mono → slugs / tokens du dashboard
 */
const alexBrush = Alex_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alex-brush',
  display: 'swap',
});
const kaushan = Kaushan_Script({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-kaushan',
  display: 'swap',
});
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-eb-garamond',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Laura & Jordan',
    template: '%s · Laura & Jordan',
  },
  description: "Invitation au mariage de Laura & Jordan — c'est entourés de ceux qui comptent que nous voulons dire oui.",
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#f2ede0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${alexBrush.variable} ${kaushan.variable} ${ebGaramond.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
