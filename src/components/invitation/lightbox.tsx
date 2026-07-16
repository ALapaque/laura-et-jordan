'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Lightbox / zoom pour TOUTES les photos du site.
 *
 * Monté une seule fois (dans `InvitationProvider`). Par délégation, il écoute les
 * clics (et Entrée/Espace) sur n'importe quelle image marquée `data-zoomable`
 * (posée par `ImageSlot zoomable`). Au clic, il collecte toutes les images
 * zoomables dans l'ordre du DOM et ouvre un overlay plein écran avec navigation
 * précédent/suivant, fermeture (×, clic hors image, Échap) et verrou de scroll.
 */
type Item = { src: string; alt: string };

export function Lightbox() {
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const open = items.length > 0;

  const close = useCallback(() => setItems([]), []);

  // Ouverture : délégation des clics / clavier sur les images zoomables.
  useEffect(() => {
    function openFrom(target: HTMLImageElement) {
      const all = Array.from(
        document.querySelectorAll<HTMLImageElement>('img[data-zoomable]'),
      ).filter((el) => el.currentSrc || el.src);
      if (all.length === 0) return;
      const list = all.map((el) => ({ src: el.currentSrc || el.src, alt: el.alt || '' }));
      const start = all.indexOf(target);
      setItems(list);
      setIndex(start < 0 ? 0 : start);
    }
    function onClick(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest?.(
        'img[data-zoomable]',
      ) as HTMLImageElement | null;
      if (!el) return;
      e.preventDefault();
      openFrom(el);
    }
    function onKeyDown(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (!el?.matches?.('img[data-zoomable]')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFrom(el as HTMLImageElement);
      }
    }
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Navigation clavier + verrou de scroll pendant l'ouverture.
  useEffect(() => {
    if (!open) return;
    const count = items.length;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
      else if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, items.length, close]);

  if (!open) return null;
  const current = items[index]!;
  const count = items.length;
  const many = count > 1;
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo en grand"
      onClick={close}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm"
      style={{ animation: 'jlFadeIn .2s ease both' }}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fermer"
        className="absolute right-4 top-4 z-[2] flex h-11 w-11 items-center justify-center rounded-full border border-panel/40 bg-ink/40 text-[22px] leading-none text-panel transition-colors hover:bg-ink/70"
      >
        ×
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current.src}
        alt={current.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[86vh] max-w-[92vw] rounded-[10px] object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      />

      {many && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-panel/40 bg-ink/40 text-[26px] leading-none text-panel transition-colors hover:bg-ink/70"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-panel/40 bg-ink/40 text-[26px] leading-none text-panel transition-colors hover:bg-ink/70"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/50 px-3 py-1 font-body text-[12px] tracking-[0.1em] text-panel/90">
            {index + 1} / {count}
          </div>
        </>
      )}
    </div>
  );
}
