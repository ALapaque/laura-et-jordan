'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Calendrier shadcn/ui (react-day-picker) re-thémé aux couleurs du site.
// `mode="range"` peint une barre continue crème ; `mode="single"` un pastille olive.
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const isRange = props.mode === 'range';
  return (
    <DayPicker
      locale={fr}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={clsx('font-body select-none', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-3',
        month_caption: 'relative flex h-9 items-center justify-center',
        caption_label: 'font-body text-[15px] capitalize text-ink',
        nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between px-0.5',
        button_previous:
          'inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-olive transition-colors hover:bg-accent-soft disabled:opacity-30',
        button_next:
          'inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-olive transition-colors hover:bg-accent-soft disabled:opacity-30',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-9 pb-1 text-center text-[10px] font-body uppercase tracking-[0.08em] text-muted',
        weeks: '',
        week: 'mt-0.5 flex w-full',
        day: 'h-9 w-9 p-0 text-center',
        day_button:
          'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full font-body text-[14px] text-ink transition-colors hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold',
        today: '[&>button]:font-semibold [&>button]:text-olive',
        outside: 'text-muted/40',
        disabled: 'opacity-30',
        hidden: 'invisible',
        // Sélection : simple (single) vs plage (range) stylées différemment.
        ...(isRange
          ? {
              selected: '',
              range_start:
                'rounded-l-full bg-accent-soft/60 [&>button]:bg-olive [&>button]:text-panel [&>button]:hover:bg-olive',
              range_end:
                'rounded-r-full bg-accent-soft/60 [&>button]:bg-olive [&>button]:text-panel [&>button]:hover:bg-olive',
              range_middle:
                'bg-accent-soft/60 [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-ink [&>button]:hover:bg-accent-soft/80',
            }
          : {
              selected: '[&>button]:bg-olive [&>button]:text-panel [&>button]:hover:bg-olive',
            }),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => <Chevron orientation={orientation} />,
      }}
      {...props}
    />
  );
}

function Chevron({ orientation }: { orientation?: 'up' | 'down' | 'left' | 'right' }) {
  const rotate =
    orientation === 'right'
      ? 'rotate-180'
      : orientation === 'up'
        ? 'rotate-90'
        : orientation === 'down'
          ? '-rotate-90'
          : '';
  return (
    <svg
      className={clsx('h-4 w-4', rotate)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
