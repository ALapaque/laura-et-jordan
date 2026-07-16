'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((x) => x.id === active.id);
    const newIndex = value.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const moving = value[oldIndex]!;
    if (moving.type !== 'section') {
      // Question : simple déplacement (peut traverser les étapes → change d'étape).
      onChange(arrayMove(value, oldIndex, newIndex));
      return;
    }

    // Étape : on déplace tout le bloc (section + ses questions jusqu'à la section suivante),
    // et on l'insère à une frontière d'étape pour garder les étapes intactes.
    let end = oldIndex + 1;
    while (end < value.length && value[end]!.type !== 'section') end++;
    if (newIndex >= oldIndex && newIndex < end) return; // lâché dans son propre bloc

    const block = value.slice(oldIndex, end);
    const rest = [...value.slice(0, oldIndex), ...value.slice(end)];
    const overIdx = rest.findIndex((x) => x.id === over.id);
    let insertAt: number;
    if (overIdx < 0) {
      insertAt = rest.length;
    } else if (rest[overIdx]!.type === 'section') {
      insertAt = overIdx; // avant l'étape cible
    } else {
      // Question cible : remonter au début de son étape…
      let s = overIdx;
      while (s > 0 && rest[s]!.type !== 'section') s--;
      if (rest[s]!.type === 'section') {
        insertAt = s;
      } else {
        // …ou, si elle est avant toute étape, poser le bloc juste avant la 1re étape
        // (les questions « avant les étapes » restent en place).
        const fs = rest.findIndex((x) => x.type === 'section');
        insertAt = fs < 0 ? rest.length : fs;
      }
    }
    onChange([...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)]);
  }

  const patchItem = (id: string, p: Partial<RsvpQuestion>) =>
    onChange(value.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const removeItem = (id: string) => onChange(value.filter((q) => q.id !== id));
  const addQuestion = () =>
    onChange([...value, { id: newId(), label: 'Nouvelle question', type: 'short_text' }]);
  const addStep = () => onChange([...value, { id: newId(), label: 'Nouvelle étape', type: 'section' }]);

  // Questions de choix / oui-non situées AVANT (ordre du formulaire) → « Afficher si ».
  function priorsFor(id: string): RsvpQuestion[] {
    const idx = value.findIndex((x) => x.id === id);
    return value
      .slice(0, idx)
      .filter((p) => p.type === 'single_choice' || p.type === 'multi_choice' || p.type === 'yes_no');
  }

  // Indentation : une question après la 1re section appartient à une étape.
  const firstSection = value.findIndex((x) => x.type === 'section');

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-bg p-4 text-center font-body text-[13px] italic text-muted">
          Aucune question. Seuls le nom, l'email et la présence seront demandés. Ajoutez des
          questions, et regroupez-les en étapes si vous le souhaitez.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {value.map((q, i) => (
              <SortableRow
                key={q.id}
                id={q.id}
                indent={q.type !== 'section' && firstSection >= 0 && i > firstSection}
              >
                {q.type === 'section' ? (
                  <SectionHeader
                    section={q}
                    onPatch={patchItem}
                    onRemove={() => removeItem(q.id)}
                  />
                ) : (
                  <QuestionCard
                    q={q}
                    priors={priorsFor(q.id)}
                    onPatch={patchItem}
                    onRemove={() => removeItem(q.id)}
                  />
                )}
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2">
        <AddBtn label="+ Ajouter une question" onClick={addQuestion} />
        <AddBtn label="+ Nouvelle étape" onClick={addStep} step />
      </div>
    </div>
  );
}

// ── Ligne triable (poignée de glisser-déposer + contenu) ──
function SortableRow({
  id,
  indent,
  children,
}: {
  id: string;
  indent: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-start gap-1.5',
        indent && 'ml-3 border-l-2 border-olive/20 pl-3',
        isDragging && 'relative z-10',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Déplacer"
        className="mt-2.5 cursor-grab px-1 text-[16px] leading-none text-sage active:cursor-grabbing"
      >
        ⠿
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ── En-tête d'étape ──
function SectionHeader({
  section,
  onPatch,
  onRemove,
}: {
  section: RsvpQuestion;
  onPatch: (id: string, p: Partial<RsvpQuestion>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-olive/25 bg-accent-soft/25 p-3">
      <span className="mb-1 block font-body text-[10px] uppercase tracking-[0.16em] text-olive">
        Étape
      </span>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <input
            value={section.label}
            onChange={(e) => onPatch(section.id, { label: e.target.value })}
            placeholder="Titre de l'étape (ex. Le gîte)"
            className={`${FIELD} w-full`}
          />
          <input
            value={section.help ?? ''}
            onChange={(e) => onPatch(section.id, { help: e.target.value || undefined })}
            placeholder="Sous-titre (optionnel)"
            className={`${FIELD} mt-2 w-full`}
          />
        </div>
        <RemoveBtn onClick={onRemove} label="Supprimer l'étape" />
      </div>
    </div>
  );
}

// ── Carte d'une question ──
function QuestionCard({
  q,
  priors,
  onPatch,
  onRemove,
}: {
  q: RsvpQuestion;
  priors: RsvpQuestion[];
  onPatch: (id: string, p: Partial<RsvpQuestion>) => void;
  onRemove: () => void;
}) {
  const isChoice = q.type === 'single_choice' || q.type === 'multi_choice';
  const isSpecial = q.type === 'headcount' || q.type === 'moments';
  const dep = priors.find((p) => p.id === q.showIf?.questionId);
  return (
    <div className="rounded-xl border border-line bg-bg p-3.5">
      <div className="flex items-start gap-2">
        <input
          value={q.label}
          onChange={(e) => onPatch(q.id, { label: e.target.value })}
          placeholder="Intitulé de la question"
          className={`${FIELD} flex-1`}
        />
        <RemoveBtn onClick={onRemove} label="Supprimer la question" />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <select
          value={q.type}
          onChange={(e) =>
            onPatch(q.id, {
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
              onChange={(e) => onPatch(q.id, { required: e.target.checked })}
              className="accent-olive"
            />
            Obligatoire
          </label>
        )}
      </div>

      {isChoice && (
        <OptionsInput options={q.options ?? []} onChange={(opts) => onPatch(q.id, { options: opts })} />
      )}

      {q.type === 'number' && (
        <div className="mt-2.5 flex gap-2">
          <input
            type="number"
            value={q.min ?? ''}
            onChange={(e) => onPatch(q.id, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="min"
            className={`${FIELD} w-24`}
          />
          <input
            type="number"
            value={q.max ?? ''}
            onChange={(e) => onPatch(q.id, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
            placeholder="max"
            className={`${FIELD} w-24`}
          />
        </div>
      )}

      {!isSpecial && (
        <input
          value={q.help ?? ''}
          onChange={(e) => onPatch(q.id, { help: e.target.value || undefined })}
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
              if (!qid) return onPatch(q.id, { showIf: undefined });
              const p = priors.find((x) => x.id === qid);
              const first = valuesOf(p!)[0] ?? '';
              onPatch(q.id, { showIf: { questionId: qid, value: first } });
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
                onChange={(e) => onPatch(q.id, { showIf: { questionId: q.showIf!.questionId, value: e.target.value } })}
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
}

/**
 * Champ des options d'un choix (unique/multiple). On conserve le texte brut saisi
 * (avec virgules et espaces) dans un état local, séparé des options stockées : sinon le
 * reformatage `options.join(', ')` à chaque frappe « avale » la virgule qu'on vient de taper.
 */
function OptionsInput({
  options,
  onChange,
}: {
  options: string[];
  onChange: (opts: string[]) => void;
}) {
  const [text, setText] = useState(() => options.join(', '));
  return (
    <input
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }}
      onBlur={() => setText(options.join(', '))}
      placeholder="Options séparées par une virgule (ex. Viande, Poisson, Végétarien)"
      className={`${FIELD} mt-2.5 w-full`}
    />
  );
}

function RemoveBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-[15px] text-muted transition-colors hover:border-[#9a3b2e] hover:text-[#9a3b2e]"
    >
      ×
    </button>
  );
}

function AddBtn({
  label,
  onClick,
  step,
}: {
  label: string;
  onClick: () => void;
  step?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'self-start rounded-[9px] border border-dashed px-4 py-2.5 font-body text-[13px] uppercase tracking-[0.1em] transition-colors',
        step
          ? 'border-olive/40 text-olive hover:bg-accent-soft/40'
          : 'border-line text-olive hover:bg-panel',
      )}
    >
      {label}
    </button>
  );
}
