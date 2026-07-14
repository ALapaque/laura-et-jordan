'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotifBackground } from '@/components/ui/motif-background';
import { ScallopedPanel } from '@/components/ui/scalloped-panel';
import { WaxSeal } from '@/components/ui/wax-seal';

export type IntroStage = 'sealed' | 'opening' | 'done';

/**
 * Ouverture façon enveloppe (spec §4.1) — version cinématique.
 *
 * Séquence : le cachet or « L & J » respire → au toucher il frémit, se brise
 * dans un halo doré et quelques éclats → le rabat s'ouvre en 3D → le carton
 * (mini faire-part à bord festonné) glisse hors de l'enveloppe → il s'avance
 * vers l'invité pendant qu'un long fondu révèle le site.
 *
 * Deux modes :
 *  - si `videoSrc` est fourni (NEXT_PUBLIC_ENVELOPE_VIDEO), lit la vidéo réelle ;
 *  - sinon, la séquence CSS/GSAP ci-dessus.
 *
 * Progressive enhancement : le site est déjà rendu côté serveur derrière
 * l'overlay ; `prefers-reduced-motion` saute l'intro (géré par le provider).
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
  const headerRef = useRef<HTMLDivElement>(null);
  const envWrapRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  // ── Mode vidéo : joue la vidéo réelle à l'ouverture ───────────
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

  // ── Mode CSS : timeline cinématique GSAP ──────────────────────
  useEffect(() => {
    if (videoSrc || stage !== 'opening') return;
    const root = rootRef.current;
    const header = headerRef.current;
    const envWrap = envWrapRef.current;
    const back = backRef.current;
    const front = frontRef.current;
    const flap = flapRef.current;
    const card = cardRef.current;
    const seal = sealRef.current;
    const bloom = bloomRef.current;
    const particles = particlesRef.current
      ? (Array.from(particlesRef.current.children) as HTMLElement[])
      : [];

    // stoppe le flottement CSS pour laisser la main à GSAP
    if (envWrap) envWrap.style.animation = 'none';

    const tl = gsap.timeline({ onComplete: () => doneRef.current() });

    // 1) pression tactile sur l'enveloppe
    tl.to(envWrap, { scale: 0.98, duration: 0.12, ease: 'power2.out' }, 0)
      .to(envWrap, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' }, 0.12)
      // 2) le cachet frémit… puis cède
      .to(seal, { rotate: -5, duration: 0.08, ease: 'power1.inOut' }, 0.05)
      .to(seal, { rotate: 5, duration: 0.08, ease: 'power1.inOut' }, 0.13)
      .to(seal, { scale: 1.45, opacity: 0, rotate: 14, duration: 0.42, ease: 'power2.in' }, 0.22)
      // halo doré qui éclot
      .fromTo(
        bloom,
        { scale: 0.15, opacity: 0 },
        { scale: 1, opacity: 0.95, duration: 0.4, ease: 'power2.out' },
        0.34,
      )
      .to(bloom, { scale: 2.05, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.72);

    // éclats d'or projetés
    particles.forEach((p, i) => {
      const angle = (i / Math.max(1, particles.length)) * Math.PI * 2 + (i % 2) * 0.35;
      const dist = 58 + (i % 3) * 26;
      tl.fromTo(
        p,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 18,
          opacity: 0,
          scale: 0.3,
          duration: 0.7 + (i % 3) * 0.12,
          ease: 'power2.out',
        },
        0.36 + (i % 4) * 0.02,
      );
    });

    // 3) le rabat s'ouvre en 3D
    tl.to(flap, { rotateX: -172, duration: 0.85, ease: 'power3.inOut' }, 0.52)
      .set(flap, { zIndex: 1 }, 0.94)
      // 4) le carton glisse hors de l'enveloppe (le pied reste dedans)
      .to(card, { y: '-72%', scale: 1.04, duration: 1.05, ease: 'power3.out' }, 0.9)
      // 5) un temps pour le lire… puis il s'avance vers l'invité
      .set(card, { zIndex: 7 }, 2.25)
      .to(card, { y: '-96%', scale: 2.05, duration: 1.05, ease: 'power3.in' }, 2.3)
      .to([back, front, flap], { opacity: 0, y: 28, duration: 0.6, ease: 'power2.in' }, 2.35)
      .to(header, { opacity: 0, duration: 0.4 }, 2.35)
      // 6) …et le long fondu révèle le site
      .to(root, { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, 2.75);

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
      className="absolute right-4 top-4 z-30 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 font-body text-[11px] uppercase tracking-[0.16em] text-sage backdrop-blur-sm transition-colors hover:text-ink"
    >
      Passer
    </button>
  );

  const tapPrompt = sealed && (
    <div
      className="absolute bottom-9 left-1/2 z-[2] -translate-x-1/2"
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

  // ── Mode CSS : enveloppe + cachet or ──────────────────────────
  return (
    <div
      ref={rootRef}
      onClick={sealed ? onOpen : undefined}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{ cursor: sealed ? 'pointer' : 'default', animation: 'jlFadeIn .6s ease' }}
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
      {/* Toile de Jouy derrière l'enveloppe, voilée pour la mettre en valeur */}
      <MotifBackground size="560px" className="opacity-80" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, rgba(242,237,224,0.1) 0%, rgba(242,237,224,0.78) 74%)',
        }}
      />

      {skipButton}

      <div ref={headerRef} className="relative z-[2] mb-9 flex flex-col items-center gap-3.5">
        <span className="font-body text-[12px] font-medium uppercase tracking-[0.34em] text-ink">
          Vous êtes invités
        </span>
        <span className="h-[7px] w-[7px] rotate-45 bg-gold" />
      </div>

      {/* Enveloppe */}
      <div
        ref={envWrapRef}
        className="relative z-[2]"
        style={{
          width: 'min(86vw, 356px)',
          height: 'min(58.6vw, 242px)',
          perspective: '1200px',
          animation: sealed ? 'jlBob 4.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* dos */}
        <div
          ref={backRef}
          className="absolute inset-0 rounded-[12px]"
          style={{
            background: 'linear-gradient(#F7F0DE, #EFE5CD)',
            boxShadow:
              '0 34px 70px rgba(64,57,42,0.28), inset 0 0 0 1px rgba(210,174,71,0.22)',
          }}
        />
        {/* intérieur (dévoilé à l'ouverture) */}
        <div
          className="absolute rounded-[9px]"
          style={{
            inset: 5,
            background: 'linear-gradient(#EAE0C6, #F4EDDA)',
            boxShadow: 'inset 0 16px 20px rgba(64,57,42,0.14)',
            zIndex: 1,
          }}
        />

        {/* carton — mini faire-part à bord festonné.
            Au repos il tient ENTIÈREMENT dans l'enveloppe (caché derrière la
            poche et le rabat) ; il n'émerge qu'à l'ouverture. */}
        <div
          ref={cardRef}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: '84%',
            height: '90%',
            bottom: '2%',
            zIndex: 2,
            filter: 'drop-shadow(0 12px 26px rgba(64,57,42,0.2))',
          }}
        >
          <ScallopedPanel scallop={16} background="#FDFAF1" className="h-full w-full">
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="font-body text-[8px] uppercase tracking-[0.34em] text-olive">
                Invitation mariage
              </span>
              <div className="my-1 flex flex-col items-center">
                <span className="font-display text-[34px] leading-[0.95] text-ink">Laura</span>
                <span className="font-accent my-0.5 text-[17px] leading-none text-gold">&amp;</span>
                <span className="font-display text-[34px] leading-[0.95] text-ink">Jordan</span>
              </div>
              <span className="h-[6px] w-[6px] rotate-45 bg-gold" />
              <span className="font-display text-[21px] text-ink">31 · 07 · 2027</span>
            </div>
          </ScallopedPanel>
        </div>

        {/* poche avant */}
        <div ref={frontRef} className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(#F3EAD6, #EAE0C8)',
              clipPath: 'polygon(0 32%, 50% 62%, 100% 32%, 100% 100%, 0 100%)',
              borderRadius: '0 0 12px 12px',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(64,57,42,0.05)',
              clipPath: 'polygon(0 32%, 50% 62%, 0 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(64,57,42,0.05)',
              clipPath: 'polygon(100% 32%, 50% 62%, 100% 100%)',
            }}
          />
          {/* fine ligne or le long du V */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0,32 L50,62 L100,32"
              fill="none"
              stroke="#D2AE47"
              strokeOpacity="0.4"
              strokeWidth="0.7"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* rabat */}
        <div
          ref={flapRef}
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(#FBF4E3, #F0E6CF)',
            clipPath: 'polygon(0 0, 100% 0, 50% 66%)',
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            filter: 'drop-shadow(0 3px 4px rgba(64,57,42,0.14))',
            zIndex: 4,
          }}
        >
          {/* texture toile très discrète sur le rabat */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/motif.jpg)',
              backgroundSize: '330px',
              mixBlendMode: 'multiply',
              opacity: 0.12,
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0,0 L50,66 L100,0"
              fill="none"
              stroke="#D2AE47"
              strokeOpacity="0.45"
              strokeWidth="0.7"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* cachet or L & J */}
        <div
          ref={sealRef}
          className="absolute left-1/2 top-[66%] -translate-x-1/2 -translate-y-1/2"
          style={{ zIndex: 5 }}
        >
          <div style={{ animation: sealed ? 'jlBreathe 2.8s ease-in-out infinite' : 'none' }}>
            <WaxSeal size={88} idSuffix="intro" sheen={sealed} />
          </div>
        </div>

        {/* halo doré (éclosion au bris du cachet) */}
        <div
          ref={bloomRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 250,
            height: 250,
            zIndex: 6,
            opacity: 0,
            background:
              'radial-gradient(circle, rgba(247,232,180,0.95) 0%, rgba(210,174,71,0.45) 42%, rgba(210,174,71,0) 70%)',
          }}
        />

        {/* éclats d'or */}
        <div
          ref={particlesRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[66%]"
          style={{ zIndex: 6 }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                width: i % 3 === 0 ? 7 : 5,
                height: i % 3 === 0 ? 7 : 5,
                marginLeft: -3,
                marginTop: -3,
                opacity: 0,
                borderRadius: i % 2 === 0 ? '50%' : 0,
                transform: i % 2 === 0 ? undefined : 'rotate(45deg)',
                background: ['#D2AE47', '#EFD370', '#FFF2C9'][i % 3],
              }}
            />
          ))}
        </div>
      </div>

      {tapPrompt}
    </div>
  );
}
