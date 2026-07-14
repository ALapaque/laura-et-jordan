import { clsx } from 'clsx';

/**
 * Cachet de cire — monogramme « L ∞ J », ton cire naturelle/olive, texture et
 * ombre douces (spec §5). Élément de signature réutilisable.
 */
export function WaxSeal({
  size = 76,
  className,
  idSuffix = 'seal',
}: {
  size?: number;
  className?: string;
  idSuffix?: string;
}) {
  const gradId = `wax-${idSuffix}`;
  const shineId = `shine-${idSuffix}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={clsx('block', className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#D9BB63" />
          <stop offset="45%" stopColor="#C29A3C" />
          <stop offset="100%" stopColor="#7E6A2C" />
        </radialGradient>
        <radialGradient id={shineId} cx="36%" cy="30%" r="40%">
          <stop offset="0%" stopColor="rgba(255,250,225,0.75)" />
          <stop offset="100%" stopColor="rgba(255,250,225,0)" />
        </radialGradient>
      </defs>

      {/* bord festonné de cire (blobs) */}
      <g fill={`url(#${gradId})`}>
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const r = 44;
          const cx = 50 + Math.cos(a) * r;
          const cy = 50 + Math.sin(a) * r;
          return <circle key={i} cx={cx} cy={cy} r="8.5" />;
        })}
        <circle cx="50" cy="50" r="45" />
      </g>

      {/* disque pressé */}
      <circle cx="50" cy="50" r="40" fill={`url(#${gradId})`} />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#5b4d20" strokeOpacity="0.35" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#f6ecc7" strokeOpacity="0.28" strokeWidth="1" />

      {/* reflet doux */}
      <circle cx="50" cy="50" r="45" fill={`url(#${shineId})`} />

      {/* monogramme L ∞ J */}
      <g
        fill="#f7edcf"
        fillOpacity="0.92"
        style={{ fontFamily: 'var(--font-display), serif' }}
        textAnchor="middle"
      >
        <text x="34" y="60" fontSize="34">
          L
        </text>
        <text x="66" y="60" fontSize="34">
          J
        </text>
      </g>
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontSize="17"
        fill="#f7edcf"
        fillOpacity="0.9"
        style={{ fontFamily: 'serif' }}
      >
        ∞
      </text>
    </svg>
  );
}
