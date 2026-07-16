'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { Lightbox } from './lightbox';
import { VideoIntro } from './video-intro';

const INTRO_VIDEO_MP4 = process.env.NEXT_PUBLIC_INTRO_VIDEO || '/intro.mp4';
const INTRO_VIDEO_WEBM = process.env.NEXT_PUBLIC_INTRO_VIDEO_WEBM || '/intro.webm';
// 1re image de la vidéo (enveloppe + sceau) affichée avant le clic.
const INTRO_POSTER = process.env.NEXT_PUBLIC_INTRO_POSTER || '/intro-poster.jpg';

export function InvitationProvider({
  children,
  preview = false,
}: {
  children: React.ReactNode;
  preview?: boolean;
}) {
  const [stage, setStage] = useState<'intro' | 'done'>('intro');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [atRsvp, setAtRsvp] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // État initial : l'intro se rejoue à CHAQUE chargement (un bouton « Passer »
  // permet de la sauter). On ne la saute d'emblée que si l'utilisateur a activé
  // « mouvement réduit » (accessibilité) ou en aperçu dashboard.
  useEffect(() => {
    setMounted(true);
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(!!reduce);
    if (reduce || preview) setStage('done');
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
  const onIntroDone = useCallback(() => {
    setStage('done');
  }, []);

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
        <VideoIntro
          webmSrc={INTRO_VIDEO_WEBM}
          mp4Src={INTRO_VIDEO_MP4}
          posterSrc={INTRO_POSTER}
          onDone={onIntroDone}
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

      {/* Zoom au clic sur toutes les photos du site (délégation). */}
      <Lightbox />
    </>
  );
}
