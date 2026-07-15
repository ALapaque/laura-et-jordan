import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGuestResponse, getInvitationByToken } from '@/lib/queries';
import { clientIpFromHeaders, hashIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const lookupSchema = z.object({
  token: z.string().min(4).max(64),
  email: z.string().trim().email().max(200),
});

/** Retrouve une réponse existante par email (pour la pré-remplir côté invité). */
export async function POST(request: Request) {
  const ipHash = hashIp(clientIpFromHeaders(request.headers));
  const limit = rateLimit(`rsvp-lookup:${ipHash}`, { capacity: 8, refillPerSec: 0.1 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans un instant.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  const parsed = lookupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 422 });
  }

  const invitation = await getInvitationByToken(parsed.data.token);
  if (!invitation) {
    return NextResponse.json({ error: 'Lien invalide.' }, { status: 404 });
  }

  const prefill = await getGuestResponse(invitation.parcours.id, parsed.data.email);
  if (!prefill) return NextResponse.json({ found: false });

  // On ne renvoie que les moments visibles pour ce parcours.
  const visible = new Set(invitation.moments.map((m) => m.id));
  const perMoment: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(prefill.perMoment)) {
    if (v && visible.has(k)) perMoment[k] = true;
  }

  return NextResponse.json({ found: true, response: { ...prefill, perMoment } });
}
