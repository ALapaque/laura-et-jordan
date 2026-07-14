import type { Metadata } from 'next';
import { MotifBackground } from '@/components/ui/motif-background';

export const metadata: Metadata = {
  title: 'Laura & Jordan',
};

/**
 * Page d'accueil neutre.
 * Elle n'expose JAMAIS la liste des parcours ni le nombre d'invités :
 * chaque invité arrive par son lien personnel `/i/[token]`.
 */
export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-7 text-center">
      <MotifBackground className="opacity-70" />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(242,237,224,0.55), rgba(242,237,224,0.2))',
        }}
      />
      <div className="relative z-[2] flex flex-col items-center gap-5">
        <span className="text-[13px] uppercase tracking-[0.42em] text-olive">Invitation mariage</span>
        <h1 className="font-display text-[clamp(56px,16vw,96px)] leading-[0.88] text-ink">
          Laura
          <span className="font-accent my-0.5 block text-[0.5em] text-gold">&amp;</span>
          Jordan
        </h1>
        <div className="mt-1 flex items-center gap-3.5">
          <span className="h-px w-9 bg-[rgba(64,57,42,0.28)]" />
          <span className="h-2 w-2 rotate-45 bg-gold" />
          <span className="h-px w-9 bg-[rgba(64,57,42,0.28)]" />
        </div>
        <p className="mt-2 max-w-sm font-body text-[16px] italic leading-relaxed text-sage">
          Vous avez reçu un lien personnel pour découvrir votre invitation.
          <br />
          Suivez-le pour nous répondre.
        </p>
      </div>
    </main>
  );
}
