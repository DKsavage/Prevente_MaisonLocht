# Maison Locht — Pré-vente LOCHT 01 · LES CERNES

Site de pré-vente de luxe (pièces uniques artisanales) — Next.js 16 · Supabase · Resend · Vercel.

**En ligne :** https://prevente.maisonlocht.com · **Admin :** /admin · **Repo :** DKsavage/Prevente_MaisonLocht (privé)

---

## Installation sur une nouvelle machine

```bash
# 1. Cloner le repo
git clone https://github.com/DKsavage/Prevente_MaisonLocht.git
cd Prevente_MaisonLocht

# 2. Installer les dépendances
npm install          # Node 18+ requis

# 3. Variables d'environnement
cp .env.example .env.local
# → Ouvrir .env.local et remplir avec les valeurs de :
#   Vercel → Settings → Environment Variables

# 4. Lancer en local
npm run dev          # http://localhost:3000
```

> **Les secrets ne sont PAS dans le repo.** Récupère-les dans Vercel → Settings → Environment Variables.

---

## Variables d'environnement requises

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur uniquement) |
| `RESEND_API_KEY` | Clé Resend (compte où maisonlocht.com est vérifié) |
| `NEXT_PUBLIC_SITE_URL` | URL du site (ex: https://prevente.maisonlocht.com) |
| `ADMIN_EMAILS` | Liste emails admin séparés par virgule |
| `ADMIN_NOTIFY_EMAIL` | Email notifié à chaque nouvelle commande |
| `RESEND_TEST_EMAIL` | (optionnel) Redirige tous les emails en dev |

---

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement local |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Vérification TypeScript sans compilation |

---

## Workflow de modification

```bash
# Modifier le code…
npx tsc --noEmit                          # vérifier les types
git add <fichiers> && git commit -m "..." # committer
git push                                  # Vercel redéploie automatiquement
```

---

## Architecture

```
app/
├── page.tsx                       Landing (Nav, Hero, Collection, Story, Commander, Footer)
├── commande/[code]/page.tsx       Suivi client — miroir why_locht + timeline statut
├── admin/
│   ├── page.tsx                   Dashboard — KPI, alertes, commandes récentes + QuickAction
│   ├── commandes/page.tsx         Gestion commandes — filtres, search, tri, export CSV
│   ├── inventaire/page.tsx        Inventaire pièces (images Supabase Storage)
│   ├── statistiques/page.tsx      Stats — trafic, ventes, entonnoir, classements
│   ├── login/page.tsx             Connexion — split-screen éditorial
│   ├── layout.tsx                 Métadonnées admin (noindex)
│   ├── loading.tsx                Skeleton accueil
│   └── actions.ts                 Server actions (statut, suivi, notes, emails, pièces)
├── admin/commandes/loading.tsx    Skeleton commandes
├── admin/inventaire/loading.tsx   Skeleton inventaire
├── admin/statistiques/loading.tsx Skeleton statistiques
└── api/
    ├── orders/route.ts            POST commande (réservation atomique + emails auto)
    ├── orders/[code]/route.ts     GET statut public
    ├── pieces/route.ts            GET inventaire public
    ├── track/route.ts             POST visite (analytics maison, anonyme)
    └── address-search/route.ts    Autocomplete adresse mondiale (Nominatim)

lib/
├── supabase.ts          Client browser
├── supabase-server.ts   Client serveur (service role)
├── supabase-auth.ts     Client avec cookies (middleware)
├── schemas.ts           Validation Zod (commandes, adresses)
├── models.ts            Métadonnées pièces (noms, dimensions, prix)
├── payment.ts           Détection méthode paiement (Interac / virement)
├── carriers.ts          Transporteurs + URL de suivi
├── email-from.ts        Constante expéditeur (ml@maisonlocht.com)
├── email-confirmation.ts Template email confirmation commande
├── generate-ref.ts      Générateur référence LOCHT-YYYY-###
├── countries.ts         Liste pays FR/EN
└── time.ts              Formatage temps relatif (timeAgo)

components/
├── landing/
│   ├── Nav.tsx           Navigation sticky + menu mobile full-screen
│   ├── Hero.tsx          Section hero — split image/texte, badge count-up
│   ├── Collection.tsx    Galerie sacs — drawer détail, thumbnails
│   ├── Story.tsx         Section histoire — citation, photo éditoriale
│   ├── Commander.tsx     Conteneur formulaire de commande
│   ├── Footer.tsx        Pied de page — mentions légales luxe
│   ├── LangContext.tsx   Contexte FR/EN
│   ├── LenisProvider.tsx Smooth scroll Lenis
│   ├── PiecesProvider.tsx Données pièces partagées
│   ├── Cursor.tsx        Curseur custom (desktop)
│   └── ScrollToTop.tsx   Bouton retour en haut
├── form/
│   ├── OrderForm.tsx     Orchestrateur 3 étapes + succès
│   ├── FormStep1.tsx     Sélection sac + quantité
│   ├── FormStep2.tsx     Informations client + adresse
│   ├── FormStep3.tsx     Confirmation + paiement
│   └── AddressAutocomplete.tsx Autocomplete Nominatim
├── admin/
│   ├── AdminShell.tsx        Shell admin — header, nav onglets, bottom nav mobile
│   ├── AdminSkeletonShell.tsx Header statique pour les skeletons
│   ├── OrdersTable.tsx       Table commandes complète + note colis personnalisée
│   ├── InventoryGrid.tsx     Grille inventaire avec images
│   └── QuickAction.tsx       Bouton progression statut inline
├── AutoRefresh.tsx     Refresh server components + dispatch ml-refresh
├── SiteChrome.tsx      Curseur + Lenis + VisitTracker (hors admin)
└── VisitTracker.tsx    Tracking visites anonyme par session

middleware.ts    Protège /admin + allowlist ADMIN_EMAILS
```

---

## Base de données Supabase

**Tables :** `orders` · `pieces` · `visits` · `rate_limits`

**Storage bucket :** `bags` (images des pièces)

**RLS :** activé sur toutes les tables. Lecture admin via service role uniquement, sauf `GET /commande/[code]` (public limité par référence).

**Fonction SQL :** `check_rate_limit` (RPC anti-spam commandes)

---

## Infra critique

- **Emails** — `ml@maisonlocht.com` via Resend. Le domaine est vérifié sur un compte Resend **séparé** du compte principal. `RESEND_API_KEY` doit être de CE compte.
- **DNS Namecheap** — MX = `mx1/mx2.privateemail.com`, SPF/DKIM = Amazon SES (Resend). Ne pas remettre en "Private Email" sinon Resend casse.
- **Paiement** — Canada → Interac (`ml@maisonlocht.com`, réponse sécurité unique par commande) · Reste du monde → virement bancaire belge.
- **Pièces uniques** — Réservation atomique anti-double-vente. Ventes boutique : `status=sold` + `order_ref=null` (ne pas effacer en nettoyage DB).
