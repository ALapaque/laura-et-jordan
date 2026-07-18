# Laura & Jordan — site d'invitation de mariage

Site d'invitation de mariage digitale : une invitation premium mobile-first (ouverture façon
enveloppe, RSVP dynamique) et un tableau de bord privé pour les mariés. Chaque invité reçoit un
lien opaque qui n'affiche que les moments qui le concernent.

> Projet personnel, non commercial. Un seul mariage, un seul compte admin.

## ✨ Fonctionnalités

- **Invitation par parcours** — `/i/[token]` (SSR). Un token opaque → les moments visibles + la
  config RSVP de ce parcours. Aucune liste de parcours n'est jamais exposée publiquement.
- **Ouverture façon enveloppe** — cachet de cire « L ∞ J » animé (GSAP), scroll fluide (Lenis),
  apparitions au scroll. Progressive enhancement : le contenu est rendu côté serveur et présent
  dans le DOM pendant l'intro. Respecte `prefers-reduced-motion` et se souvient de l'intro déjà vue.
- **RSVP multi-étapes** — présence → nom(s) & nombre → moments → régime → petit mot, piloté par la
  config du parcours. Validation Zod partagée client + serveur. Notification email aux mariés
  (SendGrid). Re-soumission possible (upsert par parcours + nom).
- **Tableau de bord** — vue d'ensemble (KPIs + graphiques), liens & parcours (création + copie de
  lien), suivi RSVP (filtres, recherche, détail, export CSV), éditeur de contenu avec aperçu live,
  moments réordonnables (dnd-kit), paramètres.

## 🧱 Stack

| Domaine | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19.2, Server Components, SSR, Turbopack) |
| Langage | TypeScript strict |
| Base de données | Postgres (Supabase) via **Drizzle ORM** + `drizzle-kit` |
| Auth | Supabase Auth (`@supabase/ssr`, cookies httpOnly) — compte admin unique |
| Stockage | Supabase Storage (bucket `media`) |
| Style | Tailwind CSS v4 + variables CSS (design tokens) |
| Polices | `next/font` (auto-hébergées) |
| Motion | GSAP + Lenis |
| Email | SendGrid (API, Single Sender) |
| OG images | `next/og` (dynamique par parcours) |
| Validation | Zod (schémas partagés) |
| Déploiement | Docker (`output: 'standalone'`) + Coolify |

## 🚀 Démarrage rapide (mode démo, sans backend)

```bash
npm install
npm run dev
```

Sans variables d'environnement, l'app tourne en **mode démonstration** :

- données de seed en mémoire (mariage, moments, 3 parcours, réponses factices) ;
- les emails RSVP sont loggés dans la console au lieu d'être envoyés ;
- le tableau de bord est accessible librement (auth Supabase désactivée).

Liens de démo à ouvrir :

- `/i/ax7f9k2m` — Journée complète
- `/i/q3m8t1zv` — Apéro & Dîner
- `/i/k9v2p7wd` — Cérémonie
- `/dashboard` — tableau de bord · `/login` — connexion

Ajoutez `?preview=1` pour rejouer l'intro à chaque visite.

## ⚙️ Configuration (production)

Copiez `.env.example` en `.env.local` et renseignez :

```bash
# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # serveur uniquement
DATABASE_URL=                     # connection string du pooler Supabase

# Email (sendgrid.com — « Single Sender » vérifié, aucun domaine requis)
SENDGRID_API_KEY=
SENDGRID_FROM="Laura & Jordan <lauraetjordan@exemple.be>"   # = l'adresse Single Sender vérifiée
# Destinataires : définis dans le dashboard → Paramètres (table wedding.notify_emails)

# App
NEXT_PUBLIC_SITE_URL=https://mariage.example.be
IP_HASH_SALT=                     # openssl rand -hex 16
```

Dès que `DATABASE_URL` est défini, l'app bascule automatiquement sur Postgres ; dès que les clés
Supabase sont définies, le middleware protège `/dashboard/**` et `/login` authentifie.

### Base de données (Drizzle)

