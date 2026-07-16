'use client';

import * as React from 'react';
import { format, isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Déclencheur aligné sur INPUT_CLASS du formulaire (bordure, fond, rayon identiques).
const TRIGGER =
  'flex w-full items-center justify-between gap-2 rounded-[9px] border border-line bg-surface px-3.5 py-3 text-left font-body text-[16px] text-ink outline-none transition-colors focus:border-olive data-[state=open]:border-olive';

function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}
function fromISO(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = parse(s, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
}
function pretty(d: Date, pattern = 'EEE d MMM yyyy'): string {
  return format(d, pattern, { locale: fr });
}

// ── Date simple ──────────────────────────────────────────────────
export function DateField({
  value,
  onChange,
  placeholder = 'Choisir une date',
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = fromISO(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={TRIGGER}>
        <span className={selected ? '' : 'text-muted'}>
          {selected ? pretty(selected) : placeholder}
        </span>
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) {
              onChange(toISO(d));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Plage de dates (arrivée → départ) ────────────────────────────
export function DateRangeField({
  value,
  onChange,
  placeholder = 'Choisir les dates',
}: {
  value?: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const from = fromISO(value?.[0]);
  const to = fromISO(value?.[1]);
  const label =
    from && to
      ? `${pretty(from, 'd MMM')} → ${pretty(to, 'd MMM yyyy')}`
      : from
        ? `${pretty(from, 'd MMM yyyy')} → …`
        : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={TRIGGER}>
        <span className={from ? '' : 'text-muted'}>{label}</span>
        <CalendarIcon />
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="range"
          selected={from ? { from, to } : undefined}
          defaultMonth={from}
          onSelect={(r) => {
            const next: string[] = [];
            if (r?.from) next.push(toISO(r.from));
            if (r?.to) next.push(toISO(r.to));
            onChange(next);
            // Fermer seulement quand une vraie plage (2 jours distincts) est formée ;
            // le 1er clic pose from=to → on garde le calendrier ouvert pour choisir la fin.
            if (r?.from && r?.to && r.from.getTime() !== r.to.getTime()) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Heure (liste par pas de 30 min, thémée) ──────────────────────
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 ? '30' : '00';
  return `${h}:${m}`;
});

export function TimeField({
  value,
  onChange,
  placeholder = 'Choisir une heure',
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={TRIGGER}>
        <span className={value ? '' : 'text-muted'}>{value || placeholder}</span>
        <ClockIcon />
      </PopoverTrigger>
      <PopoverContent align="start">
        <div
          data-lenis-prevent
          className="max-h-[232px] w-[128px] overflow-y-auto overscroll-contain pr-0.5"
        >
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={clsx(
                'block w-full rounded-lg px-3 py-1.5 text-left font-body text-[15px] transition-colors',
                value === t ? 'bg-olive text-panel' : 'text-ink hover:bg-accent-soft',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Icônes (SVG inline, palette olive) ───────────────────────────
function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-olive"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-olive"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
