import { clsx } from 'clsx';

/**
 * Motif « toile de Jouy » recoloré — roses & pivoines jaune pastel à cœur d'or,
 * feuillage olive/sauge, colibris, sur crème (voir CLAUDE.md du projet design).
 * Rendu en SVG vectoriel (léger, net, zéro egress) et posé en
 * `mix-blend-mode:multiply` derrière une surface crème.
 *
 * ➜ Pour coller EXACTEMENT au design, déposez la vraie image dans /public et
 *   définissez `NEXT_PUBLIC_MOTIF_SRC=/motif.png` (ou passez `imageSrc`).
 *   Le fichier réel dépasse la limite d'import de l'outil design (256 Ko), il
 *   ne peut donc pas être récupéré automatiquement.
 */
const ENV_MOTIF_SRC = process.env.NEXT_PUBLIC_MOTIF_SRC || undefined;

export function MotifBackground({
  className,
  style,
  patternId = 'jl-jouy',
  imageSrc = ENV_MOTIF_SRC,
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
          backgroundSize: '560px',
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
            width="300"
            height="360"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-3)"
          >
            {/* tiges */}
            <Stem d="M40 360 C 70 300 40 250 66 196 C 84 156 60 120 78 74" />
            <Stem d="M232 360 C 210 306 246 262 214 206 C 190 168 220 128 206 78" tone="#858052" />
            <Stem d="M150 0 C 176 40 150 78 176 120" op={0.32} />

            {/* feuillage */}
            <Leaf x={60} y={250} s={1.05} rot={-24} />
            <Leaf x={74} y={214} s={0.95} rot={36} tone="#858052" />
            <Leaf x={220} y={244} s={1.1} rot={28} />
            <Leaf x={206} y={150} s={0.9} rot={-30} tone="#858052" />
            <Leaf x={168} y={92} s={0.85} rot={20} />
            <Leaf x={120} y={300} s={1} rot={-14} tone="#858052" />
            <Leaf x={264} y={110} s={0.8} rot={44} />

            {/* fleurs */}
            <Rose x={70} y={78} s={1.15} rot={-8} />
            <Peony x={214} y={150} s={1.1} rot={12} />
            <Rose x={150} y={286} s={0.92} rot={22} />
            <Peony x={30} y={330} s={0.7} rot={-18} />
            <Rose x={286} y={300} s={0.62} rot={8} />

            {/* colibris */}
            <Hummingbird x={214} y={58} s={1} rot={-12} />
            <Hummingbird x={92} y={200} s={0.85} rot={10} flip />

            {/* boutons & petites fleurs */}
            <Bud x={104} y={150} s={1} rot={-10} />
            <Bud x={250} y={220} s={0.9} rot={26} />
            <Blossom x={140} y={150} s={1} />
            <Blossom x={276} y={200} s={0.85} />
            <Blossom x={38} y={170} s={0.75} />
            <Blossom x={190} y={310} s={0.9} />
            <Blossom x={112} y={40} s={0.7} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

/** Pétale en larme, pointe vers le haut, origine au centre de la fleur. */
function petalPath(len: number, w: number): string {
  return `M0 0 C ${-w} ${-len * 0.35}, ${-w * 0.7} ${-len}, 0 ${-len} C ${w * 0.7} ${-len}, ${w} ${-len * 0.35}, 0 0 Z`;
}

function Rose({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  const rings = [
    { n: 9, len: 14, w: 6.5, fill: '#E4CE82', op: 0.5, off: 0 },
    { n: 7, len: 10, w: 5.5, fill: '#EFD370', op: 0.6, off: 25 },
    { n: 5, len: 6.5, w: 4, fill: '#F0DA8A', op: 0.72, off: 12 },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }).map((_, i) => (
          <path
            key={`${ri}-${i}`}
            d={petalPath(ring.len, ring.w)}
            fill={ring.fill}
            fillOpacity={ring.op}
            transform={`rotate(${(i / ring.n) * 360 + ring.off})`}
          />
        )),
      )}
      <circle r="2.8" fill="#D2AE47" fillOpacity="0.9" />
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={i} r="0.85" fill="#B8891F" transform={`rotate(${i * 60}) translate(0 -3.1)`} />
      ))}
    </g>
  );
}

