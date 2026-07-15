'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Intro vidéo plein écran : la vidéo prend TOUTE LA HAUTEUR de l'écran, centrée
 * (la largeur suit le ratio naturel ; débordement latéral rogné / bandes selon
 * l'écran). Lecture auto en muet (autorisée sans geste), puis fondu vers le site
 * à la fin. Même vidéo desktop & mobile.
 */
export function VideoIntro({ src, onDone }: { src: string; onDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    // Laisse le fondu se jouer avant de démonter l'overlay.
    window.setTimeout(onDone, 700);
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        /* autoplay bloqué : l'utilisateur peut passer / la vidéo reste visible */
      });
    }
    // Filet de sécurité : si la vidéo ne démarre jamais (réseau/codec), on révèle le site.
    const safety = window.setTimeout(() => {
      if ((videoRef.current?.readyState ?? 0) < 2) finish();
    }, 6000);
    return () => window.clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-ink"
      style={{ opacity: leaving ? 0 : 1, transition: 'opacity .7s ease' }}
      role="dialog"
      aria-label="Introduction"
    >
      <video
        ref={videoRef}
        src={src}
        muted
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        className="h-[100dvh] w-auto max-w-none"
        style={{ animation: 'jlFadeIn .6s ease both' }}
      />

      <button
        onClick={finish}
        className="absolute bottom-6 right-6 z-[2] rounded-full border border-panel/40 bg-ink/40 px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.14em] text-panel/90 backdrop-blur transition-colors hover:bg-ink/70"
      >
        Passer
      </button>
    </div>
  );
}
