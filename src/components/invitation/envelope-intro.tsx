'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { WaxSeal } from '@/components/ui/wax-seal';

export type IntroStage = 'sealed' | 'opening' | 'done';

/**
 * Ouverture façon enveloppe (spec §4.1).
 *
 * Deux modes :
 *  - si `videoSrc` est fourni (ex. NEXT_PUBLIC_ENVELOPE_VIDEO=/envelope.webm),
 *    on lit la vraie vidéo d'ouverture d'enveloppe, comme dans le design ;
 *  - sinon, enveloppe + cachet de cire « L ∞ J » animés en CSS/GSAP.
 *
 * Couche de progressive enhancement — le contenu du site est déjà rendu côté
 * serveur derrière l'overlay.
 */
export function EnvelopeIntro({
  stage,
  onOpen,
  onDone,
  onSkip,
  videoSrc,
}: {
  stage: IntroStage;
  onOpen: () => void;
  onDone: () => void;
  onSkip: () => void;
  videoSrc?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  // Mode vidéo : joue la vidéo à l'ouverture.
  useEffect(() => {
    if (!videoSrc || stage !== 'opening') return;
    const video = videoRef.current;
    if (video) {
      try {
        video.currentTime = 0;
        void video.play();
      } catch {
        doneRef.current();
      }
    }
  }, [stage, videoSrc]);

  // Mode CSS : timeline d'ouverture GSAP.
  useEffect(() => {
    if (videoSrc || stage !== 'opening') return;
    const flap = flapRef.current;
    const card = cardRef.current;
    const seal = sealRef.current;
    const root = rootRef.current;

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => doneRef.current(),
    });
    tl.to(seal, { scale: 1.28, opacity: 0, rotate: 10, duration: 0.45, ease: 'power2.in' });
    tl.set(flap, { zIndex: 1 }, '<0.1');
    tl.to(flap, { rotateX: -168, duration: 0.7 }, '<');
    tl.to(card, { y: '-58%', scale: 1.03, duration: 0.9, ease: 'power3.out' }, '-=0.35');
    tl.to(root, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, '+=0.7');

    return () => {
      tl.kill();
    };
  }, [stage, videoSrc]);

  if (stage === 'done') return null;

  const sealed = stage === 'sealed';

  const skipButton = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSkip();
      }}
      className="absolute right-4 top-4 z-30 rounded-full border border-line bg-panel/60 px-3.5 py-1.5 font-body text-[11px] uppercase tracking-[0.16em] text-sage transition-colors hover:text-ink"
    >
      Passer
    </button>
  );

  const tapPrompt = sealed && (
    <div
      className="absolute bottom-9 left-1/2 -translate-x-1/2"
      style={{ animation: 'jlFloat 2.4s ease-in-out infinite' }}
    >
      <span className="font-body text-[12px] uppercase tracking-[0.3em] text-olive">
        Toucher pour ouvrir
      </span>
    </div>
  );

  // ── Mode vidéo ────────────────────────────────────────────────
  if (videoSrc) {
    return (
      <div
        ref={rootRef}
        onClick={sealed ? onOpen : undefined}
        className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-bg"
        style={{ cursor: sealed ? 'pointer' : 'default', animation: 'jlFadeIn .5s ease' }}
        role={sealed ? 'button' : undefined}
        aria-label={sealed ? "Ouvrir l'invitation" : undefined}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          onEnded={() => doneRef.current()}
          className="h-full w-full object-cover"
        />
        {skipButton}
        {tapPrompt}
      </div>
    );
  }

  // ── Mode CSS (enveloppe + cachet) ─────────────────────────────
  return (
    <div
      ref={rootRef}
      onClick={sealed ? onOpen : undefined}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{ cursor: sealed ? 'pointer' : 'default', animation: 'jlFadeIn .5s ease' }}
      role={sealed ? 'button' : undefined}
      tabIndex={sealed ? 0 : undefined}
      aria-label={sealed ? "Ouvrir l'invitation" : undefined}
      onKeyDown={
        sealed
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
    >
      {skipButton}

      <span className="mb-8 font-body text-[12px] uppercase tracking-[0.3em] text-olive">
        Vous êtes invités
      </span>

      <div
        className="relative"
        style={{ width: 'min(80vw, 330px)', height: 'min(53vw, 218px)', perspective: '1100px' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(210,174,71,0.28), rgba(210,174,71,0))',
            animation: sealed ? 'jlShimmer 3s ease-in-out infinite' : 'none',
          }}
        />

        <div
          className="absolute inset-0 rounded-[10px] border border-line"
          style={{ background: '#F6EFDF', boxShadow: '0 24px 60px rgba(64,57,42,0.22)' }}
        />

        <div
          ref={cardRef}
          className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-1.5 rounded-[7px] border border-line px-4 text-center"
          style={{
            width: '84%',
            height: '150%',
            bottom: '8%',
            background: 'linear-gradient(#FFFDF7, #FBF6EA)',
            boxShadow: '0 10px 24px rgba(64,57,42,0.14)',
            zIndex: 2,
          }}
        >
          <span className="font-body text-[8px] uppercase tracking-[0.32em] text-olive">
            Invitation
          </span>
          <span className="font-display text-[30px] leading-none text-ink">
            Laura <span className="font-accent text-[0.55em] text-gold">&amp;</span> Jordan
          </span>
          <span className="mt-1 h-1.5 w-1.5 rotate-45 bg-gold" />
        </div>

        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(#F2E9D6, #EBE1CB)',
            clipPath: 'polygon(0 38%, 50% 82%, 100% 38%, 100% 100%, 0 100%)',
            borderRadius: '0 0 10px 10px',
            zIndex: 3,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(64,57,42,0.05)',
            clipPath: 'polygon(0 38%, 50% 82%, 0 100%)',
            zIndex: 3,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(64,57,42,0.05)',
            clipPath: 'polygon(100% 38%, 50% 82%, 100% 100%)',
            zIndex: 3,
          }}
        />

        <div
          ref={flapRef}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(#FBF3E2, #F1E7D1)',
            clipPath: 'polygon(0 0, 100% 0, 50% 66%)',
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            filter: 'drop-shadow(0 2px 3px rgba(64,57,42,0.10))',
            zIndex: 4,
          }}
        />

        <div
          ref={sealRef}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '44%',
            zIndex: 5,
            animation: sealed ? 'jlBreathe 2.8s ease-in-out infinite' : 'none',
          }}
        >
          <WaxSeal size={72} idSuffix="intro" />
        </div>
      </div>

      {tapPrompt}
    </div>
  );
}