```bash
npm run db:generate   # génère les migrations SQL depuis src/db/schema.ts
npm run db:migrate    # applique les migrations
# ou, en dev : npm run db:push
npm run db:seed       # insère le contenu de démo (affiche les tokens générés)
```

### Supabase — mise en place

1. Créez un projet Supabase (gratuit).
2. Copiez les clés API + la connection string du **pooler** (mode transaction) dans `.env.local`.
3. Appliquez les migrations Drizzle (ci-dessus).
4. Créez un bucket Storage `media` (privé → URLs signées, ou public + cache agressif).
5. Créez l'utilisateur admin (le couple) dans Authentication → Users.
6. Optionnel : activez la RLS si vous exposez l'API Supabase côté client. Ici la logique sensible
   reste côté serveur (Server Actions / Route Handlers), la clé service-role n'est jamais exposée.

## 📁 Structure

```
src/
  app/
    page.tsx                     page neutre (jamais la liste des parcours)
    i/[token]/                   invitation SSR + opengraph-image
    login/                       Supabase Auth
    dashboard/                   overview, links, rsvp, content, moments, settings (+ actions.ts)
    api/rsvp/route.ts            endpoint RSVP public (Zod + rate-limit + email)
    api/rsvp/export/route.ts     export CSV (admin)
  components/  invitation/  dashboard/  ui/
  db/          schema.ts  index.ts  seed.ts  demo-data.ts
  lib/         supabase/  email.ts  rsvp-schema.ts  tokens.ts  storage.ts  rate-limit.ts  queries.ts
middleware.ts                    refresh session Supabase + garde /dashboard
next.config.ts                   output standalone + headers/CSP
Dockerfile · docker-compose.yml
.github/workflows/keep-alive.yml ping Supabase toutes les 3 jours
```

## 🐳 Déploiement

### Docker local

```bash
docker compose up --build
# → http://localhost:3000
```

### Coolify (self-hosted)

1. Nouveau service → source Git de ce dépôt.
2. Build pack : **Dockerfile**.
3. Renseignez les variables d'environnement (voir ci-dessus).
4. Port exposé : `3000`.
5. Déployez. Supabase reste hébergé chez Supabase.

### Anti-pause Supabase

Le workflow `.github/workflows/keep-alive.yml` ping l'API REST toutes les 3 jours. Ajoutez les
secrets `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans les paramètres Actions du dépôt.

## 🔐 Sécurité & vie privée

- Liens en token opaque base62 (jamais dérivé du nom) ; aucune donnée perso en query string.
- `POST /api/rsvp` : Zod strict + rate-limit (token bucket) + `ip_hash` salé (jamais d'IP en clair).
- Headers de sécurité + CSP dans `next.config.ts` (adaptés aux domaines Supabase). Une CSP stricte
  à nonce peut être ajoutée dans `middleware.ts`.
- Session admin en cookies httpOnly (`@supabase/ssr`), rafraîchie dans le middleware.
- RGPD-léger : mention d'info sur le formulaire, aucun tracking tiers, données supprimables depuis
  le dashboard.

## 📋 Qualité

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write
```

## 📝 À fournir plus tard (n'empêche pas le build)

Date & lieu définitifs, horaires des moments, photos + petite(s) boucle(s) vidéo, la police finale,
les emails de notification réels, le domaine.

**Assets design exacts (motif & vidéo d'enveloppe)** : le motif toile de Jouy et la vidéo
d'ouverture d'enveloppe du projet Claude Design dépassent la limite d'import de l'outil (256 Ko)
et ne peuvent pas être récupérés automatiquement. En attendant, le site rend un motif SVG fidèle
et une ouverture d'enveloppe animée. Pour coller **exactement** au design, déposez les fichiers
dans `/public` et renseignez :

```bash
NEXT_PUBLIC_MOTIF_SRC=/motif.png         # remplace le motif SVG par la vraie image
NEXT_PUBLIC_ENVELOPE_VIDEO=/envelope.webm # remplace l'animation par la vraie vidéo
```
