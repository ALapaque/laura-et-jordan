'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { deleteParcoursAction } from '@/app/dashboard/links/actions';

interface ParcoursView {
  id: string;
  name: string;
  token: string;
  responses: number;
  momentsLabel: string;
}

export function LinksManager({
  parcours,
  siteUrl,
}: {
  parcours: ParcoursView[];
  siteUrl: string;
}) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  function copy(token: string) {
    const url = `${base}/i/${token}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken((t) => (t === token ? null : t)), 1600);
  }

  function remove(id: string) {
    if (!confirm('Supprimer ce parcours et ses réponses ?')) return;
    startTransition(() => deleteParcoursAction(id));
  }

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-body text-[15px] italic text-muted">
          Chaque invité reçoit un lien qui n'affiche que ses moments et son formulaire.
        </p>
        {/* text-panel! : la règle globale `a { color: olive }` (non layerisée) bat sinon
            l'utilitaire de couleur → texte olive sur fond olive = invisible. */}
        <Link
          href="/dashboard/links/new"
          className="rounded-[9px] border-none bg-olive px-5 py-2.5 font-body text-[13px] uppercase tracking-[0.12em] text-panel! transition-colors hover:bg-ink"
        >
          + Nouveau parcours
        </Link>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {parcours.length === 0 && (
          <p className="p-6 text-center font-body text-[14px] italic text-muted">
            Aucun parcours. Créez le premier lien pour vos invités.
          </p>
        )}
        {parcours.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3.5 border-b border-line px-5 py-[18px] last:border-0"
          >
            <div className="min-w-[180px] flex-1">
              <div className="font-body text-[18px] text-ink">{p.name}</div>
              <div className="mt-1 font-body text-[13px] text-muted">{p.momentsLabel}</div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <div className="font-body text-[22px] text-olive">{p.responses}</div>
                <div className="font-body text-[9px] uppercase tracking-[0.1em] text-sage">
                  réponses
                </div>
              </div>
              <div className="rounded-[7px] border border-line bg-bg px-2.5 py-1.5 font-mono text-[12px] text-sage">
                /i/{p.token}
              </div>
              <button
                onClick={() => copy(p.token)}
                className={clsx(
                  'rounded-[7px] border px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.1em] transition-colors',
                  copiedToken === p.token
                    ? 'border-gold bg-accent-soft text-[#5b5316]'
                    : 'border-line bg-transparent text-olive hover:bg-panel',
                )}
              >
                {copiedToken === p.token ? 'Copié ✓' : 'Copier'}
              </button>
              <Link
                href={`/dashboard/links/${p.id}`}
                className="rounded-[7px] border border-line px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
              >
                Éditer
              </Link>
              <a
                href={`${base}/i/${p.token}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-[7px] border border-line px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
              >
                Ouvrir
              </a>
              <button
                onClick={() => remove(p.id)}
                disabled={pending}
                className="font-body text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-[#9a3b2e] disabled:opacity-50"
              >
                Suppr.
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
