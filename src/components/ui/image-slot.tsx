import { clsx } from 'clsx';

/**
 * Emplacement média — affiche l'image si `src` est fourni, sinon un placeholder
 * discret (spec : slots à remplir plus tard avec photos/boucles vidéo).
 */
export function ImageSlot({
  src,
  alt = '',
  label = 'Photo',
  className,
}: {
  src?: string | null;
  alt?: string;
  label?: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={clsx('h-full w-full object-cover', className)} />;
  }
  return (
    <div
      className={clsx(
        'relative flex h-full w-full flex-col items-center justify-center gap-2',
        className,
      )}
      style={{ background: 'linear-gradient(135deg, #F3ECDB, #E9E0C9)' }}
      aria-hidden
    >
      <span className="h-2 w-2 rotate-45 bg-gold/50" />
      <span className="font-body text-[10px] uppercase tracking-[0.22em] text-sage/80">{label}</span>
    </div>
  );
}
