import { getSessionUser } from '@/lib/auth';
import { getParcoursList, getResponses } from '@/lib/queries';
import { ATTENDING_LABELS } from '@/lib/rsvp-schema';
import type { RsvpAnswerValue, RsvpQuestion } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Export CSV des réponses RSVP (admin uniquement). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response('Non autorisé', { status: 401 });

  const [responses, parcours] = await Promise.all([getResponses(), getParcoursList()]);
  const questionsByParcours = new Map(parcours.map((p) => [p.id, p.formQuestions]));

  const header = [
    'Nom',
    'Email',
    'Parcours',
    'Statut',
    'Personnes',
    'Régime',
    'Message',
    'Réponses',
    'Date',
  ];
  const lines = [header.map(csvCell).join(',')];

  for (const r of responses) {
    const qs = questionsByParcours.get(r.parcoursId) ?? [];
    // Questions étant par parcours, on agrège les réponses dans une seule colonne.
    const answers = Object.entries(r.answers)
      .map(([qid, val]) => {
        const q = qs.find((x) => x.id === qid);
        const v = formatAnswer(q, val);
        return v ? `${q?.label ?? qid} : ${v}` : '';
      })
      .filter(Boolean)
      .join(' ; ');
    lines.push(
      [
        r.guestName,
        r.email ?? '',
        r.parcoursName,
        ATTENDING_LABELS[r.attending],
        String(r.headcount),
        r.dietary ?? '',
        r.message ?? '',
        answers,
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

function fmtDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}
function formatAnswer(q: RsvpQuestion | undefined, value: RsvpAnswerValue): string {
  if (Array.isArray(value)) {
    if (q?.type === 'date_range') {
      const [a, b] = value;
      if (a && b) return `du ${fmtDate(a)} au ${fmtDate(b)}`;
      return a ? fmtDate(a) : b ? fmtDate(b) : '';
    }
    return value.join(', ');
  }
  if (q?.type === 'date') return fmtDate(value);
  return value;
}

function csvCell(value: string): string {
  const needsQuote = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
