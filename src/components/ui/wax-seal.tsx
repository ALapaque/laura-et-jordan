import { clsx } from 'clsx';

/**
 * Cachet de cire **effet or** — monogramme « L & J ».
 * Dégradés façon feuille d'or (hautes lumières crème → or profond), disque
 * pressé, monogramme embossé (ombre + lumière) et **reflet qui balaie** le
 * cachet en boucle (`jlSheen`, défini dans globals.css).
 */
export function WaxSeal({
  size = 88,
  className,
  idSuffix = 'seal',
  sheen = true,
}: {
  size?: number;
  className?: string;
  idSuffix?: string;
  /** Reflet animé (désactivable pour les rendus statiques). */
  sheen?: boolean;
}) {
  const gold = `gold-${idSuffix}`;
  const rim = `rim-${idSuffix}`;
  const clip = `clip-${idSuffix}`;

  return (
    <div className={clsx('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="block" aria-hidden>
        <defs>
          <radialGradient id={gold} cx="36%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#F7E9B8" />
            <stop offset="36%" stopColor="#E6C464" />
            <stop offset="70%" stopColor="#C89B34" />
            <stop offset="100%" stopColor="#8E691C" />
          </radialGradient>
          <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF7DA" />
            <stop offset="50%" stopColor="#D2AE47" />
            <stop offset="100%" stopColor="#7C5B16" />
          </linearGradient>
          <clipPath id={clip}>
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>

        {/* pâte du cachet : bord irrégulier festonné */}
        <g fill={`url(#${gold})`}>
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            // rayons légèrement irréguliers pour un bord organique
            const r = 43.4 + ((i * 7) % 3) * 1.1;
            return (
              <circle
                key={i}
                cx={50 + Math.cos(a) * r}
                cy={50 + Math.sin(a) * r}
                r={8.6}
              />
            );
          })}
          <circle cx="50" cy="50" r="45" />
        </g>
        <circle
          cx="50"
          cy="50"
          r="45.6"
          fill="none"
          stroke={`url(#${rim})`}
          strokeOpacity="0.55"
          strokeWidth="1"
        />

        {/* disque pressé */}
        <circle cx="50" cy="50" r="38" fill={`url(#${gold})`} />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#6E5314" strokeOpacity="0.5" strokeWidth="1.2" />
        <circle cx="50" cy="49" r="37" fill="none" stroke="#FFF7DA" strokeOpacity="0.5" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="31.5" fill="none" stroke="#6E5314" strokeOpacity="0.3" strokeWidth="0.7" />

        {/* monogramme L & J — embossé (ombre puis lumière) */}
        <g clipPath={`url(#${clip})`}>
          <g
            transform="translate(0.9 1.2)"
            fill="#5F4711"
            opacity="0.65"
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-display), cursive' }}
          >
            <text x="31" y="63" fontSize="38">
              L
            </text>
            <text
              x="50"
              y="57"
              fontSize="16"
              style={{ fontFamily: 'var(--font-accent), cursive' }}
            >
              &amp;
            </text>
            <text x="70" y="63" fontSize="38">
              J
            </text>
          </g>
          <g
            fill="#FCF4D9"
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-display), cursive' }}
          >
            <text x="31" y="63" fontSize="38">
              L
            </text>
            <text
              x="50"
              y="57"
              fontSize="16"
              fill="#FFF3C4"
              style={{ fontFamily: 'var(--font-accent), cursive' }}
            >
              &amp;
            </text>
            <text x="70" y="63" fontSize="38">
              J
            </text>
          </g>
        </g>

        {/* haute lumière douce */}
        <ellipse cx="40" cy="34" rx="24" ry="14" fill="#FFFBE6" opacity="0.18" />
      </svg>

      {/* reflet or qui balaie le cachet */}
      {sheen && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ borderRadius: '50%' }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              bottom: '-30%',
              left: 0,
              width: '34%',
              background:
                'linear-gradient(105deg, rgba(255,250,224,0) 0%, rgba(255,250,224,0.6) 50%, rgba(255,250,224,0) 100%)',
              filter: 'blur(1px)',
              animation: 'jlSheen 3.6s ease-in-out infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
