'use client';

import { useRef, useState } from 'react';

/**
 * Intro vidéo plein écran — DÉMARRAGE AU CLIC.
 *
 * La vidéo prend toute la HAUTEUR de l'écran, centrée (la largeur suit le ratio,
 * débordement rogné). On ne compte PAS sur l'autoplay : sur mobile il est souvent
 * bloqué, ce qui laissait la page figée sur un écran vide. Ici l'invité lance la
 * vidéo d'un clic (son autorisé car geste utilisateur), puis fondu vers le site.
 *
 * Deux sources : WebM (Chrome / Firefox / Android) + MP4 H.264 (Safari / iOS).
 * Robuste : erreur, échec de lecture ou « Passer » révèlent toujours le site.
 */
export function VideoIntro({
  webmSrc,
  mp4Src,
  onDone,
}: {
  webmSrc?: string;
  mp4Src: string;
  onDone: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    // Laisse le fondu se jouer avant de démonter l'overlay.
    window.setTimeout(onDone, 700);
  }

  async function start() {
    const v = videoRef.current;
    if (!v) {
      finish();
      return;
    }
    setStarted(true);
    try {
      await v.play(); // clic utilisateur → lecture avec le son autorisée
    } catch {
      // Politique navigateur : réessaie en muet ; sinon on révèle le site.
      try {
        v.muted = true;
        await v.play();
      } catch {
        finish();
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-ink"
      style={{ opacity: leaving ? 0 : 1, transition: 'opacity .7s ease' }}
      role="dialog"
      aria-label="Introduction"
    >
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        onEnded={finish}
        onError={finish}
        className="h-[100dvh] w-auto max-w-none"
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>

      {/* Écran de lancement (avant le clic) */}
      {!started && (
        <button
          onClick={start}
          aria-label="Ouvrir l'invitation"
          className="group absolute inset-0 z-[2] flex flex-col items-center justify-center gap-5 bg-ink/55 px-6 backdrop-blur-[1px]"
          style={{ animation: 'jlFadeIn .5s ease both' }}
        >
          <span className="font-display text-[clamp(34px,9vw,52px)] leading-none text-panel">
            Laura <span className="font-accent text-[0.6em] text-gold">&amp;</span> Jordan
          </span>
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-panel/50 bg-panel/10 pl-1.5 text-[26px] text-panel transition-colors group-hover:bg-panel/20">
            ▶
          </span>
          <span className="font-body text-[12px] uppercase tracking-[0.24em] text-panel/85">
            Ouvrir l'invitation
          </span>
        </button>
      )}

      {/* « Passer » — toujours disponible, pour ne jamais rester bloqué */}
      <button
        onClick={finish}
        className="absolute bottom-6 right-6 z-[3] rounded-full border border-panel/40 bg-ink/40 px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.14em] text-panel/90 backdrop-blur transition-colors hover:bg-ink/70"
      >
        Passer
      </button>
    </div>
  );
}
