'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { EnvelopeIntro, type IntroStage } from './envelope-intro';
import { InvitationContext } from './invitation-context';

const INTRO_SEEN_KEY = 'jl_intro_seen';
const MUSIC_KEY = 'jl_music_choice';

type MusicChoice = 'pending' | 'on' | 'off';

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
  const [musicChoice, setMusicChoice] = useState<MusicChoice>('pending');
  const [submitted, setSubmitted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasMusic = Boolean(musicUrl);

  // Détermine l'état initial (mémoire intro + choix musique + reduced-motion).
  useEffect(() => {
    setMounted(true);
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(!!reduce);

    if (!preview) {
      try {
        if (localStorage.getItem(INTRO_SEEN_KEY) === '1' || reduce) setStage('done');
        const m = localStorage.getItem(MUSIC_KEY);
        if (m === 'on' || m === 'off') setMusicChoice(m);
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

  // ── Lecture audio (gère la politique d'autoplay) ───────────────
  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.5;
    audio.play().then(
      () => setMusicOn(true),
      () => setMusicOn(false), // bloqué par le navigateur — rejouable au 1er geste
    );
  }, []);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setMusicOn(false);
  }, []);

  const persistChoice = useCallback(
    (choice: MusicChoice) => {
      setMusicChoice(choice);
      if (preview) return;
      try {
        localStorage.setItem(MUSIC_KEY, choice);
      } catch {
        // ignore
      }
    },
    [preview],
  );

  // Visiteur qui avait déjà choisi « avec musique » : reprise au 1er geste.
  useEffect(() => {
    if (!mounted || !hasMusic || musicChoice !== 'on' || musicOn) return;
    const resume = () => {
      playAudio();
      window.removeEventListener('pointerdown', resume);
    };
    // tente tout de suite (souvent bloqué), sinon au premier geste
    playAudio();
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, [mounted, hasMusic, musicChoice, musicOn, playAudio]);

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
  const replayIntro = useCallback(() => {
    setStage('sealed');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  // ── Actions musique ────────────────────────────────────────────
  const toggleMusic = useCallback(() => {
    if (musicOn) {
      pauseAudio();
      persistChoice('off');
    } else {
      playAudio();
      persistChoice('on');
    }
  }, [musicOn, pauseAudio, playAudio, persistChoice]);

  const chooseMusic = useCallback(
    (on: boolean) => {
      if (on) playAudio();
      else pauseAudio();
      persistChoice(on ? 'on' : 'off');
    },
    [playAudio, pauseAudio, persistChoice],
  );

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
      hasMusic,
      submitted,
      toggleMusic,
      replayIntro,
      scrollToRsvp,
      setSubmitted,
    }),
    [introDone, musicOn, hasMusic, submitted, toggleMusic, replayIntro, scrollToRsvp],
  );

  const showMusicPrompt = mounted && introDone && hasMusic && musicChoice === 'pending';

  return (
    <InvitationContext.Provider value={value}>
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

      {/* Popup consentement musique (une fois, au démarrage) */}
      {showMusicPrompt && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center px-6"
          style={{ animation: 'jlFadeIn .4s ease' }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            onClick={() => chooseMusic(false)}
          />
          <div
            role="dialog"
            aria-label="Musique d'ambiance"
            className="relative w-full max-w-[340px] rounded-2xl border border-line bg-panel px-7 py-8 text-center shadow-[0_24px_60px_rgba(64,57,42,0.28)]"
            style={{ animation: 'jlFadeUp .45s ease both' }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-[22px] text-olive">
              ♪
            </div>
            <h2 className="font-display text-[30px] leading-tight text-ink">
              Une petite musique ?
            </h2>
            <p className="mx-auto mt-2 max-w-[260px] font-body text-[15px] leading-relaxed text-muted">
              Découvrez l'invitation en musique — vous pourrez la couper à tout moment.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => chooseMusic(true)}
                className="rounded-[10px] border-none bg-olive px-5 py-3 font-body text-[14px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink"
              >
                Oui, avec musique
              </button>
              <button
                onClick={() => chooseMusic(false)}
                className="rounded-[10px] border border-line bg-transparent px-5 py-3 font-body text-[13px] uppercase tracking-[0.12em] text-olive transition-colors hover:bg-surface"
              >
                Sans musique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contrôle musique persistant (mute/unmute pendant tout le scroll) */}
      {introDone && hasMusic && !showMusicPrompt && (
        <button
          onClick={toggleMusic}
          aria-label={musicOn ? 'Couper la musique' : 'Activer la musique'}
          aria-pressed={musicOn}
          className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel/90 text-[17px] text-olive shadow-[0_8px_20px_rgba(64,57,42,0.16)] backdrop-blur transition-colors hover:bg-panel"
          style={{ animation: 'jlFadeUp .4s ease both' }}
        >
          {musicOn ? '♪' : '♫'}
          {!musicOn && (
            <span className="pointer-events-none absolute h-[1.5px] w-6 rotate-45 rounded bg-olive/70" />
          )}
        </button>
      )}

      {/* Bouton flottant « Répondre » */}
      {introDone && !submitted && (
        <button
          onClick={scrollToRsvp}
          className="fixed bottom-5 right-5 z-40 rounded-full border-none bg-olive px-6 py-3.5 font-body text-[13px] uppercase tracking-[0.14em] text-panel shadow-[0_10px_26px_rgba(64,57,42,0.22)] transition-colors hover:bg-ink"
          style={{ animation: 'jlFadeUp .4s ease both' }}
        >
          Répondre
        </button>
      )}

      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="auto" aria-hidden />}
    </InvitationContext.Provider>
  );
}
