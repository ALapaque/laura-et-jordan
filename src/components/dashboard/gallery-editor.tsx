'use client';

import { useRef, useState, useTransition } from 'react';
import {
  addGalleryPhotoAction,
  removeGalleryPhotoAction,
  reorderGalleryPhotosAction,
} from '@/app/dashboard/gallery/actions';
import type { MomentAsset } from '@/lib/types';
import { UPLOAD_HINT } from '@/lib/upload';

export function GalleryEditor({ initial }: { initial: MomentAsset[] }) {
  const [photos, setPhotos] = useState<MomentAsset[]>(initial);
  const [uploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPhoto(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files);
    startUpload(async () => {
      for (const file of list) {
        const form = new FormData();
        form.set('file', file);
        const res = await addGalleryPhotoAction(form);
        if (res.error) {
          setError(res.error);
          break;
        }
        const asset = res.asset;
        if (asset) setPhotos((p) => [...p, asset]);
      }
    });
  }

  function removePhoto(id: string) {
    setPhotos((p) => p.filter((a) => a.id !== id));
    startUpload(() => removeGalleryPhotoAction(id));
  }

  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    setPhotos(next);
    startUpload(() => reorderGalleryPhotosAction(next.map((a) => a.id)));
  }

  return (
    <div style={{ animation: 'jlFadeIn .3s ease' }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="m-0 font-body text-[15px] italic text-muted">
          Ces photos composent la galerie affichée sur l'invitation. Réordonnez avec ‹ ›.
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-none rounded-[9px] border border-line bg-transparent px-5 py-2.5 font-body text-[13px] uppercase tracking-[0.12em] text-olive transition-colors hover:bg-panel disabled:opacity-50"
        >
          {uploading ? '…' : '+ Photos'}
        </button>
      </div>

      <p className="mb-3 font-body text-[12px] text-sage">{UPLOAD_HINT}</p>
      {error && <p className="mb-3 font-body text-[13px] text-[#9a3b2e]">{error}</p>}

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="font-body text-[15px] italic text-muted">
            Aucune photo pour l'instant. Ajoutez-en pour composer votre galerie.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-4 rounded-[9px] border border-line px-5 py-2.5 font-body text-[13px] uppercase tracking-[0.12em] text-olive transition-colors hover:bg-panel disabled:opacity-50"
          >
            {uploading ? 'Téléversement…' : '+ Ajouter des photos'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
          {photos.map((a, i) => (
            <div
              key={a.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(a.id)}
                title="Retirer"
                aria-label="Retirer la photo"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-[15px] leading-none text-panel transition-colors hover:bg-ink"
              >
                ×
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/45 px-2 py-1">
                <button
                  type="button"
                  onClick={() => movePhoto(i, -1)}
                  disabled={i === 0}
                  aria-label="Déplacer avant"
                  className="text-[16px] leading-none text-panel disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => movePhoto(i, 1)}
                  disabled={i === photos.length - 1}
                  aria-label="Déplacer après"
                  className="text-[16px] leading-none text-panel disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onPhoto(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
