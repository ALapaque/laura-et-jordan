'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { shortDate } from '@/lib/format';
import type { Attending, RsvpResponse } from '@/lib/types';

type Filter = 'all' | Attending;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'yes', label: 'Présents' },
  { id: 'maybe', label: 'Peut-être' },
  { id: 'no', label: 'Absents' },
];

export function RsvpTable({
  responses,
  momentTitles,
}: {
  responses: RsvpResponse[];
  momentTitles: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return responses.filter((r) => {
      if (filter !== 'all' && r.attending !== filter) return false;
      if (q && !`${r.guestName} ${r.parcoursName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [responses, filter, query]);

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'rounded-full border px-3.5 py-2 font-body text-[13px] transition-colors',
                  on ? 'border-gold bg-accent-soft text-ink' : 'border-line bg-transparent text-muted',
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="rounded-lg border border-line bg-surface px-3 py-2 font-body text-[13px] text-ink outline-none focus:border-olive"
          />
          <a
            href="/api/rsvp/export"
            className="rounded-lg border border-line bg-transparent px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
          >
            Exporter CSV
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        <div className="grid grid-cols-[1.6fr_1.4fr_0.7fr_1fr] gap-2.5 bg-bg px-[18px] py-3 font-body text-[10px] uppercase tracking-[0.1em] text-sage">
          <span>Invité</span>
          <span>Parcours</span>
          <span>Pers.</span>
          <span>Statut</span>
        </div>
        {rows.length === 0 && (
          <p className="p-6 text-center font-body text-[14px] italic text-muted">
            Aucune réponse ne correspond.
          </p>
        )}
        {rows.map((r) => {
          const open = openId === r.id;
          const attended = Object.entries(r.perMoment)
            .filter(([, v]) => v)
            .map(([id]) => momentTitles[id] ?? id);
          return (
            <div key={r.id} className="border-b border-line last:border-0">
              <button
                onClick={() => setOpenId(open ? null : r.id)}
                className="grid w-full grid-cols-[1.6fr_1.4fr_0.7fr_1fr] items-center gap-2.5 px-[18px] py-3.5 text-left font-body text-[15px] text-ink transition-colors hover:bg-panel/40"
              >
                <span className="truncate">{r.guestName || 'Invité·e'}</span>
                <span className="truncate text-[13px] text-muted">{r.parcoursName}</span>
                <span>{r.headcount}</span>
                <span>
                  <StatusBadge status={r.attending} />
                </span>
              </button>
              {open && (
                <div className="grid gap-2 bg-bg/50 px-[18px] py-3.5 font-body text-[14px] text-muted">
                  <DetailRow label="Date de réponse" value={shortDate(r.createdAt)} />
                  {attended.length > 0 && (
                    <DetailRow label="Moments" value={attended.join(' · ')} />
                  )}
                  {r.dietary && <DetailRow label="Régime / allergies" value={r.dietary} />}
                  {r.message && <DetailRow label="Petit mot" value={`« ${r.message} »`} />}
                  {!r.dietary && !r.message && attended.length === 0 && (
                    <span className="italic">Aucun détail supplémentaire.</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-40 flex-none text-[12px] uppercase tracking-[0.08em] text-sage">
        {label}
      </span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
