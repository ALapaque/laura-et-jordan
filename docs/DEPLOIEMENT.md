# Guide de mise en production — Laura & Jordan

Objectif : passer du **mode démo** (données en mémoire) à une vraie prod où les
réponses RSVP sont enregistrées, les mariés ont un compte, et les emails partent.

Temps estimé : ~20-30 min. Tout est gratuit (Supabase free tier + Resend free + Vercel hobby).

## ✅ Checklist

- [ ] 1. Créer le projet Supabase
- [ ] 2. Récupérer les 4 clés Supabase
- [ ] 3. Créer les tables (migrations + seed)
- [ ] 4. Créer le compte des mariés
- [ ] 5. (option) Resend pour les emails
- [ ] 6. Mettre les variables sur Vercel + redéployer
- [ ] 7. Vérifier de bout en bout
- [ ] 8. (option) Domaine + anti-pause Supabase

---

## 1. Créer le projet Supabase

1. Va sur https://app.supabase.com → **New project**.
2. **Region** : choisis l'Europe (ex. *West EU (Paris)* ou *Frankfurt*).
3. **Database Password** : génère-en un solide et **note-le** (il sert dans `DATABASE_URL`).
4. Clique **Create** et attends ~2 min que le projet soit prêt.

## 2. Récupérer les 4 clés Supabase

Dans **Settings → API** :

| Champ Supabase | Variable |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Project API keys → **anon public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Project API keys → **service_role** ⚠️ secret | `SUPABASE_SERVICE_ROLE_KEY` |

Dans **Settings → Database → Connection string** :

- Onglet **Transaction** (port **6543**) → c'est ton `DATABASE_URL` pour l'app.
- Remplace `[YOUR-PASSWORD]` par le mot de passe de l'étape 1.

```
DATABASE_URL="postgresql://postgres.[REF-PROJET]:[MOT-DE-PASSE]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```
(remplace les `[...]` par tes valeurs — surtout ne commit jamais ce fichier rempli.)

## 3. Créer les tables (migrations + seed)

Sur ta machine, dans le dossier du projet :

```bash
cp .env.example .env.local
# → colle dedans : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#   SUPABASE_SERVICE_ROLE_KEY et DATABASE_URL

npm install
npm run db:push     # crée les tables dans Supabase
npm run db:seed     # insère les données de démo + AFFICHE les liens /i/xxxx
```

> 💡 Si `db:push` échoue avec une erreur de « prepared statement », utilise pour
> **cette étape uniquement** la connexion **directe / Session pooler** (port **5432**,
> onglet *Session* dans Supabase) dans `DATABASE_URL`, puis remets le **6543** pour l'app.

Vérifie dans Supabase → **Table Editor** que les tables `wedding`, `moment`,
`parcours`, `rsvp_response`, `media` existent.

## 4. Créer le compte des mariés

Dans **Authentication → Users → Add user** :

- Email + mot de passe du couple → **Create user**. C'est **le seul** compte admin.

Puis, pour que personne d'autre ne puisse s'inscrire :
**Authentication → Sign In / Providers → Email** → désactive **Allow new users to sign up**.

## 5. (option) Resend pour les emails RSVP

Sans cette étape, les RSVP sont bien enregistrés, mais aucun email n'est envoyé.

1. Crée un compte sur https://resend.com.
2. **API Keys → Create** → copie la clé → `RESEND_API_KEY`.
3. **Domains → Add domain** → ajoute les enregistrements DNS demandés (ou, pour tester
   tout de suite, garde l'expéditeur `onboarding@resend.dev`).
4. Définis :
   ```
   RESEND_FROM=Laura & Jordan <faire-part@ton-domaine>   # doit utiliser un domaine vérifié
   NOTIFY_EMAILS=laura@exemple.be,jordan@exemple.be
   ```

## 6. Variables d'environnement sur Vercel + redéploiement

**Vercel → ton projet → Settings → Environment Variables.** Ajoute (cocher *Production* et *Preview*) :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...                         # Transaction pooler (6543)

# App
NEXT_PUBLIC_SITE_URL=https://<ton-projet>.vercel.app   # ou ton domaine
IP_HASH_SALT=...                         # openssl rand -hex 16

# Email (option)
RESEND_API_KEY=...
RESEND_FROM=Laura & Jordan <faire-part@ton-domaine>
NOTIFY_EMAILS=laura@...,jordan@...
```

> ⚠️ Les variables **`NEXT_PUBLIC_*`** sont figées **au build** → après les avoir
> ajoutées, va dans **Deployments → … → Redeploy** pour qu'elles prennent effet.

## 7. Vérifier de bout en bout

1. Ouvre `https://<ton-site>/login` → connecte-toi avec le compte des mariés → tu arrives sur le **dashboard** (le bandeau « mode démonstration » a disparu).
2. Onglet **Liens & parcours** → **+ Nouveau parcours** → copie le lien.
3. Ouvre le lien `/i/xxxx` dans un autre navigateur → réponds au RSVP.
4. Vérifie : la réponse apparaît dans **Dashboard → RSVP**, et l'email arrive (si Resend configuré).

## 8. (option) Domaine + anti-pause Supabase

- **Domaine** : Vercel → Settings → **Domains** → ajoute `mariage.tondomaine.be`, puis mets à jour `NEXT_PUBLIC_SITE_URL` et redéploie.
- **Anti-pause Supabase** (le projet gratuit se met en pause après 7 j d'inactivité) :
  GitHub → repo → **Settings → Secrets and variables → Actions** → ajoute
  `SUPABASE_URL` et `SUPABASE_ANON_KEY`. Le workflow `.github/workflows/keep-alive.yml`
  ping Supabase tous les 3 jours.

---

## 📋 Récap des variables

| Variable | Obligatoire | Où la trouver |
| --- | :---: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Settings → API (secret) |
| `DATABASE_URL` | ✅ | Supabase → Settings → Database (pooler 6543) |
| `NEXT_PUBLIC_SITE_URL` | ✅ | ton URL Vercel / domaine |
| `IP_HASH_SALT` | recommandé | `openssl rand -hex 16` |
| `RESEND_API_KEY` | option | resend.com → API Keys |
| `RESEND_FROM` | option | domaine vérifié Resend |
| `NOTIFY_EMAILS` | option | emails du couple |
| `NEXT_PUBLIC_MOTIF_SRC` | option | motif déposé dans /public |
| `NEXT_PUBLIC_ENVELOPE_VIDEO` | option | vidéo déposée dans /public |

## 🛠️ Dépannage

| Symptôme | Cause / solution |
| --- | --- |
| `relation "wedding" does not exist` | Les tables ne sont pas créées → relance `npm run db:push`. |
| Boucle de redirection vers `/login` | `NEXT_PUBLIC_SUPABASE_URL`/`ANON` manquants **au build** → ajoute-les et **redéploie**. |
| `db:push` échoue (prepared statement) | Utilise la connexion directe/Session (port **5432**) le temps de la migration. |
| Email non reçu | `RESEND_API_KEY` absente ou `RESEND_FROM` non vérifié chez Resend. |
| Le dashboard montre encore « mode démonstration » | `DATABASE_URL` non défini côté serveur, ou pas redéployé. |
