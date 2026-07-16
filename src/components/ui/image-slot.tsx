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
  zoomable = false,
}: {
  src?: string | null;
  alt?: string;
  label?: string;
  className?: string;
  /** Rend l'image cliquable pour l'ouvrir en grand (voir `<Lightbox />`). */
  zoomable?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        data-zoomable={zoomable ? '' : undefined}
        role={zoomable ? 'button' : undefined}
        tabIndex={zoomable ? 0 : undefined}
        className={clsx(
          'h-full w-full object-cover',
          zoomable && 'cursor-zoom-in',
          className,
        )}
      />
    );
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
