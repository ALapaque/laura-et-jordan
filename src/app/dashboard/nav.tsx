'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const TABS = [
  { href: '/dashboard', label: "Vue d'ensemble" },
  { href: '/dashboard/links', label: 'Liens & parcours' },
  { href: '/dashboard/rsvp', label: 'RSVP' },
  { href: '/dashboard/content', label: 'Contenu' },
  { href: '/dashboard/moments', label: 'Moments' },
  { href: '/dashboard/gallery', label: 'Galerie' },
  { href: '/dashboard/settings', label: 'Paramètres' },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar mb-8 mt-6 flex gap-1.5 overflow-x-auto border-b border-line">
      {TABS.map((tab) => {
        const active = tab.href === '/dashboard' ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-3 font-body text-[14px] tracking-[0.01em] transition-colors',
              active ? 'border-gold text-ink' : 'border-transparent text-sage hover:text-ink',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
