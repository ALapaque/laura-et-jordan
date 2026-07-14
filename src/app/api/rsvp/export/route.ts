import { getSessionUser } from '@/lib/auth';
import { getResponses } from '@/lib/queries';
import { ATTENDING_LABELS } from '@/lib/rsvp-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Export CSV des réponses RSVP (admin uniquement). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response('Non autorisé', { status: 401 });

  const responses = await getResponses();
  const header = ['Nom', 'Parcours', 'Statut', 'Personnes', 'Régime', 'Message', 'Date'];
  const lines = [header.map(csvCell).join(',')];

  for (const r of responses) {
    lines.push(
      [
        r.guestName,
        r.parcoursName,
        ATTENDING_LABELS[r.attending],
        String(r.headcount),
        r.dietary ?? '',
        r.message ?? '',
        new Date(r.createdAt).toISOString(),
      ]
        .map(csvCell)
        .join(','),
    );
  }

  // BOM pour un affichage correct des accents dans Excel.
  const csv = '﻿' + lines.join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="rsvp-laura-jordan.csv"`,
    },
  });
}

function csvCell(value: string): string {
  const needsQuote = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
