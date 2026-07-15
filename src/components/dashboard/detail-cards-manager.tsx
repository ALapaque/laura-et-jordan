'use client';

import { useRef, useState, useTransition } from 'react';
import {
  createDetailCardAction,
  deleteDetailCardAction,
  removeDetailCardImageAction,
  updateDetailCardAction,
  uploadDetailCardImageAction,
} from '@/app/dashboard/content/actions';
import { ImageSlot } from '@/components/ui/image-slot';
import type { DetailCard } from '@/lib/types';

export function DetailCardsManager({ initial }: { initial: DetailCard[] }) {
  const [cards, setCards] = useState<DetailCard[]>(initial);
  const [pending, startTransition] = useTransition();

  function addCard() {
    startTransition(async () => {
      const created = await createDetailCardAction();
      setCards((list) => [...list, created]);
    });
  }

  function patchCard(id: string, patch: Partial<DetailCard>) {
    setCards((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCard(id: string) {
    if (!confirm('Supprimer cette carte ?')) return;
    setCards((list) => list.filter((c) => c.id !== id));
    startTransition(() => deleteDetailCardAction(id));
  }

  return (
    <div
      className="rounded-[14px] border border-line bg-surface p-6"
      style={{ animation: 'jlFadeIn .3s ease' }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="font-body text-[12px] uppercase tracking-[0.16em] text-olive">
            Détails pratiques
          </div>
          <p className="mt-1 font-body text-[13px] italic text-muted">
            Lieu, tenue, accès… — le texte et la photo de chaque carte de l&apos;invitation.
          </p>
        </div>
        <button
          onClick={addCard}
          disabled={pending}
          className="flex-none rounded-[9px] border border-line bg-bg px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel disabled:opacity-50"
        >
          + Carte
        </button>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        {cards.map((c) => (
          <DetailCardEditor
            key={c.id}
            card={c}
            onPatch={(p) => patchCard(c.id, p)}
            onDelete={() => removeCard(c.id)}
          />
        ))}
        {cards.length === 0 && (
          <p className="rounded-xl border border-line bg-bg p-6 text-center font-body text-[14px] italic text-muted">
            Aucune carte. Ajoutez-en une pour les détails pratiques.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailCardEditor({
  card,
  onPatch,
  onDelete,
}: {
  card: DetailCard;
  onPatch: (patch: Partial<DetailCard>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(card.label);
  const [value, setValue] = useState(card.value);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, startUpload] = useTransition();
  const [imgError, setImgError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function save() {
    startTransition(async () => {
      await updateDetailCardAction(card.id, { label, value });
      setSaved(true);
    });
  }

  function onPhoto(file: File | undefined) {
    if (!file) return;
    setImgError(null);
    const form = new FormData();
    form.set('file', file);
    startUpload(async () => {
      const res = await uploadDetailCardImageAction(card.id, form);
      if (res.error) setImgError(res.error);
      else if (res.url) onPatch({ mediaUrl: res.url });
    });
  }

  function removePhoto() {
    startUpload(async () => {
      await removeDetailCardImageAction(card.id);
      onPatch({ mediaUrl: null });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-bg p-4">
      <div className="h-[120px] overflow-hidden rounded-lg border border-line">
        <ImageSlot src={card.mediaUrl} label={card.label || 'Photo'} alt={card.label} />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-line bg-surface px-3.5 py-1.5 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel disabled:opacity-50"
        >
          {uploading ? 'Téléversement…' : card.mediaUrl ? 'Remplacer la photo' : 'Téléverser une photo'}
        </button>
        {card.mediaUrl && !uploading && (
          <button
            type="button"
            onClick={removePhoto}
            className="font-body text-[12px] text-muted transition-colors hover:text-[#9a3b2e]"
          >
            Retirer
          </button>
        )}
      </div>
      {imgError && <span className="font-body text-[12px] text-[#9a3b2e]">{imgError}</span>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPhoto(e.target.files?.[0])}
      />

      <Labeled label="Titre">
        <input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setSaved(false);
          }}
          className={fieldClass}
        />
      </Labeled>
      <Labeled label="Texte">
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          rows={2}
          className={`${fieldClass} resize-none`}
        />
      </Labeled>

      <div className="flex items-center justify-between">
        <button
          onClick={onDelete}
          className="font-body text-[12px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-[#9a3b2e]"
        >
          Supprimer
        </button>
        <div className="flex items-center gap-2.5">
          {saved && !pending && <span className="font-body text-[13px] text-olive">Enregistré ✓</span>}
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

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-body text-[10px] uppercase tracking-[0.12em] text-sage">
        {label}
      </label>
      {children}
    </div>
  );
}
