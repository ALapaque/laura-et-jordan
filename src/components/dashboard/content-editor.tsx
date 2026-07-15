'use client';

import { useState, useTransition } from 'react';
import { updateContentAction } from '@/app/dashboard/content/actions';
import { MotifBackground } from '@/components/ui/motif-background';

interface ContentValues {
  coupleNames: string;
  eventDate: string; // yyyy-mm-dd | ''
  venue: string;
  welcomeText: string;
}

export function ContentEditor({ initial }: { initial: ContentValues }) {
  const [values, setValues] = useState<ContentValues>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function set<K extends keyof ContentValues>(key: K, value: ContentValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateContentAction({
        coupleNames: values.coupleNames,
        eventDate: values.eventDate || null,
        venue: values.venue || null,
        welcomeText: values.welcomeText,
      });
      setSaved(true);
    });
  }

  const datePreview = values.eventDate
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(values.eventDate),
      )
    : '[ Date à confirmer ]';

  return (
    <div
      className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5"
      style={{ animation: 'jlFadeIn .3s ease' }}
    >
      <div className="flex flex-col gap-[18px] rounded-[14px] border border-line bg-surface p-6">
        <div className="font-body text-[12px] uppercase tracking-[0.16em] text-olive">
          Éditeur de contenu
        </div>

        <Field label="Noms du couple">
          <input
            value={values.coupleNames}
            onChange={(e) => set('coupleNames', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={values.eventDate}
            onChange={(e) => set('eventDate', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Lieu">
          <input
            value={values.venue}
            onChange={(e) => set('venue', e.target.value)}
            placeholder="Le lieu vous sera bientôt dévoilé"
            className={inputClass}
          />
        </Field>

        <Field label="Mot d'accueil">
          <textarea
            value={values.welcomeText}
            onChange={(e) => set('welcomeText', e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending}
            className="self-start rounded-lg border-none bg-olive px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {saved && !pending && (
            <span className="font-body text-[13px] text-olive">Enregistré ✓</span>
          )}
        </div>
      </div>

      {/* Aperçu live du hero mobile */}
      <div className="flex flex-col items-center gap-3">
        <div className="font-body text-[11px] uppercase tracking-[0.16em] text-sage">
          Aperçu live
        </div>
        <div className="relative h-[420px] w-[230px] overflow-hidden rounded-[26px] border-8 border-ink bg-bg shadow-[0_16px_40px_rgba(64,57,42,0.2)]">
          <MotifBackground className="opacity-85" patternId="preview-jouy" />
          <div className="relative z-[1] flex h-full flex-col items-center justify-center gap-2.5 px-5 text-center">
            <span className="font-body text-[8px] uppercase tracking-[0.3em] text-olive">
              Invitation mariage
            </span>
            <span className="font-display text-[34px] leading-[0.9] text-ink">
              {values.coupleNames}
            </span>
            <span className="font-body text-[9px] uppercase tracking-[0.2em] text-ink">
              {datePreview}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 font-body text-[15px] text-ink outline-none focus:border-olive';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
        {label}
      </label>
      {children}
    </div>
  );
}
