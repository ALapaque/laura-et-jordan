import 'server-only';
import type { Moment, Parcours, RsvpResponse, Wedding } from './types';

// Envoi via l'API SendGrid (aucune dépendance : simple appel HTTPS).
// `SENDGRID_FROM` = l'adresse « Single Sender » vérifiée dans SendGrid,
// au format « Nom <email> » ou simplement « email ».
const apiKey = process.env.SENDGRID_API_KEY;
const sender = parseSender(process.env.SENDGRID_FROM ?? '');

interface RsvpEmailData {
  wedding: Wedding;
  parcours: Parcours;
  response: RsvpResponse;
  moments: Moment[];
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

/**
 * Envoie la notification RSVP aux mariés via SendGrid (spec §4.3).
 * Dégradation gracieuse : sans clé API ou sans destinataire, on logge et on
 * n'échoue pas la requête RSVP.
 */
export async function sendRsvpNotification(data: RsvpEmailData): Promise<SendResult> {
  const recipients = data.wedding.notifyEmails.filter(Boolean);
  if (!data.wedding.notifyEnabled) return { sent: false, reason: 'notifications désactivées' };
  if (recipients.length === 0) return { sent: false, reason: 'aucun destinataire' };

  const subject = rsvpSubject(data.response);
  const html = renderRsvpEmail(data);

  if (!apiKey || !sender.email) {
    console.info(
      `[email:démo] ${subject} → ${recipients.join(', ')} (définissez SENDGRID_API_KEY et SENDGRID_FROM pour l'envoi réel)`,
    );
    return { sent: false, reason: 'SENDGRID_API_KEY/SENDGRID_FROM absents (mode démo)' };
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: recipients.map((email) => ({ email })) }],
        from: { email: sender.email, name: sender.name },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (res.ok) return { sent: true }; // SendGrid renvoie 202 Accepted
    const detail = await res.text().catch(() => '');
    console.error('[email] échec SendGrid :', res.status, detail);
    return { sent: false, reason: `SendGrid a répondu ${res.status}` };
  } catch (err) {
    console.error('[email] exception :', err);
    return { sent: false, reason: err instanceof Error ? err.message : 'erreur inconnue' };
  }
}

// « Nom <email> » ou « email » → expéditeur SendGrid (doit être un Single Sender vérifié).
function parseSender(raw: string): { email: string; name: string } {
  const m = /^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/.exec(raw);
  if (m && m[2]) return { name: m[1]?.trim() || 'Laura & Jordan', email: m[2].trim() };
  return { name: 'Laura & Jordan', email: raw.trim() };
}

function rsvpSubject(r: RsvpResponse): string {
  const who = r.guestName.trim() || 'Un invité';
  const status =
    r.attending === 'yes' ? 'sera présent' : r.attending === 'no' ? 'sera absent' : 'répond peut-être';
  return `RSVP — ${who} ${status}`;
}

function renderRsvpEmail({ parcours, response, moments }: RsvpEmailData): string {
  const c = {
    bg: '#F2EDE0',
    surface: '#FBF8F0',
    ink: '#40392A',
    muted: '#78745A',
    olive: '#5C6441',
    gold: '#D2AE47',
    line: 'rgba(92,100,65,0.18)',
  };
  const badge =
    response.attending === 'yes'
      ? { label: 'Présent', bg: '#ECDE9A', color: '#5b5316' }
      : response.attending === 'no'
        ? { label: 'Absent', bg: 'rgba(120,116,90,0.15)', color: '#78745A' }
        : { label: 'Peut-être', bg: 'rgba(210,174,71,0.18)', color: '#946f12' };

  const attendedMoments = moments
    .filter((m) => response.perMoment[m.id])
    .map((m) => m.title);

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;color:${c.muted};font-size:13px;width:38%;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:${c.ink};font-size:15px;">${value}</td>
    </tr>`;

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:${c.bg};font-family:Georgia,'Times New Roman',serif;color:${c.ink};">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:${c.olive};">Nouvelle réponse</div>
      <div style="font-size:34px;color:${c.ink};margin-top:6px;">Laura <span style="color:${c.gold};">&amp;</span> Jordan</div>
    </div>
    <div style="background:${c.surface};border:1px solid ${c.line};border-radius:14px;padding:24px 22px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:20px;color:${c.ink};">${esc(response.guestName.trim() || 'Invité·e')}</div>
      </div>
      <div style="margin:12px 0 18px;">
        <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.06em;padding:5px 12px;border-radius:999px;background:${badge.bg};color:${badge.color};">${badge.label}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid ${c.line};">
        ${row('Parcours', esc(parcours.name))}
        ${response.attending !== 'no' ? row('Nombre de personnes', String(response.headcount)) : ''}
        ${attendedMoments.length ? row('Moments', esc(attendedMoments.join(' · '))) : ''}
        ${response.dietary ? row('Régime / allergies', esc(response.dietary)) : ''}
        ${response.message ? row('Petit mot', `« ${esc(response.message)} »`) : ''}
      </table>
    </div>
    <p style="text-align:center;color:${c.muted};font-size:12px;margin-top:20px;">
      Retrouvez toutes les réponses dans votre tableau de bord.
    </p>
  </div>
</body></html>`;
}
