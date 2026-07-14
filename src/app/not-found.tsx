import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-7 text-center">
      <span className="font-accent text-[52px] text-gold">&amp;</span>
      <h1 className="mt-2 font-display text-5xl text-ink">Page introuvable</h1>
      <p className="mt-4 max-w-sm font-body text-[16px] leading-relaxed text-muted">
        Ce lien n'existe pas ou n'est plus valide. Vérifiez le lien personnel qui vous a été
        transmis.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-line px-6 py-3 font-body text-[13px] uppercase tracking-[0.14em] text-olive transition-colors hover:bg-panel"
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
