import { withDbRetry } from '@/db';
import { LinksManager } from '@/components/dashboard/links-manager';
import { getMoments, getParcoursList, getResponses } from '@/lib/queries';

export default async function LinksPage() {
  const [parcours, moments, responses] = await withDbRetry(() =>
    Promise.all([getParcoursList(), getMoments(), getResponses()]),
  );

  const counts = new Map<string, number>();
  for (const r of responses) counts.set(r.parcoursId, (counts.get(r.parcoursId) ?? 0) + 1);
  const momentTitle = new Map(moments.map((m) => [m.id, m.title]));

  const view = parcours.map((p) => ({
    id: p.id,
    name: p.name,
    token: p.token,
    responses: counts.get(p.id) ?? 0,
    momentsLabel:
      p.visibleMomentIds
        .map((id) => momentTitle.get(id))
        .filter(Boolean)
        .join(' · ') || 'Aucun moment',
  }));

  return <LinksManager parcours={view} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ''} />;
}
