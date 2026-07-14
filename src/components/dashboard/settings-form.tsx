'use client';

import { useState, useTransition } from 'react';
import { clsx } from 'clsx';
import { updateSettingsAction } from '@/app/dashboard/settings/actions';

interface SettingsValues {
  notifyEmails: string;
  notifyEnabled: boolean;
  rsvpDeadline: string;
  locales: string[];
  siteDomain: string;
}

const LOCALES: { id: string; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'nl', label: 'Nederlands' },
];

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [values, setValues] = useState<SettingsValues>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function set<K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function toggleLocale(id: string) {
    setValues((v) => ({
      ...v,
      locales: v.locales.includes(id) ? v.locales.filter((l) => l !== id) : [...v.locales, id],
    }));
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await updateSettingsAction({
        notifyEmails: values.notifyEmails.split(','),
        notifyEnabled: values.notifyEnabled,
        rsvpDeadline: values.rsvpDeadline || null,
        locales: values.locales,
        siteDomain: values.siteDomain || null,
      });
      setSaved(true);
    });
  }

  return (
    <div
      className="flex max-w-[520px] flex-col gap-[18px]"
      style={{ animation: 'jlFadeIn .3s ease' }}
    >
      <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[22px]">
        <div className="font-body text-[12px] uppercase tracking-[0.16em] text-olive">
          Notifications RSVP
        </div>
        <div>
          <label className="mb-1.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
            Emails de notification
          </label>
          <input
            value={values.notifyEmails}
            onChange={(e) => set('notifyEmails', e.target.value)}
            placeholder="laura@exemple.be, jordan@exemple.be"
            className="w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-olive"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-[15px] text-ink">
            Recevoir un email à chaque réponse
          </span>
          <button
            onClick={() => set('notifyEnabled', !values.notifyEnabled)}
            role="switch"
            aria-checked={values.notifyEnabled}
            className={clsx(
              'relative h-[27px] w-12 rounded-full transition-colors',
              values.notifyEnabled ? 'bg-olive' : 'bg-[rgba(92,100,65,0.3)]',
            )}
          >
            <span
              className="absolute top-[3px] h-[21px] w-[21px] rounded-full bg-panel transition-all"
              style={{ left: values.notifyEnabled ? 24 : 3 }}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[22px]">
        <div className="font-body text-[12px] uppercase tracking-[0.16em] text-olive">Général</div>
        <div>
          <label className="mb-1.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
            Date limite de réponse
          </label>
          <input
            type="date"
            value={values.rsvpDeadline}
            onChange={(e) => set('rsvpDeadline', e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 font-body text-[15px] text-ink outline-none focus:border-olive"
          />
        </div>
        <div>
          <label className="mb-2 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
            Langues
          </label>
          <div className="flex gap-2">
            {LOCALES.map((l) => {
              const on = values.locales.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggleLocale(l.id)}
                  className={clsx(
                    'rounded-full border px-4 py-2 font-body text-[14px] transition-colors',
                    on ? 'border-gold bg-accent-soft text-ink' : 'border-line bg-transparent text-muted',
                  )}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
            Domaine
          </label>
          <input
            value={values.siteDomain}
            onChange={(e) => set('siteDomain', e.target.value)}
            placeholder="mariage.example.be"
            className="w-full rounded-lg border border-line bg-bg px-3.5 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-olive"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="self-start rounded-lg border-none bg-olive px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.12em] text-panel transition-colors hover:bg-ink disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && !pending && <span className="font-body text-[13px] text-olive">Enregistré ✓</span>}
      </div>
    </div>
  );
}
