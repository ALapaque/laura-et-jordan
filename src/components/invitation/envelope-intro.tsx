'use client';

import { useEffect, useRef, useState } from 'react';
import { MotifBackground } from '@/components/ui/motif-background';

/**
 * Intro « ouverture d'enveloppe » — entièrement dessinée en CSS/3D.
 *
 * Remplace l'ancienne intro vidéo : aucun média à télécharger (l'intro est
 * donc instantanée, même en connexion faible) et surtout chaque couleur vient
 * des jetons du site — enveloppe crème, toile de Jouy, sceau or — au lieu
 * d'une vidéo photoréaliste qui jurait avec la palette.
 *
 * Séquence au clic : le sceau se brise → le rabat s'ouvre → le carton monte →
 * fondu vers le site. « Passer » reste disponible à tout moment, et un
 * minuteur de sécurité garantit qu'on ne reste jamais bloqué sur l'intro.
 *
 * `prefers-reduced-motion` : on saute directement au site.
 */
type Stage = 'idle' | 'opening' | 'leaving';

/** Durée de la chorégraphie CSS avant d'enchaîner le fondu de sortie. */
const SEQUENCE_MS = 2900;
const FADE_MS = 700;

export function EnvelopeIntro({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('idle');
  const finishedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(window.clearTimeout);
  }, []);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timersRef.current.forEach(window.clearTimeout);
    setStage('leaving');
    timersRef.current.push(window.setTimeout(onDone, FADE_MS));
  }

  function start() {
    if (stage !== 'idle' || finishedRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      finish();
      return;
    }
    setStage('opening');
    timersRef.current.push(window.setTimeout(finish, SEQUENCE_MS));
  }

  return (
    <div
      className="jl-env fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-bg"
      data-stage={stage}
      role="dialog"
      aria-label="Introduction"
    >
      {/* Toile de Jouy très discrète en fond, comme le hero du site */}
      <MotifBackground size="520px" className="opacity-45" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(242,237,224,0.45) 0%, rgba(242,237,224,0.86) 76%)',
        }}
      />

      <button
        onClick={start}
        aria-label="Ouvrir l'invitation"
        className="group relative z-[2] flex cursor-pointer flex-col items-center gap-9 bg-transparent px-6"
        style={{ animation: 'jlFadeIn .7s ease both' }}
      >
        {/* ── L'enveloppe ───────────────────────────────────────── */}
        <span className="jl-env-scene relative block">
          <span className="jl-env-shell relative block">
            {/* Le carton, derrière le corps : il émerge par le haut */}
            <span className="jl-env-card absolute left-[7%] right-[7%] top-[9%] flex flex-col items-center justify-start gap-2 rounded-[8px] border border-line bg-surface px-3 pt-[9%] text-center">
              <span className="font-body text-[9px] uppercase tracking-[0.3em] text-sage">
                Invitation mariage
              </span>
              <span className="font-display text-[clamp(26px,7.6vw,34px)] leading-none text-ink">
                Laura <span className="font-accent text-[0.55em] text-gold">&amp;</span> Jordan
              </span>
              <span className="h-[7px] w-[7px] rotate-45 bg-gold" />
              <span className="font-body text-[10px] uppercase tracking-[0.24em] text-sage">
                31 · 07 · 2027
              </span>
            </span>

            {/* Corps de l'enveloppe */}
            <span className="jl-env-body absolute inset-0 overflow-hidden rounded-[10px] border border-line bg-panel">
              <MotifBackground size="190px" className="opacity-[0.46]" />
            </span>

            {/* Rabat triangulaire qui s'ouvre */}
            <span className="jl-env-flap absolute inset-x-0 top-0 overflow-hidden bg-panel">
              <MotifBackground size="190px" className="opacity-[0.46]" />
            </span>

            {/* Sceau de cire doré */}
            <span className="jl-env-seal absolute flex items-center justify-center rounded-full">
              <span className="font-body text-[13px] font-medium tracking-[0.06em] text-[#6b5412]">
                L<span className="font-accent mx-[1px] text-[0.8em]">&amp;</span>J
              </span>
            </span>
          </span>
        </span>

        {/* ── Invite au clic (disparaît dès l'ouverture) ─────────── */}
        <span className="jl-env-cta flex flex-col items-center gap-3.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/70 bg-surface/70 backdrop-blur-sm transition group-hover:bg-surface group-active:scale-95">
            <svg viewBox="0 0 24 24" aria-hidden className="ml-0.5 h-5 w-5 fill-gold">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="font-body text-[12px] uppercase tracking-[0.26em] text-olive">
            Ouvrir l'invitation
          </span>
        </span>
      </button>

      {/* « Passer » — toujours disponible, pour ne jamais rester bloqué */}
      <button
        onClick={finish}
        className="absolute right-5 top-5 z-[3] rounded-full border border-line bg-surface/80 px-5 py-2 font-body text-[12px] uppercase tracking-[0.14em] text-olive backdrop-blur transition-colors hover:bg-surface"
      >
        Passer
      </button>
    </div>
  );
}
