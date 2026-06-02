# CLAUDE.md — Maison Locht · Pré-vente
> Lire en entier avant de toucher du code.

---

## Stack

| Couche | Outil |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styles | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth | Supabase Auth |
| Base de données | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Langage | TypeScript |
| Emails | Resend |
| Smooth scroll | Lenis |
| Animations React | Framer Motion |
| Animations scroll | GSAP + ScrollTrigger (post-launch) |
| 3D background | React Three Fiber (post-launch) |

---

## Contexte Marque

**Maison Locht** — fondatrice Belgo-Haïtienne, grandi Sénégal / Congo / Guinée.
Matières : wax, pagnes (Afrique du Sud, Sénégal), tissé fouta Guinée.
Patchworks linéaires = routes = hommage à Haïti (pays inaccessible).
Héritage vivant — passé et présent, culture et liberté.

**Collection LOCHT 01 — LES CERNES**
| Sac | Format | Prix |
|---|---|---|
| Le Kouna | Le Petit | 285 CAD |
| Le Kami | Le Moyen | 328 CAD |
| Le Nafibe | Le Grand | 395 CAD |

Règles produit : Canada uniquement · Max 2 par commande · Pièces uniques jamais reproduites.

---

## Flow Commande

```
1. Landing → client choisit sac → formulaire 3 étapes
2. Étape 1 : sélection sac + quantité (visuel)
3. Étape 2 : prénom, email, adresse, langue, "Qu'est-ce qui t'a attiré ?" (optionnel)
4. Étape 3 : confirmation + code référence généré (ML-2026-001)
5. Email auto Resend → instructions virement + code référence
6. Client → /commande/[code] → tracker son statut
7. Admin → /admin → voir commandes → changer statut → envoyer email
```

Statuts : `pending` → `payment_received` → `confirmed` → `shipped`

---

## Architecture

```
app/
├── page.tsx                        ← Landing + formulaire intégré
├── commande/[code]/page.tsx        ← Tracking client
├── admin/
│   ├── page.tsx                    ← Dashboard commandes
│   └── layout.tsx                  ← Auth guard Supabase
└── api/
    ├── orders/route.ts             ← POST nouvelle commande
    ├── orders/[code]/route.ts      ← GET statut
    └── send-email/route.ts         ← POST email admin

lib/
├── supabase.ts
├── resend.ts
└── generate-ref.ts                 ← format ML-YYYY-###

components/
├── ui/                             ← shadcn
├── form/                           ← FormStep1, FormStep2, FormStep3
├── admin/                          ← OrderTable, StatusBadge, EmailModal
└── landing/                        ← Hero, Collection, Story, Nav, Footer
```

**Table Supabase `orders` :**
```sql
id           uuid PK
reference    text UNIQUE          -- ML-2026-001
status       text                 -- pending | payment_received | confirmed | shipped
bag_name     text
quantity     int
price_total  numeric
first_name   text
email        text
phone        text
address      text
lang         text                 -- fr | en
why_locht    text                 -- optionnel, connexion marque
created_at   timestamptz
paid_at      timestamptz
```

RLS : activé. Lecture admin uniquement sauf GET /commande/[code] (public limité).

---

## Design System

**Direction visuelle :** B — Crème & Bleu Marine · Luxe éditorial structuré.
Références : magazines belges, Loro Piana, Brunello Cucinelli.
Storytelling section : citation centrée (Option B) + fond bleu + accents or (Option A).

### Couleurs (CSS variables)
```
--blue:       #043672   dominant
--blue-mid:   #0a4d9e   hover
--blue-deep:  #021f45   fonds sombres
--cream:      #faf7f2   background principal
--warm:       #f0ebe0   background secondaire
--gold:       #b8965a   accent principal
--gold-light: #d4aa6a   accent sur fond sombre
--muted:      #7a7a8a   texte secondaire
--text:       #1a1a2e   texte principal
page-bg:      #ede8df
```

### Typographie
```
Display / Headings : Cormorant Garamond (200, 300, italic)
Body / UI          : DM Sans (300, 400)
Labels             : DM Sans uppercase, letter-spacing élevé
Mono               : JetBrains Mono
```

### Animations — Règles
- Lenis lerp 0.08 — smooth scroll, désactivé mobile
- Framer Motion : hover, mount, page transitions
- CSS reveals : opacity + translateY, 600ms, cubic-bezier(.16,1,.3,1)
- Stagger max 0.12s — jamais dépasser 800ms total au chargement
- Cursor : dot 6px + ring 32px lerp, mix-blend-mode difference sur fond sombre
- GSAP SplitText + ScrollTrigger : post-launch
- 3D React Three Fiber : post-launch (section story background)
- Règle absolue : chaque animation a un rôle narratif, rien de décoratif

### Espacements Tailwind
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

---

## Règles Composants

- Un composant = un fichier
- Props typées TypeScript (jamais `any`)
- Tailwind uniquement — zéro style inline
- Composants réutilisables → `/components/ui/`
- Pages → `/app/`
- Logique métier → `/lib/`

---

## À ne pas faire

- ❌ `any` TypeScript
- ❌ Secrets dans le code
- ❌ `console.log` en production
- ❌ Requêtes SQL côté client
- ❌ Endpoint sans validation (Zod)
- ❌ RLS désactivé Supabase
- ❌ Commentaires évidents — WHY non-obvious seulement

