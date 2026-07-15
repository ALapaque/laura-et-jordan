# Supabase — mise en place SANS lancer le projet en local

Tu peux tout configurer depuis l'interface Supabase, sans rien exécuter sur ta machine.

## 1. Base de données (SQL Editor)

Dans Supabase → **SQL Editor** → **New query**, colle et exécute dans l'ordre :

1. [`01_schema.sql`](./01_schema.sql) — crée les tables, la sécurité (RLS) et le bucket `media`. **Obligatoire.**
2. [`02_seed.sql`](./02_seed.sql) — insère des données de démo + 3 liens de test. **Facultatif** (à ne lancer qu'une fois).
3. [`03_detail_cards.sql`](./03_detail_cards.sql) — active la gestion des cartes « Détails pratiques » (texte + photo) depuis le dashboard. **Recommandé** (idempotent).
4. [`04_moment_media.sql`](./04_moment_media.sql) — active les **galeries multi-photos** par moment (Dashboard → Moments). **Recommandé** (idempotent).
5. [`05_rsvp_email.sql`](./05_rsvp_email.sql) — ajoute l'**email** des invités : permet à un invité de retrouver et modifier sa réponse. **Recommandé** (idempotent).

> Sans le seed, l'app démarre vide : tu crées tes moments et tes parcours directement depuis le **dashboard**.
> Sans `03_detail_cards.sql`, l'invitation affiche des cartes « Détails pratiques » par défaut (texte seul, non éditables) — rien ne casse.
> Sans `04_moment_media.sql`, chaque moment garde sa photo unique existante ; l'ajout de plusieurs photos est désactivé — rien ne casse.
> Sans `05_rsvp_email.sql`, l'email saisi par l'invité n'est pas stocké et « modifier ma réponse » ne retrouve rien — rien ne casse (le reste de la réponse est bien enregistré).

## 2. Compte des mariés (Authentication)

Supabase → **Authentication → Users → Add user** : email + mot de passe du couple.
C'est le seul compte admin. Puis **Authentication → Sign In / Providers → Email** → décoche
**Allow new users to sign up** (personne d'autre ne pourra s'inscrire).

## 3. Storage

Le bucket public **`media`** est créé par `01_schema.sql` (motif, musique, photos).
Rien de plus à faire — les uploads du dashboard s'y déposent.

## 4. Variables d'environnement (Vercel)

Récupère dans Supabase → **Settings → API** et **Settings → Database**, puis mets-les dans
**Vercel → Settings → Environment Variables** (Production + Preview), et **redéploie** :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # secret
DATABASE_URL=postgresql://postgres.[REF]:[MOT_DE_PASSE]@aws-0-[REGION].pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SITE_URL=https://ton-domaine
IP_HASH_SALT=...                            # une longue chaîne aléatoire
# Emails (optionnel) : RESEND_API_KEY, RESEND_FROM, NOTIFY_EMAILS
```

Dès que ces variables sont présentes, le site quitte le mode démo : il lit/écrit dans ta base
Supabase, `/login` authentifie le couple, et le dashboard pilote tout.

## Repartir de zéro (réinitialiser les données)

```sql
truncate rsvp_response, parcours, moment, wedding restart identity cascade;
```
