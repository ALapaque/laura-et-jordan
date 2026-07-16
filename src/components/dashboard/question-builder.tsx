'use client';

import type { RsvpQuestion, RsvpQuestionType } from '@/lib/types';

const TYPES: { value: RsvpQuestionType; label: string }[] = [
  { value: 'short_text', label: 'Texte court' },
  { value: 'long_text', label: 'Texte long' },
  { value: 'single_choice', label: 'Choix unique' },
  { value: 'multi_choice', label: 'Choix multiple' },
  { value: 'yes_no', label: 'Oui / Non' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'date_range', label: 'Plage de dates' },
  { value: 'time', label: 'Heure' },
  { value: 'headcount', label: 'Nombre de personnes ★' },
  { value: 'moments', label: 'Présence par moment ★' },
];

const FIELD =
  'rounded-lg border border-line bg-surface px-3 py-2 font-body text-[14px] text-ink outline-none focus:border-olive';

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `q-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  }
}

/** Valeurs possibles d'une question de choix / oui-non (pour la logique conditionnelle). */
function valuesOf(q: RsvpQuestion): string[] {
  if (q.type === 'yes_no') return ['Oui', 'Non'];
  if (q.type === 'single_choice' || q.type === 'multi_choice') return q.options ?? [];
  return [];
}

export function QuestionBuilder({
  value,
  onChange,
}: {
  value: RsvpQuestion[];
  onChange: (questions: RsvpQuestion[]) => void;
}) {
  function add() {
    onChange([...value, { id: newId(), label: 'Nouvelle question', type: 'short_text' }]);
  }
  function addSection() {
    onChange([...value, { id: newId(), label: 'Nouvelle étape', type: 'section' }]);
  }
  function patch(i: number, p: Partial<RsvpQuestion>) {
    onChange(value.map((q, idx) => (idx === i ? { ...q, ...p } : q)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-bg p-4 text-center font-body text-[13px] italic text-muted">
          Aucune question. Seuls le nom, l'email et la présence seront demandés.
        </p>
      )}
      {value.map((q, i) => {
        const isChoice = q.type === 'single_choice' || q.type === 'multi_choice';
        const isSpecial = q.type === 'headcount' || q.type === 'moments';
        // Questions de choix situées AVANT (pour « Afficher si », sans cycle).
        const priors = value
          .slice(0, i)
          .filter((p) => p.type === 'single_choice' || p.type === 'multi_choice' || p.type === 'yes_no');
        const dep = priors.find((p) => p.id === q.showIf?.questionId);

        // Séparateur d'étape : carte distincte (titre + sous-titre uniquement).
        if (q.type === 'section') {
          return (
            <div key={q.id} className="rounded-xl border border-olive/25 bg-accent-soft/25 p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col pt-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Monter"
                    className="text-[13px] leading-none text-sage disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label="Descendre"
                    className="text-[13px] leading-none text-sage disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex-1">
                  <span className="mb-1 block font-body text-[10px] uppercase tracking-[0.16em] text-olive">
                    — Nouvelle étape —
                  </span>
                  <input
                    value={q.label}
                    onChange={(e) => patch(i, { label: e.target.value })}
                    placeholder="Titre de l'étape (ex. Le gîte)"
                    className={`${FIELD} w-full`}
                  />
                  <input
                    value={q.help ?? ''}
                    onChange={(e) => patch(i, { help: e.target.value || undefined })}
                    placeholder="Sous-titre (optionnel)"
                    className={`${FIELD} mt-2 w-full`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Supprimer l'étape"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-[15px] text-muted transition-colors hover:border-[#9a3b2e] hover:text-[#9a3b2e]"
                >
                  ×
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={q.id} className="rounded-xl border border-line bg-bg p-3.5">
            <div className="flex items-start gap-2">
              <div className="flex flex-col pt-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Monter"
                  className="text-[13px] leading-none text-sage disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label="Descendre"
                  className="text-[13px] leading-none text-sage disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <input
                value={q.label}
                onChange={(e) => patch(i, { label: e.target.value })}
                placeholder="Intitulé de la question"
                className={`${FIELD} flex-1`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Supprimer la question"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-[15px] text-muted transition-colors hover:border-[#9a3b2e] hover:text-[#9a3b2e]"
              >
                ×
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              <select
                value={q.type}
                onChange={(e) =>
                  patch(i, {
                    type: e.target.value as RsvpQuestionType,
                    options: undefined,
                    showIf: undefined,
                    min: undefined,
                    max: undefined,
                  })
                }
                className={FIELD}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {!isSpecial && (
                <label className="flex items-center gap-1.5 font-body text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={!!q.required}
                    onChange={(e) => patch(i, { required: e.target.checked })}
                    className="accent-olive"
                  />
                  Obligatoire
                </label>
              )}
            </div>

            {isChoice && (
              <input
                value={(q.options ?? []).join(', ')}
                onChange={(e) =>
                  patch(i, {
                    options: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Options séparées par une virgule (ex. Viande, Poisson, Végétarien)"
                className={`${FIELD} mt-2.5 w-full`}
              />
            )}

            {q.type === 'number' && (
              <div className="mt-2.5 flex gap-2">
                <input
                  type="number"
                  value={q.min ?? ''}
                  onChange={(e) => patch(i, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="min"
                  className={`${FIELD} w-24`}
                />
                <input
                  type="number"
                  value={q.max ?? ''}
                  onChange={(e) => patch(i, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="max"
                  className={`${FIELD} w-24`}
                />
              </div>
            )}

            {!isSpecial && (
              <input
                value={q.help ?? ''}
                onChange={(e) => patch(i, { help: e.target.value || undefined })}
                placeholder="Texte d'aide (optionnel)"
                className={`${FIELD} mt-2.5 w-full`}
              />
            )}

            {!isSpecial && priors.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 font-body text-[13px] text-muted">
                <span>Afficher si</span>
                <select
                  value={q.showIf?.questionId ?? ''}
                  onChange={(e) => {
                    const qid = e.target.value;
                    if (!qid) return patch(i, { showIf: undefined });
                    const p = priors.find((x) => x.id === qid);
                    const first = valuesOf(p!)[0] ?? '';
                    patch(i, { showIf: { questionId: qid, value: first } });
                  }}
                  className={FIELD}
                >
                  <option value="">(toujours)</option>
                  {priors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label || '(sans titre)'}
                    </option>
                  ))}
                </select>
                {q.showIf && dep && (
                  <>
                    <span>=</span>
                    <select
                      value={q.showIf.value}
                      onChange={(e) => patch(i, { showIf: { questionId: q.showIf!.questionId, value: e.target.value } })}
                      className={FIELD}
                    >
                      {valuesOf(dep).map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={add}
          className="rounded-[9px] border border-dashed border-line bg-transparent px-4 py-2.5 font-body text-[13px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
        >
          + Ajouter une question
        </button>
        <button
          type="button"
          onClick={addSection}
          className="rounded-[9px] border border-dashed border-olive/40 bg-transparent px-4 py-2.5 font-body text-[13px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-accent-soft/40"
        >
          + Nouvelle étape
        </button>
      </div>
    </div>
  );
}
