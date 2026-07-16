/**
 * Limite de poids d'une photo à téléverser, partagée entre l'affichage (indice
 * sous les boutons d'ajout) et — à terme — la validation des Server Actions.
 * Alignée sur la validation actuelle (`8 * 1024 * 1024` dans les actions).
 */
export const MAX_UPLOAD_MB = 8;

/** Indice affiché sous les sélecteurs de photo (formats + poids max). */
export const UPLOAD_HINT = `JPG, PNG ou WebP · ${MAX_UPLOAD_MB} Mo max`;
