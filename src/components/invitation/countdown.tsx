'use client';

import { useSyncExternalStore } from 'react';

// Horloge partagée : un seul setInterval alimente tous les abonnés.
// `useSyncExternalStore` gère proprement le SSR (getServerSnapshot) → aucun
// décalage d'hydratation, et pas de setState dans un effet.
let clock = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (timer === null) {
    clock = Date.now(); // valeur immédiate → React la relit juste après subscribe
    timer = setInterval(() => {
      clock = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const getSnapshot = () => clock; // client : temps courant (rafraîchi chaque seconde)
const getServerSnapshot = () => 0; // SSR : 0 → gabarit « — » (identique à la 1re hydratation)

function parts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    over: diff === 0,
  };
}

export function Countdown({ date, locale = 'fr' }: { date: string; locale?: 'fr' | 'nl' }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;

  const p = now ? parts(target, now) : null; // now === 0 (SSR) → gabarit

  const labels =
    locale === 'nl'
      ? ['dagen', 'uren', 'minuten', 'seconden']
      : ['jours', 'heures', 'minutes', 'secondes'];

  if (p?.over) {
    return (
      <section data-rev="init" className="px-8 py-[64px] text-center">
        <div className="mx-auto mb-5 h-[9px] w-[9px] rotate-45 bg-gold" />
        <p className="font-display text-[clamp(46px,13vw,64px)] leading-none text-ink">
          C'est le grand jour !
        </p>
      </section>
    );
  }

  const values = [p?.days, p?.hours, p?.minutes, p?.seconds];

  return (
    <section data-rev="init" className="px-6 py-[64px] text-center">
      <span className="font-body text-[12px] uppercase tracking-[0.34em] text-sage">Plus que</span>

      <div className="mx-auto mt-7 flex max-w-[430px] items-start justify-center gap-2 sm:gap-3.5">
        {values.map((v, i) => (
          <div key={labels[i]} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center justify-center rounded-2xl border border-line bg-surface px-1 py-4 shadow-[0_8px_26px_rgba(64,57,42,0.07)]">
              <span className="font-body text-[clamp(28px,8.5vw,46px)] font-medium leading-none text-ink tabular-nums">
                {v === undefined ? '—' : i === 0 ? String(v) : String(v).padStart(2, '0')}
              </span>
            </div>
            <span className="mt-2.5 font-body text-[9.5px] uppercase tracking-[0.14em] text-sage">
              {labels[i]}
            </span>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-9 h-[9px] w-[9px] rotate-45 bg-gold" />
      <p className="mt-4 font-body text-[15px] italic text-sage">avant le grand jour</p>
    </section>
  );
}
