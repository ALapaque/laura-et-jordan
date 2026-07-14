import { clsx } from 'clsx';

/**
 * Motif « toile de Jouy » recolorée — feuillage olive/sauge, fleurs jaune
 * pastel à cœur d'or, sur crème. Rendu en SVG vectoriel (léger, net à toute
 * résolution, aucun coût d'egress Supabase) et posé en `mix-blend-mode:multiply`
 * derrière une surface crème : le vide du motif reste crème, les couleurs se
 * fondent chaleureusement.
 *
 * Pour remplacer par l'asset PNG/SVG seamless final : déposez-le dans /public
 * et passez `imageSrc="/motif.png"`.
 */
export function MotifBackground({
  className,
  style,
  patternId = 'jl-jouy',
  imageSrc,
}: {
  className?: string;
  style?: React.CSSProperties;
  patternId?: string;
  imageSrc?: string;
}) {
  if (imageSrc) {
    return (
      <div
        aria-hidden
        className={clsx('pointer-events-none absolute inset-0 z-0', className)}
        style={{
          mixBlendMode: 'multiply',
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: '520px',
          backgroundRepeat: 'repeat',
          filter: 'saturate(1.08) contrast(1.03)',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={clsx('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      style={{ mixBlendMode: 'multiply', ...style }}
    >
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={patternId}
            width="240"
            height="300"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-4)"
          >
            <MotifCluster x={20} y={30} scale={1} rotate={-6} />
            <MotifCluster x={150} y={175} scale={0.92} rotate={14} />
            <MotifBird x={165} y={70} />
            <MotifBird x={40} y={215} flip />
            <MotifSprig x={120} y={40} rotate={40} />
            <MotifSprig x={200} y={260} rotate={-30} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

/** Une fleur pastel entourée de feuillage. */
function MotifCluster({
  x,
  y,
  scale,
  rotate,
}: {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}) {
  const petals = Array.from({ length: 8 });
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rotate})`}>
      {/* tiges & feuilles */}
      <path
        d="M0 34 C -18 24 -30 4 -24 -18"
        fill="none"
        stroke="#5C6441"
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
      <path d="M-24 -18 q -14 -2 -20 10 q 12 4 20 -10 Z" fill="#5C6441" fillOpacity="0.42" />
      <path d="M-12 6 q -14 -4 -22 6 q 12 6 22 -6 Z" fill="#858052" fillOpacity="0.4" />
      <path
        d="M2 34 C 18 26 26 8 22 -12"
        fill="none"
        stroke="#858052"
        strokeOpacity="0.45"
        strokeWidth="1.3"
      />
      <path d="M22 -12 q 14 -3 19 8 q -12 5 -19 -8 Z" fill="#5C6441" fillOpacity="0.4" />
      {/* fleur */}
      <g>
        {petals.map((_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-13"
            rx="5.5"
            ry="12"
            fill="#EFD370"
            fillOpacity="0.6"
            transform={`rotate(${i * 45})`}
          />
        ))}
        <circle cx="0" cy="0" r="6" fill="#D2AE47" fillOpacity="0.85" />
      </g>
    </g>
  );
}

/** Un petit bouton / sprig de feuilles. */
function MotifSprig({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity="0.9">
      <path
        d="M0 0 C 4 -12 4 -24 0 -34"
        fill="none"
        stroke="#5C6441"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <path d="M0 -8 q 9 -3 12 6 q -8 3 -12 -6 Z" fill="#858052" fillOpacity="0.42" />
      <path d="M0 -20 q -9 -3 -12 6 q 8 3 12 -6 Z" fill="#5C6441" fillOpacity="0.4" />
      <circle cx="0" cy="-36" r="3.4" fill="#ECDE9A" fillOpacity="0.75" />
    </g>
  );
}

/** Colibri stylisé (signature toile de Jouy). */
function MotifBird({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`} opacity="0.85">
      <path
        d="M0 0 q 8 -6 18 -4 q -2 6 -10 7 q 10 1 16 6 q -9 3 -18 -1 q -3 8 -8 10 q 0 -8 2 -13 q -6 -4 -8 -9 q 8 1 16 -3 Z"
        fill="#5C6441"
        fillOpacity="0.4"
      />
      <path d="M18 -4 q 8 -1 13 2 q -6 3 -13 0 Z" fill="#858052" fillOpacity="0.4" />
      <circle cx="3" cy="-2" r="1.3" fill="#40392A" fillOpacity="0.5" />
    </g>
  );
}
