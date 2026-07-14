'use client';

import { useInvitation } from './invitation-context';

/**
 * Boutons flottants du hero : revoir l'animation (↺) et toggle musique.
 * Pas d'autoplay son (spec §4.1).
 */
export function HeroControls() {
  const { musicOn, hasMusic, toggleMusic, replayIntro } = useInvitation();

  return (
    <>
      <button
        onClick={replayIntro}
        title="Revoir l'animation"
        aria-label="Revoir l'animation d'ouverture"
        className="absolute left-5 top-[70px] z-[3] flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-panel/85 text-[18px] text-olive transition-colors hover:bg-panel"
      >
        ↺
      </button>
      <button
        onClick={toggleMusic}
        title={hasMusic ? (musicOn ? 'Couper la musique' : 'Écouter la musique') : 'Aucune musique'}
        aria-label="Musique d'ambiance"
        aria-pressed={musicOn}
        className="absolute right-5 top-[70px] z-[3] flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-panel/85 text-[16px] text-olive transition-colors hover:bg-panel"
      >
        {musicOn ? '♪' : '♫'}
      </button>
    </>
  );
}
