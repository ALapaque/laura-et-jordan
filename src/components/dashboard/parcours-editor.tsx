'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { createParcoursAction, updateParcoursAction } from '@/app/dashboard/links/actions';
import { QuestionBuilder } from '@/components/dashboard/question-builder';
import { DEFAULT_QUESTIONS, type RsvpQuestion } from '@/lib/types';

export function ParcoursEditor({
  moments,
  initial,
}: {
  moments: { id: string; title: string }[];
  initial?: {
    id: string;
    name: string;
    visibleMomentIds: string[];
    formQuestions: RsvpQuestion[];
    token: string;
  };
}) {
  const router = useRouter();
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

  function save() {
    const momentIds = moments.filter((m) => selected.has(m.id)).map((m) => m.id);
    startTransition(async () => {
      if (isEdit && initial) {
        await updateParcoursAction(initial.id, { name, momentIds, formQuestions: questions });
      } else {
        await createParcoursAction({ name, momentIds, formQuestions: questions });
      }
      router.push('/dashboard/links');
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[760px]" style={{ animation: 'jlFadeIn .3s ease' }}>
      <Link
        href="/dashboard/links"
        className="mb-4 inline-block font-body text-[13px] text-olive transition-colors hover:text-ink"
      >
        ← Retour aux parcours
      </Link>

      <h1 className="font-display text-[40px] leading-none text-ink">
        {isEdit ? 'Modifier le parcours' : 'Nouveau parcours'}
      </h1>
      <p className="mb-7 mt-1.5 font-body text-[15px] text-muted">
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
        className="mb-[22px] w-full rounded-lg border border-line bg-surface px-3.5 py-3 font-body text-[15px] text-ink outline-none focus:border-olive"
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
              type="button"
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

      <label className="mb-1.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
        Formulaire de réponse
      </label>
      <p className="mb-3.5 font-body text-[13px] text-muted">
        Nom, email et présence sont toujours demandés. Ajoutez vos questions ci-dessous, glissez la
        poignée <span className="text-sage">⠿</span> pour réordonner, et regroupez-les en étapes.
        <span className="text-sage"> ★ = champs spéciaux (stats).</span>
      </p>
      <QuestionBuilder value={questions} onChange={setQuestions} />

      <div className="sticky bottom-0 mt-8 flex justify-end gap-2.5 border-t border-line bg-bg/85 py-4 backdrop-blur-sm">
        <Link
          href="/dashboard/links"
          className="rounded-lg border border-line bg-transparent px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-olive"
        >
          Annuler
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg border-none bg-olive px-6 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le lien'}
        </button>
      </div>
    </div>
  );
}
