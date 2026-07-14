'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { EnvelopeIntro, type IntroStage } from './envelope-intro';
import { InvitationContext } from './invitation-context';

const INTRO_SEEN_KEY = 'jl_intro_seen';

export function InvitationProvider({
  children,
  musicUrl,
  preview = false,
}: {
  children: React.ReactNode;
  musicUrl: string | null;
  preview?: boolean;
}) {
  const [stage, setStage] = useState<IntroStage>('sealed');
  const [musicOn, setMusicOn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Détermine l'état initial de l'intro (mémoire + reduced-motion).
  useEffect(() => {
    setMounted(true);
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(!!reduce);

    let seen = false;
    if (!preview) {
      try {
        seen = localStorage.getItem(INTRO_SEEN_KEY) === '1';
      } catch {
        // localStorage indisponible — on montre l'intro
      }
    }
    if (seen || reduce) setStage('done');
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

  // ── Parallaxe du hero ──────────────────────────────────────────
  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const bg = document.getElementById('hero-bg-layer');
    if (!bg) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const sy = window.scrollY || 0;
        bg.style.transform = `translateY(${sy * 0.3}px) scale(1.06)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted, reducedMotion]);

  // ── Actions ────────────────────────────────────────────────────
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
  const replayIntro = useCallback(() => {
    setStage('sealed');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current;
    setMusicOn((on) => {
      const next = !on;
      if (audio) {
        if (next) audio.play().catch(() => undefined);
        else audio.pause();
      }
      return next;
    });
  }, []);

  const scrollToRsvp = useCallback(() => {
    const target = document.getElementById('rsvp-anchor');
    if (!target) return;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -70 });
    else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  const value = useMemo(
    () => ({
      introDone,
      musicOn,
      hasMusic: Boolean(musicUrl),
      submitted,
      toggleMusic,
      replayIntro,
      scrollToRsvp,
      setSubmitted,
    }),
    [introDone, musicOn, musicUrl, submitted, toggleMusic, replayIntro, scrollToRsvp],
  );

  return (
    <InvitationContext.Provider value={value}>
      {/* Overlay d'intro — rendu seulement tant qu'elle n'est pas terminée */}
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

      {/* Bouton flottant « Répondre » (spec §4.1) */}
      {introDone && !submitted && (
        <button
          onClick={scrollToRsvp}
          className="fixed bottom-5 right-5 z-40 rounded-full border-none bg-olive px-6 py-3.5 font-body text-[13px] uppercase tracking-[0.14em] text-panel shadow-[0_10px_26px_rgba(64,57,42,0.22)] transition-colors hover:bg-ink"
          style={{ animation: 'jlFadeUp .4s ease both' }}
        >
          Répondre
        </button>
      )}

      {musicUrl && (
        <audio ref={audioRef} src={musicUrl} loop preload="none" aria-hidden />
      )}
    </InvitationContext.Provider>
  );
}
