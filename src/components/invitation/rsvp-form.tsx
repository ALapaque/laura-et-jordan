'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { formatDeadline } from '@/lib/format';
import { rsvpInputSchema } from '@/lib/rsvp-schema';
import type { Attending, Moment, RsvpFields } from '@/lib/types';

type StepKey = 'presence' | 'names' | 'moments' | 'dietary' | 'message';

const DIET_CHIPS = ['Aucun', 'Végétarien', 'Vegan', 'Sans gluten'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Le pas « names » (email + nom) est toujours présent : l'email est requis et
// sert d'identifiant pour retrouver/modifier sa réponse.
function computeSteps(attending: Attending | null, fields: RsvpFields, momentsCount: number): StepKey[] {
  if (attending === 'no') {
    const steps: StepKey[] = ['presence', 'names'];
    if (fields.askMessage) steps.push('message');
    return steps;
  }
  const steps: StepKey[] = ['presence', 'names'];
  if (fields.askPerMoment && momentsCount > 0) steps.push('moments');
  if (fields.askDietary) steps.push('dietary');
  if (fields.askMessage) steps.push('message');
  return steps;
}

type LookupResponse = {
  guestName: string;
  email: string;
  attending: Attending;
  headcount: number;
  perMoment: Record<string, boolean>;
  dietary: string;
  message: string;
};

export function RsvpForm({
  token,
  moments,
  rsvpFields,
  deadline,
  locale = 'fr',
}: {
  token: string;
  moments: Moment[];
  rsvpFields: RsvpFields;
  deadline: string | null;
  locale?: 'fr' | 'nl';
}) {
  const [attending, setAttending] = useState<Attending | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [headcount, setHeadcount] = useState(2);
  const [perMoment, setPerMoment] = useState<Record<string, boolean>>({});
  const [dietPick, setDietPick] = useState('');
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modification d'une réponse existante (retrouvée par email).
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);

  const steps = useMemo(
    () => computeSteps(attending, rsvpFields, moments.length),
    [attending, rsvpFields, moments.length],
  );
  const stepKey = steps[Math.min(stepIndex, steps.length - 1)]!;
  const isLast = stepIndex >= steps.length - 1;
  const maxHead = rsvpFields.maxHeadcount || 12;

  const emailValid = EMAIL_RE.test(email.trim());
  const nextDisabled =
    (stepKey === 'presence' && !attending) ||
    (stepKey === 'names' &&
      (!emailValid || (attending !== 'no' && rsvpFields.askNames && guestName.trim() === '')));

  function chooseAttending(value: Attending) {
    setAttending(value);
    setStepIndex(0);
    setError(null);
  }

  function toggleMoment(id: string) {
    setPerMoment((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function pickDiet(value: string) {
    setDietPick(value);
    setDietary(value === 'Aucun' ? '' : value);
  }

  async function retrieveResponse() {
    const em = lookupEmail.trim();
    if (!EMAIL_RE.test(em)) {
      setLookupMsg('Merci d’entrer un email valide.');
      return;
    }
    setLookingUp(true);
    setLookupMsg(null);
    try {
      const res = await fetch('/api/rsvp/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: em }),
      });
      const body = (await res.json().catch(() => null)) as {
        found?: boolean;
        response?: LookupResponse;
        error?: string;
      } | null;
      if (!res.ok) {
        setLookupMsg(body?.error ?? 'Une erreur est survenue. Réessayez.');
      } else if (body?.found && body.response) {
        const r = body.response;
        setAttending(r.attending);
        setGuestName(r.guestName ?? '');
        setEmail(r.email || em);
        setHeadcount(r.headcount || 1);
        setPerMoment(r.perMoment ?? {});
        setDietary(r.dietary ?? '');
        setDietPick('');
        setMessage(r.message ?? '');
        setEditingExisting(true);
        setLookupOpen(false);
        setStepIndex(0);
      } else {
        setLookupMsg('Aucune réponse trouvée pour cet email.');
      }
    } catch {
      setLookupMsg('Connexion impossible. Réessayez.');
    } finally {
      setLookingUp(false);
    }
  }

  async function advance() {
    if (nextDisabled) return;
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    await submit();
  }

  async function submit() {
    setError(null);
    const payload = {
      token,
      guestName,
      email,
      attending: attending ?? 'maybe',
      headcount,
      perMoment,
      dietary,
      message,
      locale,
    };
    const parsed = rsvpInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Merci de vérifier vos réponses.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Une erreur est survenue. Réessayez.');
      }
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetToEdit() {
    setSubmitted(false);
    setStepIndex(0);
  }

  if (submitted) {
    return <Confirmation attending={attending ?? 'maybe'} deadline={deadline} onEdit={resetToEdit} />;
  }

  const nextLabel = isLast ? 'Envoyer ma réponse' : 'Continuer';

  return (
    <div>
      {editingExisting && (
        <div className="mb-5 rounded-xl border border-gold/40 bg-accent-soft/50 px-4 py-2.5 text-center font-body text-[13px] text-ink">
          Votre réponse a été retrouvée — modifiez-la puis renvoyez-la.
        </div>
      )}

      {/* points d'étape */}
      <div className="mb-7 flex items-center justify-center gap-2">
        {steps.map((key, i) => (
          <span
            key={key}
            className={clsx(
              'h-1.5 rounded-full transition-all duration-300',
              i === stepIndex ? 'w-6 bg-olive' : i < stepIndex ? 'w-1.5 bg-olive' : 'w-1.5 bg-olive/25',
            )}
          />
        ))}
      </div>

      <div style={{ animation: 'jlFadeUp .4s ease both' }}>
        {stepKey === 'presence' && (
          <div>
            <p className="mb-5 text-center font-body text-[18px] text-ink">
              Aurez-vous le plaisir de nous rejoindre ?
            </p>
            <div className="mx-auto flex max-w-[340px] flex-col gap-3">
              <ChoiceButton active={attending === 'yes'} onClick={() => chooseAttending('yes')}>
                Oui, avec joie
              </ChoiceButton>
              <ChoiceButton active={attending === 'maybe'} onClick={() => chooseAttending('maybe')}>
                Peut-être
              </ChoiceButton>
              <ChoiceButton active={attending === 'no'} onClick={() => chooseAttending('no')}>
                Non, malheureusement
              </ChoiceButton>
            </div>

            {/* Modifier une réponse déjà envoyée (via email) */}
            <div className="mt-6 text-center">
              {!lookupOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setLookupOpen(true);
                    setLookupMsg(null);
                  }}
                  className="font-body text-[13px] text-olive underline decoration-gold/50 underline-offset-4 transition-colors hover:text-ink"
                >
                  Déjà répondu ? Modifier ma réponse
                </button>
              ) : (
                <div className="mx-auto max-w-[340px] rounded-xl border border-line bg-surface p-4 text-left">
                  <label className="mb-2 block font-body text-[11px] uppercase tracking-[0.14em] text-olive">
                    Votre email
                  </label>
                  <input
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="vous@exemple.be"
                    className="w-full rounded-[9px] border border-line bg-bg px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
                  />
                  {lookupMsg && (
                    <p className="mt-2 font-body text-[13px] text-[#9a3b2e]">{lookupMsg}</p>
                  )}
                  <div className="mt-3 flex gap-2.5">
                    <button
                      type="button"
                      onClick={retrieveResponse}
                      disabled={lookingUp}
                      className="rounded-[9px] border-none bg-olive px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
                    >
                      {lookingUp ? 'Recherche…' : 'Retrouver'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLookupOpen(false)}
                      className="rounded-[9px] border border-line bg-transparent px-4 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-olive"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {stepKey === 'names' && (
          <div className="mx-auto flex max-w-[360px] flex-col gap-6">
            <div>
              <label className="mb-2 block font-body text-[11px] uppercase tracking-[0.14em] text-olive">
                Votre email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.be"
                className="w-full rounded-[9px] border border-line bg-surface px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
              />
              <p className="mt-1.5 font-body text-[12px] text-muted">
                Pour retrouver et modifier votre réponse plus tard.
              </p>
            </div>
            {rsvpFields.askNames && (
              <div>
                <label className="mb-2 block font-body text-[11px] uppercase tracking-[0.14em] text-olive">
                  Nom(s) des invités
                </label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ex. Camille & Théo Martin"
                  className="w-full rounded-[9px] border border-line bg-surface px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
                />
              </div>
            )}
            {rsvpFields.askHeadcount && attending !== 'no' && (
              <div>
                <label className="mb-2 block font-body text-[11px] uppercase tracking-[0.14em] text-olive">
                  Nombre de personnes
                </label>
                <div className="flex items-center gap-4">
                  <StepperButton onClick={() => setHeadcount((h) => Math.max(1, h - 1))} label="−" />
                  <span className="min-w-[34px] text-center font-body text-[26px] text-ink">
                    {headcount}
                  </span>
                  <StepperButton
                    onClick={() => setHeadcount((h) => Math.min(maxHead, h + 1))}
                    label="+"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {stepKey === 'moments' && (
          <div className="mx-auto max-w-[360px]">
            <p className="mb-4 text-center font-body text-[16px] text-muted">
              À quels moments serez-vous présents ?
            </p>
            <div className="flex flex-col gap-2.5">
              {moments.map((m) => {
                const on = !!perMoment[m.id];
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMoment(m.id)}
                    className={clsx(
                      'flex items-center justify-between gap-3 rounded-[10px] border-[1.5px] px-4 py-3.5 text-left font-body text-[16px] text-ink transition-colors',
                      on ? 'border-gold bg-accent-soft' : 'border-line bg-surface',
                    )}
                  >
                    <span>{m.title}</span>
                    <span className="text-[15px] text-olive">{on ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {stepKey === 'dietary' && (
          <div className="mx-auto max-w-[360px]">
            <label className="mb-3.5 block text-center font-body text-[11px] uppercase tracking-[0.14em] text-olive">
              Régime alimentaire / allergies
            </label>
            <div className="mb-3.5 flex flex-wrap justify-center gap-2">
              {DIET_CHIPS.map((c) => {
                const on = dietPick === c;
                return (
                  <button
                    key={c}
                    onClick={() => pickDiet(c)}
                    className={clsx(
                      'rounded-full border px-3.5 py-2 font-body text-[14px] text-ink transition-colors',
                      on ? 'border-gold bg-accent-soft' : 'border-line bg-transparent',
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <input
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="Précisez si besoin…"
              className="w-full rounded-[9px] border border-line bg-surface px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
            />
          </div>
        )}

        {stepKey === 'message' && (
          <div className="mx-auto max-w-[360px]">
            <label className="mb-3 block text-center font-body text-[11px] uppercase tracking-[0.14em] text-olive">
              Un petit mot pour les mariés
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Optionnel…"
              rows={4}
              className="w-full resize-none rounded-[9px] border border-line bg-surface px-3.5 py-3 font-body text-[16px] text-ink outline-none focus:border-olive"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-5 text-center font-body text-[14px] text-[#9a3b2e]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-7 flex justify-center gap-3">
        {stepIndex > 0 && (
          <button
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="rounded-[9px] border border-line bg-transparent px-6 py-3 font-body text-[13px] uppercase tracking-[0.14em] text-olive"
          >
            Retour
          </button>
        )}
        <button
          onClick={advance}
          disabled={nextDisabled || submitting}
          className={clsx(
            'rounded-[9px] border-none bg-olive px-7 py-3 font-body text-[13px] uppercase tracking-[0.14em] text-panel transition-opacity',
            nextDisabled || submitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          {submitting ? 'Envoi…' : nextLabel}
        </button>
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-[10px] border-[1.5px] p-4 font-body text-[17px] tracking-[0.01em] transition-colors',
        active ? 'border-olive bg-olive text-panel' : 'border-line bg-surface text-ink hover:border-olive/50',
      )}
    >
      {children}
    </button>
  );
}

function StepperButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-[20px] text-olive"
      aria-label={label === '+' ? 'Augmenter' : 'Diminuer'}
    >
      {label}
    </button>
  );
}

function Confirmation({
  attending,
  deadline,
  onEdit,
}: {
  attending: Attending;
  deadline: string | null;
  onEdit: () => void;
}) {
  const until = deadline ? `jusqu’au ${formatDeadline(deadline)}` : 'jusqu’à la date limite';
  const content =
    attending === 'no'
      ? {
          icon: '♡',
          title: 'Merci du retour',
          text: `Vous nous manquerez — merci de nous avoir prévenus. Vous pouvez modifier votre réponse ${until}.`,
        }
      : attending === 'maybe'
        ? {
            icon: '✓',
            title: 'Bien noté',
            text: `Merci ! Tenez-nous au courant dès que possible. Réponse modifiable ${until}.`,
          }
        : {
            icon: '✓',
            title: 'Quelle joie !',
            text: `Votre présence est enregistrée. Un récapitulatif a été envoyé aux mariés. Réponse modifiable ${until}.`,
          };

  return (
    <div className="py-2.5 text-center" style={{ animation: 'jlFadeUp .5s ease both' }}>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-[30px] text-ink">
        {content.icon}
      </div>
      <h3 className="font-display text-[40px] text-ink">{content.title}</h3>
      <p className="mx-auto mt-3.5 max-w-[340px] font-body text-[16px] leading-relaxed text-muted">
        {content.text}
      </p>
      <button
        onClick={onEdit}
        className="mt-6 rounded-[9px] border border-line bg-transparent px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.14em] text-olive"
      >
        Modifier ma réponse
      </button>
    </div>
  );
}
