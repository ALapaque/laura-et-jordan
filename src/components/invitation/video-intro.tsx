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
  posterSrc,
  onDone,
}: {
  webmSrc?: string;
  mp4Src: string;
  posterSrc?: string;
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
        preload="auto"
        poster={posterSrc}
        width={640}
        height={360}
        onEnded={finish}
        onError={finish}
        className="jl-intro-video h-[100dvh] w-auto max-w-none"
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={mp4Src} type="video/mp4" />
      </video>

      {/* Écran de lancement (avant le clic) — la 1re image de la vidéo
          (l'enveloppe scellée) reste visible ; le texte vit sur un dégradé
          sombre en bas pour rester lisible. Tap n'importe où = on ouvre. */}
      {!started && (
        <button
          onClick={start}
          aria-label="Ouvrir l'invitation"
          className="group absolute inset-0 z-[2] flex flex-col items-center justify-end gap-4 px-6 pb-[14vh]"
          style={{ animation: 'jlFadeIn .6s ease both' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(64,57,42,0.34) 0%, rgba(64,57,42,0.04) 24%, rgba(64,57,42,0.10) 46%, rgba(64,57,42,0.78) 90%, rgba(64,57,42,0.92) 100%)',
            }}
          />
          <span
            className="relative font-display leading-none text-panel"
            style={{ fontSize: 'clamp(30px, 8vw, 48px)', textShadow: '0 2px 16px rgba(0,0,0,0.55)' }}
          >
            Laura <span className="font-accent text-[0.6em] text-gold">&amp;</span> Jordan
          </span>
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/80 bg-ink/25 backdrop-blur-sm transition group-hover:bg-ink/45 group-active:scale-95">
            <svg viewBox="0 0 24 24" aria-hidden className="ml-0.5 h-6 w-6 fill-gold">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span
            className="relative font-body text-[12px] uppercase tracking-[0.26em] text-panel/90"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}
          >
            Ouvrir l'invitation
          </span>
        </button>
      )}

      {/* « Passer » — toujours disponible, pour ne jamais rester bloqué */}
      <button
        onClick={finish}
        className="absolute right-5 top-5 z-[3] rounded-full border border-panel/40 bg-ink/45 px-5 py-2 font-body text-[12px] uppercase tracking-[0.14em] text-panel/90 backdrop-blur transition-colors hover:bg-ink/70"
      >
        Passer
      </button>
    </div>
  );
}
