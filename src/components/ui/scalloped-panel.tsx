import { clsx } from 'clsx';

/**
 * Panneau crème à **bord festonné (« dentelle »)** — traitement signature du
 * faire-part / de la charte. Recette CSS `mask` reprise à l'identique du design :
 * des demi-cercles répétés le long des 4 bords découpent une bordure en feston.
 *
 * Le panneau est opaque (crème `#F8F3E8`) et flotte au-dessus du motif toile de
 * Jouy : le texte se pose dessus (lisible), le motif respire autour.
 *
 * ⚠️ Le feston « mange » ~`scallop` px sur chaque bord → prévoir un padding ≥
 * `scallop` dans le contenu.
 */
export function ScallopedPanel({
  children,
  className,
  style,
  scallop = 28,
  background = 'var(--color-panel)',
  as: Tag = 'div',
  'data-rev': dataRev,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Taille du feston en px (faire-part = 36, cartes = 28). */
  scallop?: number;
  background?: string;
  as?: React.ElementType;
  /** Pour le scroll-reveal (voir InvitationProvider). */
  'data-rev'?: string;
}) {
  const r = scallop / 2;
  const c = `radial-gradient(circle ${r}px at ${r}px ${r}px,#000 98%,#0000)`;
  const mask = [
    `${c} ${r}px 0/${scallop}px ${scallop}px repeat-x`,
    `${c} ${r}px 100%/${scallop}px ${scallop}px repeat-x`,
    `${c} 0 ${r}px/${scallop}px ${scallop}px repeat-y`,
    `${c} 100% ${r}px/${scallop}px ${scallop}px repeat-y`,
    `linear-gradient(#000,#000) 50% 50%/calc(100% - ${scallop}px) calc(100% - ${scallop}px) no-repeat`,
  ].join(', ');

  return (
    <Tag
      data-rev={dataRev}
      className={clsx(className)}
      style={{
        background,
        WebkitMask: mask,
        mask,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