---

## Admin

- 2 utilisateurs (fondatrice + collaboratrice)
- Auth Supabase email/password
- Mobile + desktop (responsive prioritaire)
- Route protégée `/admin` via layout auth guard

---

## Workflow Obligatoire

1. **Set the scene** — contexte + fichiers avant toute action
2. **One feature → test → approve → commit → repeat**
3. **Diagnose before fix** — root cause + fichiers. Zéro code sans accord
4. **Run before deploy** — lancer l'app, vérifier, puis audit
5. **Explain** — quoi + pourquoi, intelligent mais non-dev

## Style de Réponse (Claude)

- Phrases 3–6 mots. Zéro remplissage
- Outils d'abord → résultat → stop
- Ne pas narrer le processus
- Mauvais : "la solution est d'utiliser async" / Bon : "utilise async"

---

## Sécurité Checklist (avant deploy)

- [ ] Aucun secret exposé
- [ ] Endpoints validés (Zod)
- [ ] RLS activé toutes tables
- [ ] Variables d'env dans Vercel Dashboard
- [ ] `.env.local` dans `.gitignore`
- [ ] Inputs sanitisés

---

## État du Projet — LIVRÉ ✅

Site complet, déployé et testé en production. Le code Next.js est **à la racine du repo** (plus dans `maison-locht/`).

**En ligne** : https://prevente.maisonlocht.com · **Admin** : /admin · **Repo** : DKsavage/Prevente_MaisonLocht (privé)

---

## Démarrage rapide (après `git pull` sur une autre machine)

```bash
npm install                 # installer les dépendances
cp .env.example .env.local  # puis remplir les vraies valeurs (voir Vercel → Settings → Env Vars)
npm run dev                 # lancer en local → http://localhost:3000
```

Scripts : `npm run dev` (dev), `npm run build` (build prod), `npm run lint`, `npx tsc --noEmit` (vérif types).
Workflow : modifier → `npx tsc --noEmit` → commit → `git push` → Vercel redéploie automatiquement.

**Node 18+ requis.** Les secrets ne sont PAS dans le repo (`.env.local` est gitignored) — les récupérer dans Vercel → Settings → Environment Variables.

---

## Architecture as-built

```
app/
├── page.tsx                       Landing (Nav, Hero, Collection, Story, Commander)
├── commande/[code]/page.tsx       Suivi client (timeline statut, auto-refresh 30s)
├── admin/
│   ├── page.tsx                   Accueil dashboard (résumé, alertes)
│   ├── commandes/page.tsx         Gestion commandes
│   ├── inventaire/page.tsx        Inventaire pièces
│   ├── statistiques/page.tsx      Stats (trafic, ventes, conversion…)
│   ├── login/page.tsx             Connexion Supabase Auth
│   └── actions.ts                 Server actions admin (statut, suivi, notes, emails, pièces)
└── api/
    ├── orders/route.ts            POST commande (réservation atomique + emails)
    ├── orders/[code]/route.ts     (suivi)
    ├── pieces/route.ts            GET inventaire public
    ├── track/route.ts             POST visite (analytics maison)
    └── address-search/route.ts    Autocomplete adresse mondiale (Nominatim)

lib/  supabase.ts (browser) · supabase-server.ts (service role) · supabase-auth.ts (cookies)
      schemas.ts (Zod) · models.ts (pièces) · payment.ts · carriers.ts
      email-from.ts · email-confirmation.ts · generate-ref.ts · countries.ts

components/ landing/ · form/ · admin/ · SiteChrome · VisitTracker · AutoRefresh
middleware.ts  (protège /admin + allowlist ADMIN_EMAILS)
```

**Tables Supabase** : `orders`, `pieces` (inventaire anti-double-vente), `visits` (analytics), `rate_limits` (+ RPC `check_rate_limit`). Storage bucket `bags` (upload images). Fonction SQL : `check_rate_limit`.

---

## Variables d'environnement (voir `.env.example`)
`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `RESEND_API_KEY` (compte Resend où maisonlocht.com est vérifié) · `NEXT_PUBLIC_SITE_URL` · `ADMIN_EMAILS` (allowlist) · `ADMIN_NOTIFY_EMAIL`. En test : `RESEND_TEST_EMAIL` redirige tous les emails.

---

## Infra & règles métier critiques
- **Emails** : envoyés depuis `ml@maisonlocht.com` (constante `lib/email-from.ts`). Le domaine est vérifié sur un compte Resend **séparé** → `RESEND_API_KEY` Vercel doit être de CE compte.
- **DNS Namecheap** : Custom MX = `mx1/mx2.privateemail.com` (@) + `send`→amazonses (Resend) ; ne pas remettre en "Private Email" sinon Resend casse.
- **Paiement** : Canada=Interac (réponse sécurité `Cernes`+4 chiffres par commande), reste du monde=virement belge (IBAN BE98 0636 5034 2393).
- **Pièces uniques** : réservation atomique → jamais de double-vente. Ventes boutique = `sold` + `order_ref` null (préserver au nettoyage DB).
- **Matières** : Cuir végétal · Batik · Pagne tissé du Fouta. **Vente finale** (ni reprise ni échange, ajustements possibles).
