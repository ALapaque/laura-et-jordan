import { NextResponse } from 'next/server';
import { sendRsvpNotification } from '@/lib/email';
import { getInvitationByToken, saveRsvp } from '@/lib/queries';
import { clientIpFromHeaders, hashIp, rateLimit } from '@/lib/rate-limit';
import { rsvpInputSchema } from '@/lib/rsvp-schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const ipHash = hashIp(ip);

  // Rate-limit : ~6 requêtes puis 1 toutes les ~10s (spec §4.3, §6).
  const limit = rateLimit(`rsvp:${ipHash}`, { capacity: 6, refillPerSec: 0.1 });
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
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 });
  }

  const parsed = rsvpInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation échouée.', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const invitation = await getInvitationByToken(input.token);
  if (!invitation) {
    return NextResponse.json({ error: 'Lien invalide.' }, { status: 404 });
  }

  // On ne conserve que les moments réellement visibles pour ce parcours.
  const visible = new Set(invitation.moments.map((m) => m.id));
  const perMoment: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(input.perMoment)) {
    if (value && visible.has(key)) perMoment[key] = true;
  }

  let saved;
  try {
    saved = await saveRsvp({
      parcoursId: invitation.parcours.id,
      guestName: input.guestName.trim(),
      attending: input.attending,
      headcount: input.attending === 'no' ? 0 : Math.max(1, input.headcount),
      perMoment,
      dietary: input.dietary.trim() || null,
      message: input.message.trim() || null,
      locale: input.locale,
      ipHash,
    });
  } catch (err) {
    console.error('[rsvp] persistance échouée :', err);
    return NextResponse.json({ error: "Impossible d'enregistrer la réponse." }, { status: 500 });
  }

  // Notification email — n'échoue jamais la requête RSVP.
  const emailResult = await sendRsvpNotification({
    wedding: invitation.wedding,
    parcours: saved.parcours,
    response: saved.response,
    moments: invitation.moments,
  });

  return NextResponse.json({
    ok: true,
    attending: saved.response.attending,
    emailed: emailResult.sent,
  });
}
