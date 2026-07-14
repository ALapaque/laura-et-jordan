import { StatusBadge } from '@/components/dashboard/status-badge';
import { getStats } from '@/lib/queries';

const BAR_COLORS = ['#5C6441', '#858052', '#D2AE47'];

export default async function OverviewPage() {
  const stats = await getStats();
  const maxResp = Math.max(1, ...stats.perParcours.map((p) => p.count));

  const kpis = [
    { label: 'Présents', value: stats.present, color: '#5C6441' },
    { label: 'Absents', value: stats.absent, color: '#78745A' },
    { label: 'Peut-être', value: stats.maybe, color: '#946f12' },
    { label: 'Réponses', value: stats.total, color: '#40392A' },
  ];

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-line bg-surface p-5">
            <div className="font-body text-[11px] uppercase tracking-[0.14em] text-sage">
              {k.label}
            </div>
            <div
              className="mt-1.5 font-body text-[40px] leading-tight"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
        <div className="rounded-[14px] border border-line bg-surface p-[22px]">
          <div className="mb-[18px] font-body text-[12px] uppercase tracking-[0.16em] text-olive">
            Réponses par parcours
          </div>
          <div className="flex flex-col gap-3.5">
            {stats.perParcours.length === 0 && (
              <p className="font-body text-[14px] italic text-muted">Aucun parcours pour l'instant.</p>
            )}
            {stats.perParcours.map((p, i) => (
              <div key={p.id}>
                <div className="mb-1.5 flex justify-between gap-2.5 font-body text-[14px] text-ink">
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {p.name}
                  </span>
                  <span className="flex-none text-sage">{p.count}</span>
                </div>
                <div className="h-[9px] overflow-hidden rounded-full bg-[rgba(92,100,65,0.12)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((p.count / maxResp) * 100)}%`,
                      background: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-surface p-[22px]">
          <div className="mb-3.5 font-body text-[12px] uppercase tracking-[0.16em] text-olive">
            Derniers RSVP
          </div>
          <div className="flex flex-col">
            {stats.recent.length === 0 && (
              <p className="font-body text-[14px] italic text-muted">Pas encore de réponse.</p>
            )}
            {stats.recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2.5 border-b border-line py-2.5 last:border-0"
              >
                <div>
                  <div className="font-body text-[15px] text-ink">
                    {r.guestName || 'Invité·e'}
                  </div>
                  <div className="font-mono text-[11px] text-sage">{r.parcoursName}</div>
                </div>
                <StatusBadge status={r.attending} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
