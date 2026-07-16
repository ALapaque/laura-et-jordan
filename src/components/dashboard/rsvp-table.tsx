'use client';

import { useMemo, useState, useTransition } from 'react';
import { clsx } from 'clsx';
import { deleteResponseAction, updateResponseAction } from '@/app/dashboard/rsvp/actions';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { shortDate } from '@/lib/format';
import type { Attending, RsvpAnswerValue, RsvpQuestion, RsvpResponse } from '@/lib/types';

type Filter = 'all' | Attending;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'yes', label: 'Présents' },
  { id: 'maybe', label: 'Peut-être' },
  { id: 'no', label: 'Absents' },
];

const ATTENDING_OPTS: { id: Attending; label: string }[] = [
  { id: 'yes', label: 'Oui' },
  { id: 'maybe', label: 'Peut-être' },
  { id: 'no', label: 'Non' },
];

export function RsvpTable({
  responses,
  moments,
  questionsByParcours = {},
}: {
  responses: RsvpResponse[];
  moments: { id: string; title: string }[];
  questionsByParcours?: Record<string, RsvpQuestion[]>;
}) {
  const [items, setItems] = useState<RsvpResponse[]>(responses);
  const [filter, setFilter] = useState<Filter>('all');
  const [momentFilter, setMomentFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const momentTitles = useMemo(
    () => Object.fromEntries(moments.map((m) => [m.id, m.title])),
    [moments],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter !== 'all' && r.attending !== filter) return false;
      if (momentFilter !== 'all' && !r.perMoment[momentFilter]) return false;
      if (q && !`${r.guestName} ${r.parcoursName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, momentFilter, query]);

  // Récapitulatif « présents à ce moment » (utile pour le traiteur).
  const momentStat = useMemo(() => {
    if (momentFilter === 'all') return null;
    const present = items.filter((r) => r.perMoment[momentFilter]);
    return {
      title: momentTitles[momentFilter] ?? '',
      count: present.length,
      people: present.reduce((a, r) => a + r.headcount, 0),
    };
  }, [items, momentFilter, momentTitles]);

  function applyPatch(id: string, patch: Partial<RsvpResponse>) {
    setItems((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setEditingId(null);
  }

  function removeItem(id: string) {
    setItems((list) => list.filter((r) => r.id !== id));
    setEditingId(null);
    setOpenId(null);
  }

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'rounded-full border px-3.5 py-2 font-body text-[13px] transition-colors',
                  on ? 'border-gold bg-accent-soft text-ink' : 'border-line bg-transparent text-muted',
                )}
              >
                {f.label}
              </button>
            );
          })}
          {moments.length > 0 && (
            <select
              value={momentFilter}
              onChange={(e) => setMomentFilter(e.target.value)}
              aria-label="Filtrer par moment"
              className={clsx(
                'rounded-full border px-3.5 py-2 font-body text-[13px] outline-none transition-colors focus:border-olive',
                momentFilter !== 'all'
                  ? 'border-gold bg-accent-soft text-ink'
                  : 'border-line bg-transparent text-muted',
              )}
            >
              <option value="all">Tous les moments</option>
              {moments.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="rounded-lg border border-line bg-surface px-3 py-2 font-body text-[13px] text-ink outline-none focus:border-olive"
          />
          <a
            href="/api/rsvp/export"
            className="rounded-lg border border-line bg-transparent px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
          >
            Exporter CSV
          </a>
        </div>
      </div>

      {momentStat && (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-gold/40 bg-accent-soft/40 px-4 py-2.5 font-body text-[13px] text-ink">
          <span>
            <strong className="font-medium">{momentStat.people}</strong>
            {` ${momentStat.people > 1 ? 'personnes attendues' : 'personne attendue'} à « ${momentStat.title} »`}
          </span>
          <span className="text-muted">
            {`· ${momentStat.count} réponse${momentStat.count > 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        <div className="grid grid-cols-[1.6fr_1.4fr_0.7fr_1fr] gap-2.5 bg-bg px-[18px] py-3 font-body text-[10px] uppercase tracking-[0.1em] text-sage">
          <span>Invité</span>
          <span>Parcours</span>
          <span>Pers.</span>
          <span>Statut</span>
        </div>
        {rows.length === 0 && (
          <p className="p-6 text-center font-body text-[14px] italic text-muted">
            Aucune réponse ne correspond.
          </p>
        )}
        {rows.map((r) => {
          const open = openId === r.id;
          const editing = editingId === r.id;
          const attended = Object.entries(r.perMoment)
            .filter(([, v]) => v)
            .map(([id]) => momentTitles[id] ?? id);
          const pQuestions = questionsByParcours[r.parcoursId] ?? [];
          const answerRows = Object.entries(r.answers)
            .map(([qid, val]) => {
              const q = pQuestions.find((x) => x.id === qid);
              return { key: qid, label: q?.label ?? qid, value: formatAnswer(q, val) };
            })
            .filter((a) => a.value.trim() !== '');
          return (
            <div key={r.id} className="border-b border-line last:border-0">
              <button
                onClick={() => {
                  setOpenId(open ? null : r.id);
                  setEditingId(null);
                }}
                className="grid w-full grid-cols-[1.6fr_1.4fr_0.7fr_1fr] items-center gap-2.5 px-[18px] py-3.5 text-left font-body text-[15px] text-ink transition-colors hover:bg-panel/40"
              >
                <span className="truncate">{r.guestName || 'Invité·e'}</span>
                <span className="truncate text-[13px] text-muted">{r.parcoursName}</span>
                <span>{r.headcount}</span>
                <span>
                  <StatusBadge status={r.attending} />
                </span>
              </button>
              {open && !editing && (
                <div className="grid gap-2 bg-bg/50 px-[18px] py-3.5 font-body text-[14px] text-muted">
                  <DetailRow label="Date de réponse" value={shortDate(r.createdAt)} />
                  {r.email && <DetailRow label="Email" value={r.email} />}
                  {attended.length > 0 && <DetailRow label="Moments" value={attended.join(' · ')} />}
                  {answerRows.map((a) => (
                    <DetailRow key={a.key} label={a.label} value={a.value} />
                  ))}
                  {r.dietary && <DetailRow label="Régime / allergies" value={r.dietary} />}
                  {r.message && <DetailRow label="Petit mot" value={`« ${r.message} »`} />}
                  {!r.dietary &&
                    !r.message &&
                    attended.length === 0 &&
                    answerRows.length === 0 && (
                      <span className="italic">Aucun détail supplémentaire.</span>
                    )}
                  <div>
                    <button
                      onClick={() => setEditingId(r.id)}
                      className="mt-1 rounded-lg border border-line bg-surface px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              )}
              {open && editing && (
                <ResponseEditForm
                  response={r}
                  moments={moments}
                  onSaved={(patch) => applyPatch(r.id, patch)}
                  onDelete={() => removeItem(r.id)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResponseEditForm({
  response,
  moments,
  onSaved,
  onDelete,
  onCancel,
}: {
  response: RsvpResponse;
  moments: { id: string; title: string }[];
  onSaved: (patch: Partial<RsvpResponse>) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [guestName, setGuestName] = useState(response.guestName);
  const [attending, setAttending] = useState<Attending>(response.attending);
  const [headcount, setHeadcount] = useState(response.headcount);
  const [perMoment, setPerMoment] = useState<Record<string, boolean>>({ ...response.perMoment });
  const [dietary, setDietary] = useState(response.dietary ?? '');
  const [message, setMessage] = useState(response.message ?? '');
  const [pending, startTransition] = useTransition();

  function save() {
    const patch = {
      guestName: guestName.trim() || response.guestName,
      attending,
      headcount,
      perMoment,
      dietary: dietary.trim() || null,
      message: message.trim() || null,
    };
    startTransition(async () => {
      await updateResponseAction(response.id, patch);
      onSaved(patch);
    });
  }

  function remove() {
    if (!confirm(`Supprimer la réponse de « ${response.guestName || 'cet invité'} » ?`)) return;
    startTransition(async () => {
      await deleteResponseAction(response.id);
      onDelete();
    });
  }

  return (
    <div className="grid gap-3.5 bg-bg/50 px-[18px] py-4">
      <Field label="Nom de l'invité">
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={fieldClass}
        />
      </Field>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Présence">
          <div className="flex flex-wrap gap-2">
            {ATTENDING_OPTS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setAttending(o.id)}
                className={clsx(
                  'rounded-full border px-3 py-1.5 font-body text-[13px] transition-colors',
                  attending === o.id
                    ? 'border-gold bg-accent-soft text-ink'
                    : 'border-line bg-transparent text-muted',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Nombre de personnes">
          <div className="flex items-center gap-3">
            <StepBtn onClick={() => setHeadcount((h) => Math.max(0, h - 1))} label="−" />
            <span className="min-w-[28px] text-center font-body text-[18px] text-ink">
              {headcount}
            </span>
            <StepBtn onClick={() => setHeadcount((h) => h + 1)} label="+" />
          </div>
        </Field>
      </div>

      {moments.length > 0 && (
        <Field label="Moments">
          <div className="flex flex-wrap gap-2">
            {moments.map((m) => {
              const on = !!perMoment[m.id];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPerMoment((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  className={clsx(
                    'rounded-full border px-3 py-1.5 font-body text-[13px] transition-colors',
                    on ? 'border-gold bg-accent-soft text-ink' : 'border-line bg-transparent text-muted',
                  )}
                >
                  {on ? '✓ ' : ''}
                  {m.title}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <Field label="Régime / allergies">
        <input value={dietary} onChange={(e) => setDietary(e.target.value)} className={fieldClass} />
      </Field>

      <Field label="Petit mot">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className={`${fieldClass} resize-none`}
        />
      </Field>

      <div className="flex items-center justify-between">
        <button
          onClick={remove}
          disabled={pending}
          className="font-body text-[12px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-[#9a3b2e] disabled:opacity-50"
        >
          Supprimer
        </button>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-line px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={pending}
            className="rounded-lg border-none bg-olive px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 font-body text-[14px] text-ink outline-none focus:border-olive';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
        {label}
      </label>
      {children}
    </div>
  );
}

function StepBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === '+' ? 'Augmenter' : 'Diminuer'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-[18px] text-olive transition-colors hover:bg-panel"
    >
      {label}
    </button>
  );
}

/** Formate une réponse dynamique pour l'affichage (dates, plages, choix multiples). */
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-40 flex-none text-[12px] uppercase tracking-[0.08em] text-sage">
        {label}
      </span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
