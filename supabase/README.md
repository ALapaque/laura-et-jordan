# Supabase — mise en place SANS lancer le projet en local

Tu peux tout configurer depuis l'interface Supabase, sans rien exécuter sur ta machine.

## 1. Base de données (SQL Editor)

Dans Supabase → **SQL Editor** → **New query**, colle et exécute dans l'ordre :

1. [`01_schema.sql`](./01_schema.sql) — crée les tables, la sécurité (RLS) et le bucket `media`. **Obligatoire.**
2. [`02_seed.sql`](./02_seed.sql) — insère des données de démo + 3 liens de test. **Facultatif** (à ne lancer qu'une fois).
3. [`03_detail_cards.sql`](./03_detail_cards.sql) — active la gestion des cartes « Détails pratiques » (texte + photo) depuis le dashboard. **Recommandé** (idempotent).
4. [`04_moment_media.sql`](./04_moment_media.sql) — active les **galeries multi-photos** par moment (Dashboard → Moments). **Recommandé** (idempotent).
5. [`05_rsvp_email.sql`](./05_rsvp_email.sql) — ajoute l'**email** des invités : permet à un invité de retrouver et modifier sa réponse. **Recommandé** (idempotent).
6. [`06_gallery.sql`](./06_gallery.sql) — active la **galerie de photos** du couple (album libre, Dashboard → Galerie). **Recommandé** (idempotent).
7. [`07_dynamic_form.sql`](./07_dynamic_form.sql) — active le **formulaire RSVP dynamique par parcours** (questions personnalisées, types de champ, étapes nommées). **Recommandé** (idempotent).

> Sans le seed, l'app démarre vide : tu crées tes moments et tes parcours directement depuis le **dashboard**.
> Sans `03_detail_cards.sql`, l'invitation affiche des cartes « Détails pratiques » par défaut (texte seul, non éditables) — rien ne casse.
> Sans `04_moment_media.sql`, chaque moment garde sa photo unique existante ; l'ajout de plusieurs photos est désactivé — rien ne casse.
> Sans `05_rsvp_email.sql`, l'email saisi par l'invité n'est pas stocké et « modifier ma réponse » ne retrouve rien — rien ne casse (le reste de la réponse est bien enregistré).
> Sans `06_gallery.sql`, la galerie de photos du couple est indisponible dans le dashboard — rien ne casse.
> Sans `07_dynamic_form.sql`, chaque parcours affiche le **formulaire par défaut** et les réponses aux questions personnalisées ne sont pas enregistrées — rien ne casse.

## 2. Compte des mariés (Authentication)

Supabase → **Authentication → Users → Add user** : email + mot de passe du couple.
C'est le seul compte admin. Puis **Authentication → Sign In / Providers → Email** → décoche
**Allow new users to sign up** (personne d'autre ne pourra s'inscrire).

### Sécurité de l'accès (à vérifier, 2 minutes)

- **Inscriptions désactivées** (ci-dessus) : sans cela, n'importe qui peut se créer un
  compte Supabase avec la clé publique du site et entrer dans le dashboard.
- Dans le même écran, laisse **Allow anonymous sign-ins** désactivé.
- **Recommandé** : ajoute la variable `ADMIN_EMAILS` (email du compte des mariés) dans
  Vercel. Le dashboard n'accepte alors que ces comptes, même si un autre compte existait.
- Vérifie que la RLS protège bien les données (remplace les deux valeurs) :

  ```bash
  curl "https://xxxx.supabase.co/rest/v1/rsvp_response?select=*" -H "apikey: <clé anon>"
  ```

  Réponse attendue : `[]`. Si des réponses d'invités s'affichent, relance `01_schema.sql`.
- Si tu as lancé `02_seed.sql` : ses 3 liens de démo ont des tokens **publics** (ils sont
  dans ce dépôt). Supprime ces 3 parcours depuis Dashboard → Liens avant d'inviter.

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
ADMIN_EMAILS=laura@exemple.be               # recommandé : compte(s) autorisé(s) au dashboard
# Emails (optionnel) : SENDGRID_API_KEY, SENDGRID_FROM (Single Sender vérifié)
```

Dès que ces variables sont présentes, le site quitte le mode démo : il lit/écrit dans ta base
Supabase, `/login` authentifie le couple, et le dashboard pilote tout.

## 5. Déploiement après un merge (mise à jour du site)

Le site est déployé sur **Vercel**, branché sur le dépôt GitHub :

1. **Code — automatique.** Merger une PR dans `main` déclenche **tout seul** un déploiement
   de production. Rien à lancer.
2. **Base de données — seulement si la PR ajoute un script `NN_*.sql`.** Lance-le **une fois**
   dans Supabase → **SQL Editor** (comme au §1). Les scripts sont additifs et idempotents :
   sûrs à lancer **avant** ou après le merge (idéalement juste avant, pour que tout marche dès
   le déploiement).
3. **Variables d'environnement — rien à changer** (déjà configurées).

> Exemple (PR « formulaire dynamique ») : après le merge, lance
> [`07_dynamic_form.sql`](./07_dynamic_form.sql) une fois. Tant qu'il n'est pas lancé, le
> formulaire reste sur les questions par défaut et les réponses personnalisées ne sont pas
> stockées — rien ne casse.

## Repartir de zéro (réinitialiser les données)

```sql
truncate rsvp_response, parcours, moment, wedding restart identity cascade;
```
