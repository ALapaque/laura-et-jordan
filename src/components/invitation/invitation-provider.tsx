'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { EnvelopeIntro, type IntroStage } from './envelope-intro';

const INTRO_SEEN_KEY = 'jl_intro_seen';

export function InvitationProvider({
  children,
  preview = false,
}: {
  children: React.ReactNode;
  preview?: boolean;
}) {
  const [stage, setStage] = useState<IntroStage>('sealed');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [atRsvp, setAtRsvp] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // Détermine l'état initial (mémoire intro + reduced-motion).
  useEffect(() => {
    setMounted(true);
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(!!reduce);

    if (!preview) {
      try {
        if (localStorage.getItem(INTRO_SEEN_KEY) === '1' || reduce) setStage('done');
      } catch {
        // localStorage indisponible
      }
    } else if (reduce) {
      setStage('done');
    }
  }, [preview]);

  const saveSeen = useCallback(() => {
    if (preview) return;
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // ignore
    }
  }, [preview]);

  const introDone = stage === 'done';

  // ── Lenis : scroll fluide (sauf reduced-motion) ────────────────
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [mounted, reducedMotion]);

  // ── Verrou de scroll pendant l'intro ───────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const locked = !introDone;
    document.body.style.overflow = locked ? 'hidden' : '';
    if (locked) lenisRef.current?.stop();
    else lenisRef.current?.start();
    return () => {
      document.body.style.overflow = '';
    };
  }, [introDone, mounted]);

  // ── Apparitions au scroll (progressive enhancement) ────────────
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-rev]'));
    els.forEach((el) => {
      if (el.dataset.rev !== 'shown') el.dataset.rev = 'hidden';
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.rev = 'shown';
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mounted, reducedMotion]);

  // ── Détecte l'arrivée sur la section RSVP (bascule le bouton flottant) ──
  useEffect(() => {
    if (!mounted) return;
    const target = document.getElementById('rsvp-anchor');
    if (!target) return;
    const io = new IntersectionObserver(
      (entries) => setAtRsvp(entries[0]?.isIntersecting ?? false),
      { rootMargin: '0px 0px -25% 0px', threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [mounted]);

  // ── Actions intro ──────────────────────────────────────────────
  const openEnvelope = useCallback(() => {
    setStage((s) => (s === 'sealed' ? 'opening' : s));
  }, []);
  const onIntroDone = useCallback(() => {
    setStage('done');
    saveSeen();
  }, [saveSeen]);
  const skipIntro = useCallback(() => {
    setStage('done');
    saveSeen();
  }, [saveSeen]);

  // ── Navigation ─────────────────────────────────────────────────
  const scrollToRsvp = useCallback(() => {
    const target = document.getElementById('rsvp-anchor');
    if (!target) return;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -70 });
    else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  const scrollToTop = useCallback(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  return (
    <>
      {mounted && stage !== 'done' && (
        <EnvelopeIntro
          stage={stage}
          onOpen={openEnvelope}
          onDone={onIntroDone}
          onSkip={skipIntro}
          videoSrc={process.env.NEXT_PUBLIC_ENVELOPE_VIDEO || undefined}
        />
      )}

      {children}

      {/* Bouton flottant : « Répondre » puis « Haut » une fois à la section RSVP */}
      {introDone && (
        <button
          onClick={atRsvp ? scrollToTop : scrollToRsvp}
          aria-label={atRsvp ? 'Remonter en haut de la page' : 'Aller à la réponse'}
          className="fixed bottom-5 right-5 z-40 rounded-full border-none bg-olive px-6 py-3.5 font-body text-[13px] uppercase tracking-[0.14em] text-panel shadow-[0_10px_26px_rgba(64,57,42,0.22)] transition-colors hover:bg-ink"
          style={{ animation: 'jlFadeUp .4s ease both' }}
        >
          {atRsvp ? '↑ Haut' : 'Répondre'}
        </button>
      )}
    </>
  );
}
