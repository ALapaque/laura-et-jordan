'use client';

import { useRef, useState, useTransition } from 'react';
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
import {
  addMomentPhotoAction,
  createMomentAction,
  deleteMomentAction,
  removeMomentPhotoAction,
  reorderMomentPhotosAction,
  reorderMomentsAction,
  updateMomentAction,
} from '@/app/dashboard/moments/actions';
import { momentLocation, momentTime } from '@/lib/format';
import type { Moment, MomentAsset } from '@/lib/types';

export function MomentsEditor({ initial }: { initial: Moment[] }) {
  const [items, setItems] = useState<Moment[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((m) => m.id === active.id);
    const newIndex = items.findIndex((m) => m.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(() => reorderMomentsAction(next.map((m) => m.id)));
  }

  function addMoment() {
    startTransition(async () => {
      const created = await createMomentAction('Nouveau moment');
      setItems((list) => [...list, created]);
      setEditingId(created.id);
    });
  }

  function saveMoment(id: string, patch: Partial<Moment>) {
    setItems((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setEditingId(null);
    startTransition(() =>
      updateMomentAction(id, {
        title: patch.title,
        startsAt: patch.startsAt,
        location: patch.location,
        description: patch.description,
        dressCode: patch.dressCode,
      }),
    );
  }

  function removeMoment(id: string) {
    if (!confirm('Supprimer ce moment ?')) return;
    setItems((list) => list.filter((m) => m.id !== id));
    setEditingId(null);
    startTransition(() => deleteMomentAction(id));
  }

  function setMomentMedia(id: string, media: MomentAsset[]) {
    setItems((list) => list.map((m) => (m.id === id ? { ...m, media } : m)));
  }

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-4 flex items-center justify-between">
        <p className="m-0 font-body text-[15px] italic text-muted">
          Glissez pour réordonner les moments de la journée.
        </p>
        <button
          onClick={addMoment}
          className="rounded-[9px] border border-line bg-transparent px-5 py-2.5 font-body text-[13px] uppercase tracking-[0.12em] text-olive transition-colors hover:bg-panel"
        >
          + Moment
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2.5">
            {items.map((m) => (
              <SortableMoment
                key={m.id}
                moment={m}
                editing={editingId === m.id}
                onEdit={() => setEditingId(m.id)}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => saveMoment(m.id, patch)}
                onDelete={() => removeMoment(m.id)}
                onMedia={(media) => setMomentMedia(m.id, media)}
              />
            ))}
            {items.length === 0 && (
              <p className="rounded-xl border border-line bg-surface p-6 text-center font-body text-[14px] italic text-muted">
                Aucun moment. Ajoutez-en un pour composer la journée.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableMoment({
  moment,
  editing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onMedia,
}: {
  moment: Moment;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<Moment>) => void;
  onDelete: () => void;
  onMedia: (media: MomentAsset[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: moment.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-line bg-surface px-[18px] py-4"
    >
      <div className="flex items-center gap-3.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-[16px] text-sage active:cursor-grabbing"
          aria-label="Déplacer"
        >
          ⠿
        </button>
        <div className="flex-1">
          <div className="font-body text-[18px] text-ink">{moment.title}</div>
          <div className="font-body text-[13px] text-muted">
            {momentTime(moment)} · {momentLocation(moment)}
          </div>
        </div>
        {!editing && (
          <button
            onClick={onEdit}
            className="rounded-[7px] border border-line px-3 py-1.5 font-body text-[12px] uppercase tracking-[0.1em] text-olive transition-colors hover:bg-panel"
          >
            Éditer
          </button>
        )}
      </div>

      {editing && (
        <MomentForm
          moment={moment}
          onCancel={onCancel}
          onSave={onSave}
          onDelete={onDelete}
          onMedia={onMedia}
        />
      )}
    </div>
  );
}

function MomentForm({
  moment,
  onCancel,
  onSave,
  onDelete,
  onMedia,
}: {
  moment: Moment;
  onCancel: () => void;
  onSave: (patch: Partial<Moment>) => void;
  onDelete: () => void;
  onMedia: (media: MomentAsset[]) => void;
}) {
  const [title, setTitle] = useState(moment.title);
  const [startsAt, setStartsAt] = useState(moment.startsAt ? moment.startsAt.slice(0, 16) : '');
  const [location, setLocation] = useState(moment.location ?? '');
  const [description, setDescription] = useState(moment.description);
  const [dressCode, setDressCode] = useState(moment.dressCode ?? '');
  const [uploading, startUpload] = useTransition();
  const [imgError, setImgError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPhoto(file: File | undefined) {
    if (!file) return;
    setImgError(null);
    const form = new FormData();
    form.set('file', file);
    startUpload(async () => {
      const res = await addMomentPhotoAction(moment.id, form);
      if (res.error) setImgError(res.error);
      else if (res.asset) onMedia([...moment.media, res.asset]);
    });
  }

  function removePhoto(assetId: string) {
    onMedia(moment.media.filter((a) => a.id !== assetId));
    startUpload(() => removeMomentPhotoAction(assetId));
  }

  function movePhoto(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= moment.media.length) return;
    const next = [...moment.media];
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    onMedia(next);
    startUpload(() =>
      reorderMomentPhotosAction(
        moment.id,
        next.map((a) => a.id),
      ),
    );
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-line pt-4">
      <Labeled label="Titre">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
      </Labeled>

      <Labeled label="Photos">
        <div className="flex flex-wrap items-center gap-2">
          {moment.media.map((a, i) => (
            <div
              key={a.id}
              className="relative h-[64px] w-[92px] flex-none overflow-hidden rounded-lg border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(a.id)}
                title="Retirer"
                aria-label="Retirer la photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[13px] leading-none text-panel transition-colors hover:bg-ink"
              >
                ×
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/45 px-1.5 py-0.5">
                <button
                  type="button"
                  onClick={() => movePhoto(i, -1)}
                  disabled={i === 0}
                  aria-label="Déplacer vers la gauche"
                  className="text-[14px] leading-none text-panel disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => movePhoto(i, 1)}
                  disabled={i === moment.media.length - 1}
                  aria-label="Déplacer vers la droite"
                  className="text-[14px] leading-none text-panel disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-[64px] w-[92px] flex-none items-center justify-center rounded-lg border border-dashed border-line bg-bg font-body text-[11px] uppercase tracking-[0.08em] text-olive transition-colors hover:bg-panel disabled:opacity-50"
          >
            {uploading ? '…' : '+ Photo'}
          </button>
        </div>
        {imgError && (
          <span className="mt-1.5 block font-body text-[12px] text-[#9a3b2e]">{imgError}</span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPhoto(e.target.files?.[0])}
        />
      </Labeled>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Labeled label="Date & heure">
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={fieldClass}
          />
        </Labeled>
        <Labeled label="Lieu">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={fieldClass}
          />
        </Labeled>
      </div>
      <Labeled label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${fieldClass} resize-none`}
        />
      </Labeled>
      <Labeled label="Dress code">
        <input
          value={dressCode}
          onChange={(e) => setDressCode(e.target.value)}
          className={fieldClass}
        />
      </Labeled>
      <div className="flex items-center justify-between">
        <button
          onClick={onDelete}
          className="font-body text-[12px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-[#9a3b2e]"
        >
          Supprimer
        </button>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-olive"
          >
            Annuler
          </button>
          <button
            onClick={() =>
              onSave({
                title,
                startsAt: startsAt || null,
                location: location || null,
                description,
                dressCode: dressCode || null,
              })
            }
            className="rounded-lg border-none bg-olive px-4 py-2 font-body text-[12px] uppercase tracking-[0.1em] text-panel transition-colors hover:bg-ink"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldClass =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 font-body text-[14px] text-ink outline-none focus:border-olive';

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