function Peony({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  const rings = [
    { n: 11, len: 13, w: 8, fill: '#E8D48C', op: 0.46, off: 0 },
    { n: 9, len: 10, w: 7, fill: '#EFD370', op: 0.56, off: 18 },
    { n: 7, len: 7, w: 6, fill: '#F1DC8F', op: 0.66, off: 26 },
    { n: 5, len: 4.5, w: 4.5, fill: '#F3E1A0', op: 0.75, off: 10 },
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      {rings.map((ring, ri) =>
        Array.from({ length: ring.n }).map((_, i) => (
          <path
            key={`${ri}-${i}`}
            d={petalPath(ring.len, ring.w)}
            fill={ring.fill}
            fillOpacity={ring.op}
            transform={`rotate(${(i / ring.n) * 360 + ring.off})`}
          />
        )),
      )}
      {Array.from({ length: 7 }).map((_, i) => (
        <circle
          key={i}
          r="1"
          fill="#D2AE47"
          fillOpacity="0.85"
          transform={`rotate(${i * 51}) translate(0 -1.8)`}
        />
      ))}
      <circle r="1.4" fill="#B8891F" fillOpacity="0.8" />
    </g>
  );
}

function Leaf({
  x,
  y,
  s = 1,
  rot = 0,
  tone = '#5C6441',
  op = 0.42,
}: {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  tone?: string;
  op?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <path d="M0 0 C 7 -4 8 -15 0 -23 C -8 -15 -7 -4 0 0 Z" fill={tone} fillOpacity={op} />
      <path
        d="M0 -1 L0 -21"
        stroke="#40392A"
        strokeOpacity="0.22"
        strokeWidth="0.7"
        fill="none"
      />
    </g>
  );
}

function Stem({
  d,
  tone = '#5C6441',
  op = 0.4,
  w = 1.3,
}: {
  d: string;
  tone?: string;
  op?: number;
  w?: number;
}) {
  return (
    <path
      d={d}
      fill="none"
      stroke={tone}
      strokeOpacity={op}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
}

function Hummingbird({
  x,
  y,
  s = 1,
  rot = 0,
  flip = false,
}: {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${rot})`}>
      <path d="M0 0 C 6 -3 13 -2 17 2 C 12 3 6 3 0 2 Z" fill="#5C6441" fillOpacity="0.5" />
      <circle cx="16" cy="1" r="3.1" fill="#5C6441" fillOpacity="0.55" />
      <path d="M19 1 L27 -1.5" stroke="#40392A" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M6 0 C 2 -12 -6 -15 -13 -9 C -7 -6 -2 -2 3 1 Z"
        fill="#858052"
        fillOpacity="0.45"
      />
      <path
        d="M0 1 L -13 4 M0 2 L -12 8"
        stroke="#5C6441"
        strokeOpacity="0.45"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="13.5" cy="3.2" r="1.3" fill="#D2AE47" fillOpacity="0.7" />
      <circle cx="16.6" cy="0.3" r="0.7" fill="#40392A" fillOpacity="0.6" />
    </g>
  );
}

function Bud({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <path d="M0 0 C -4 -3 -4 -9 0 -12 C 4 -9 4 -3 0 0 Z" fill="#EFD370" fillOpacity="0.6" />
      <path d="M0 1 C -3 0 -5 3 -4 6 C -1 5 0 3 0 1 Z" fill="#5C6441" fillOpacity="0.45" />
      <path d="M0 1 C 3 0 5 3 4 6 C 1 5 0 3 0 1 Z" fill="#5C6441" fillOpacity="0.45" />
    </g>
  );
}

function Blossom({ x, y, s = 1, rot = 0 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <ellipse
          key={i}
          cx="0"
          cy="-4"
          rx="2.2"
          ry="4"
          fill="#ECDE9A"
          fillOpacity="0.6"
          transform={`rotate(${i * 72})`}
        />
      ))}
      <circle r="1.6" fill="#D2AE47" fillOpacity="0.8" />
    </g>
  );
}
