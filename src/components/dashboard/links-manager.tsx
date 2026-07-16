'use client';

import { useState, useTransition } from 'react';
import { clsx } from 'clsx';
import {
  createParcoursAction,
  deleteParcoursAction,
  updateParcoursAction,
} from '@/app/dashboard/links/actions';
import { QuestionBuilder } from '@/components/dashboard/question-builder';
import { DEFAULT_QUESTIONS, type RsvpQuestion } from '@/lib/types';

interface ParcoursView {
  id: string;
  name: string;
  token: string;
  responses: number;
  momentsLabel: string;
  visibleMomentIds: string[];
  formQuestions: RsvpQuestion[];
}

export function LinksManager({
  parcours,
  moments,
  siteUrl,
}: {
  parcours: ParcoursView[];
  moments: { id: string; title: string }[];
  siteUrl: string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ParcoursView | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  function copy(token: string) {
    const url = `${base}/i/${token}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken((t) => (t === token ? null : t)), 1600);
  }

  function remove(id: string) {
    if (!confirm('Supprimer ce parcours et ses réponses ?')) return;
    startTransition(() => deleteParcoursAction(id));
  }

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-body text-[15px] italic text-muted">
          Chaque invité reçoit un lien qui n'affiche que ses moments et son formulaire.
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-[9px] border-none bg-olive px-5 py-2.5 font-body text-[13px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink"
        >
          + Nouveau parcours
        </button>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-surface">
        {parcours.length === 0 && (
          <p className="p-6 text-center font-body text-[14px] italic text-muted">
            Aucun parcours. Créez le premier lien pour vos invités.
          </p>
        )}
        {parcours.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3.5 border-b border-line px-5 py-[18px] last:border-0"
          >
            <div className="min-w-[180px] flex-1">
              <div className="font-body text-[18px] text-ink">{p.name}</div>
              <div className="mt-1 font-body text-[13px] text-muted">{p.momentsLabel}</div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <div className="font-body text-[22px] text-olive">{p.responses}</div>
                <div className="font-body text-[9px] uppercase tracking-[0.1em] text-sage">
                  réponses
                </div>
              </div>
              <div className="rounded-[7px] border border-line bg-bg px-2.5 py-1.5 font-mono text-[12px] text-sage">
                /i/{p.token}
              </div>
              <button
                onClick={() => copy(p.token)}
                className={clsx(
                  'rounded-[7px] border px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.1em] transition-colors',
                  copiedToken === p.token
                    ? 'border-gold bg-accent-soft text-[#5b5316]'
                    : 'border-line bg-transparent text-olive hover:bg-panel',
                )}
              >
                {copiedToken === p.token ? 'Copié ✓' : 'Copier'}
              </button>
              <button
                onClick={() => setEditing(p)}
                className="rounded-[7px] border border-line px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
              >
                Éditer
              </button>
              <a
                href={`${base}/i/${p.token}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-[7px] border border-line px-3.5 py-2 font-body text-[11px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
              >
                Ouvrir
              </a>
              <button
                onClick={() => remove(p.id)}
                disabled={pending}
                className="font-body text-[11px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-[#9a3b2e] disabled:opacity-50"
              >
                Suppr.
              </button>
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <ParcoursModal moments={moments} onClose={() => setCreateOpen(false)} />
      )}
      {editing && (
        <ParcoursModal moments={moments} initial={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function ParcoursModal({
  moments,
  initial,
  onClose,
}: {
  moments: { id: string; title: string }[];
  initial?: ParcoursView;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initial?.visibleMomentIds ?? moments.map((m) => m.id)),
  );
  const [questions, setQuestions] = useState<RsvpQuestion[]>(
    initial?.formQuestions ?? DEFAULT_QUESTIONS.map((q) => ({ ...q })),
  );
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    const momentIds = moments.filter((m) => selected.has(m.id)).map((m) => m.id);
    startTransition(async () => {
      if (isEdit && initial) {
        await updateParcoursAction(initial.id, { name, momentIds, formQuestions: questions });
      } else {
        await createParcoursAction({ name, momentIds, formQuestions: questions });
      }
      onClose();
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-5 backdrop-blur-[3px]"
      style={{ animation: 'jlFadeIn .2s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-[min(94vw,560px)] overflow-y-auto rounded-2xl bg-panel p-[30px] shadow-[0_24px_60px_rgba(64,57,42,0.3)]"
      >
        <div className="mb-1 font-display text-[34px] text-ink">
          {isEdit ? 'Modifier le parcours' : 'Nouveau parcours'}
        </div>
        <p className="mb-[22px] font-body text-[14px] text-muted">
          {isEdit
            ? 'Modifiez le nom, les moments visibles et le formulaire.'
            : 'Un lien unique sera généré automatiquement.'}
        </p>

        <label className="mb-1.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
          Nom du parcours
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. Famille proche"
          className="mb-[18px] w-full rounded-lg border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-ink outline-none focus:border-olive"
        />

        <label className="mb-2.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
          Moments visibles
        </label>
        <div className="mb-[26px] flex flex-wrap gap-2">
          {moments.map((m) => {
            const on = selected.has(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={clsx(
                  'rounded-full border px-3.5 py-2 font-body text-[13px] transition-colors',
                  on ? 'border-gold bg-accent-soft text-ink' : 'border-line bg-transparent text-muted',
                )}
              >
                {m.title}
              </button>
            );
          })}
          {moments.length === 0 && (
            <span className="font-body text-[13px] italic text-muted">Aucun moment créé.</span>
          )}
        </div>

        <label className="mb-2.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
          Formulaire de réponse
        </label>
        <p className="mb-3 font-body text-[13px] text-muted">
          Nom, email et présence sont toujours demandés. Ajoutez vos questions ci-dessous
          <span className="text-sage"> — ★ = champs spéciaux (stats).</span>
        </p>
        <QuestionBuilder value={questions} onChange={setQuestions} />

        <div className="mt-[26px] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-transparent px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-olive"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="rounded-lg border-none bg-olive px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
          >
            {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le lien'}
          </button>
        </div>
      </div>
    </div>
  );
}
