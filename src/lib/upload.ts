/**
 * Limite de poids d'une photo à téléverser, partagée entre la validation des
 * Server Actions et l'affichage (indice sous les boutons d'ajout).
 *
 * Plafonnée volontairement à 2,5 Mo pour garder un site rapide à charger
 * (les photos sont servies telles quelles aux invités).
 */
export const MAX_UPLOAD_MB = 2.5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Libellé français du poids max (ex. « 2,5 Mo »). */
export const MAX_UPLOAD_LABEL = `${String(MAX_UPLOAD_MB).replace('.', ',')} Mo`;

/** Indice affiché sous les sélecteurs de photo (formats + poids max). */
export const UPLOAD_HINT = `JPG, PNG ou WebP · ${MAX_UPLOAD_LABEL} max`;
