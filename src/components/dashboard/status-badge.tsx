import type { Attending } from '@/lib/types';

const STYLES: Record<Attending, { label: string; bg: string; color: string }> = {
  yes: { label: 'Présent', bg: '#ECDE9A', color: '#5b5316' },
  no: { label: 'Absent', bg: 'rgba(120,116,90,0.15)', color: '#78745A' },
  maybe: { label: 'Peut-être', bg: 'rgba(210,174,71,0.18)', color: '#946f12' },
};

export function StatusBadge({ status }: { status: Attending }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[12px] uppercase tracking-[0.06em]"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
