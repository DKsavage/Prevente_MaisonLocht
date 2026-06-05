# CLAUDE.md — Maison Locht · Pré-vente
> Lire en entier avant de toucher du code.

---

## Règles Claude — à appliquer sans exception

### Démarrage de session
1. **CLAUDE.md obligatoire** — lire ce fichier en premier. Y écrire stack, règles, bugs résolus, décisions.
2. **Carte graphify en premier** — si `graphify-out/GRAPH_REPORT.md` existe → le lire avant tout `Read` sur un fichier source. Si la réponse est dans le graphe, l'utiliser sans relire le fichier brut.
3. **Pas de graphify-out** → lancer `/graphify .` immédiatement avant toute exploration du code.

### Efficacité et tokens
- `/graphify` — carte du projet, évite les relectures inutiles
- `/fewer-permission-prompts` — réduire les confirmations répétitives
- `/graphify query "question"` — répondre depuis le graphe sans lire les fichiers

### Règles Git
1. **Pas de `Co-Authored-By: Claude`** — jamais.
2. **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `docs:`, `test:`, `style:`
3. **`git add` sélectif** — jamais `git add .`, toujours `git add <fichier>` ciblé.

### Règles Code
1. **Modifier le fichier existant** — jamais réécrire from scratch.
2. **Commentaires** : expliquer le POURQUOI, pas le QUOI.

### Style de réponse
1. **Phrases courtes** — 3 à 6 mots max, zéro remplissage.
2. **Outils d'abord** — lancer les outils, montrer le résultat, s'arrêter.
3. **Direct** — jamais narrer l'action, juste la faire.

### Pédagogie
1. **Défi de compréhension** en fin de session si du code a été écrit.
2. **Résumé roadmap** quand pertinent — rappeler où on en est dans les phases.

---

## Stack

| Couche | Outil |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) |
| Styles | Tailwind CSS v4 |
| UI Components | shadcn/ui + lucide-react |
| Auth | Supabase Auth |
| Base de données | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Langage | TypeScript |
| Emails | Resend |
| Smooth scroll | Lenis |
| Animations React | Framer Motion |
| Animations scroll | GSAP + ScrollTrigger (post-launch) |
| 3D background | React Three Fiber (post-launch — section Story) |

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

Règles produit : Max 2 par commande · Pièces uniques jamais reproduites · Vente finale, ajustements assurés à vie.

---

## Flow Commande

```
1. Landing → client choisit sac → formulaire 3 étapes
2. Étape 1 : sélection sac + quantité (visuel crossfade)
3. Étape 2 : prénom, email, adresse, langue, "Qu'est-ce qui t'a attiré ?" (optionnel)
4. Étape 3 : confirmation + code référence généré (LOCHT-2026-001)
5. Email auto Resend → instructions virement + code référence
6. Client → /commande/[code] → tracker son statut + voir son message why_locht
7. Admin → /admin → voir commandes → QuickAction ou changer statut → envoyer email
8. Admin → note colis personnalisée générée depuis why_locht (copier/imprimer)
```

Statuts : `pending` → `payment_received` → `confirmed` → `shipped`

---

## Architecture as-built

```
app/
├── page.tsx                       Landing (Nav, Hero, Collection, Story, Commander, Footer)
├── commande/[code]/page.tsx       Suivi client — miroir why_locht + timeline statut
├── admin/
│   ├── page.tsx                   Dashboard — KPI, alertes, commandes récentes + QuickAction
│   ├── commandes/page.tsx         Gestion commandes — filtres, search, tri, export CSV (;)
│   ├── inventaire/page.tsx        Inventaire pièces
│   ├── statistiques/page.tsx      Stats — HeroCard KPI, charts, BarList avec rang/%
│   ├── login/page.tsx             Login split-screen éditorial (Cormorant + formulaire)
│   ├── layout.tsx                 Métadonnées admin (noindex)
│   ├── loading.tsx                Skeleton accueil
│   └── actions.ts                 Server actions (statut, suivi, notes, emails, pièces)
│                                  + getEmailPreviewHtml(ref, kind, correctionNote?) — aperçu HTML sans envoi
├── admin/commandes/loading.tsx
├── admin/inventaire/loading.tsx
├── admin/statistiques/loading.tsx
└── api/
    ├── orders/route.ts            POST commande (réservation atomique + emails auto)
    ├── orders/[code]/route.ts     GET statut public
    ├── pieces/route.ts            GET inventaire public
    ├── track/route.ts             POST visite (analytics maison, anonyme)
    └── address-search/route.ts    Autocomplete adresse mondiale (Nominatim)

lib/
├── supabase.ts · supabase-server.ts · supabase-auth.ts
├── schemas.ts (Zod) · models.ts · payment.ts · carriers.ts
├── email-from.ts · email-confirmation.ts · generate-ref.ts
├── countries.ts · time.ts (timeAgo)
├── invoice.ts                         Génération HTML facture (invoiceNumber, buildInvoiceHtml)

components/
├── landing/  Nav · Hero · Collection · Story · Commander · Footer
│             LangContext · LenisProvider · PiecesProvider · Cursor · ScrollToTop
├── form/     OrderForm · FormStep1 · FormStep2 · FormStep3 · AddressAutocomplete
├── admin/    AdminShell · AdminSkeletonShell · OrdersTable · InventoryGrid · QuickAction
└── root      AutoRefresh · SiteChrome · VisitTracker

middleware.ts  (protège /admin + allowlist ADMIN_EMAILS)
```

**Tables Supabase :** `orders`, `pieces`, `visits`, `rate_limits`
**Storage :** bucket `bags` (images pièces)
**RPC SQL :** `check_rate_limit`

---

## Design System

**Direction :** Luxe Éditorial — Crème & Bleu Marine.
Références : magazines belges, Loro Piana, Brunello Cucinelli.

### Couleurs
```
#043672   bleu dominant
#0a4d9e   bleu hover
#021f45   fonds sombres
#faf7f2   background principal (cream)
#f0ebe0   background secondaire (warm)
#ede8df   page-bg
#b8965a   or — accent principal
#d4aa6a   or clair — accent sur fond sombre
#7a7a8a   texte secondaire
#1a1a2e   texte principal
```

### Typographie
```
Display / Headings : Cormorant Garamond (300, italic) — grandeur, éditorial
Body / UI          : DM Sans (300, 400) — lisibilité, modernité
Labels             : DM Sans uppercase, letter-spacing élevé, 10px minimum
Mono               : JetBrains Mono — références commandes
```

### Règle labels
**Minimum 10px** partout — jamais en dessous. Labels admin et form : `text-[10px]`.
Seule exception acceptable : bottom nav mobile icons `text-[8px]`.

### Animations
- Lenis lerp 0.08 — smooth scroll, désactivé mobile
- Framer Motion : hover, mount, stagger (max 0.12s)
- CSS reveals : opacity + translateY, 600ms, cubic-bezier(.16,1,.3,1)
- Cursor : dot + ring lerp, désactivé mobile
- Règle absolue : chaque animation a un rôle narratif, rien de décoratif

---

## Composants clés — comportements importants

**AutoRefresh** — dispatch `ml-refresh` après chaque refresh. AdminShell écoute cet event pour le compteur "Mis à jour il y a Xs". Ne pas supprimer le dispatch.

**AdminShell** — bottom nav fixe mobile (md:hidden). Content a `pb-28 md:pb-8` pour ne pas être masqué.

**AdminSkeletonShell** — header statique pour les `loading.tsx`. Pas de logique client, pas de state.

**QuickAction** — progression statut inline sur la home admin. Appelle `updateOrderStatus` directement. Uniquement pour la progression positive (pas annulation).

**OrdersTable** — export CSV délimiteur `;` (standard Excel européen). Date format `YYYY-MM-DD HH:mm`. Statuts en français. Sur mobile : onglets **Actions** / **Infos** dans la row expandée (desktop : 2 colonnes inchangées). Bouton "↓ Imprimer la facture" dans l'onglet Actions.

**NoteColis** — dans OrdersTable expanded, visible si `order.why_locht`. Génère un texte personnalisé à glisser dans le colis.

**Aperçu email (OrdersTable)** — bouton Eye (lucide) à côté de chaque EmailBtn. Ouvre overlay fullscreen avec skeleton immédiat puis iframe `srcdoc`. État : `preview: { html: string | null; label: string } | null`. Escape ferme. `sandbox="allow-same-origin"` sur l'iframe — intentionnel, contenu escapé côté serveur via `esc()`.

**Email correction** — `sendCorrectionEmail(reference, customNote?)` accepte un message personnel optionnel affiché dans un encadré "Un mot de Maison Locht". Formulaire inline dans l'onglet Actions (textarea + bouton Envoyer). Header ambre distinct du header navy standard.

**RoutesWall** — supprimé (messages clients privés, ne pas afficher publiquement).

**PiecesProvider** — fournit `pieces` et `availableCount` à Hero et Collection. Source unique de vérité pour l'inventaire côté client.

---

## Règles Composants

- Un composant = un fichier
- Props typées TypeScript (jamais `any`)
- Tailwind uniquement — zéro style inline
- Composants réutilisables → `/components/`
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
- ❌ Labels sous 10px (sauf bottom nav mobile)
- ❌ Co-Authored-By Claude dans les commits

---

## Admin

- 2 utilisateurs (fondatrice + collaboratrice)
- Auth Supabase email/password
- Mobile + desktop (responsive prioritaire)
- Route protégée `/admin` via `middleware.ts` + allowlist `ADMIN_EMAILS`

---

## Workflow Obligatoire

1. **Diagnose before fix** — root cause + fichiers. Zéro code sans accord
2. **One feature → test → approve → commit → push → repeat**
3. **Feature branch** si risque (ex: `feat/nom-feature`) → merge sur main après validation
4. **TypeScript check** avant chaque commit : `npx tsc --noEmit`
5. **Commits sans Co-Authored-By** — auteur = DKsavage uniquement
6. **Conventional Commits** : `feat:`, `fix:`, `refactor:`, `perf:`, `chore:`, `docs:`, `test:`, `style:`
7. **`git add` sélectif** — jamais `git add .`

## Style de Réponse (Claude)

- Phrases courtes — 3 à 6 mots max, zéro remplissage
- Outils d'abord → résultat → stop
- Direct — jamais narrer l'action
- Utiliser graphify-out/GRAPH_REPORT.md avant de lire des fichiers
- Utiliser les skills frontend-design pour tout travail visuel

---

## Sécurité Checklist (avant deploy)

- [ ] Aucun secret exposé
- [ ] Endpoints validés (Zod)
- [ ] RLS activé toutes tables
- [ ] Variables d'env dans Vercel Dashboard
- [ ] `.env.local` dans `.gitignore`
- [ ] Inputs sanitisés

---

## Variables d'environnement (voir `.env.example`)

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`
`RESEND_API_KEY` (compte Resend où maisonlocht.com est vérifié)
`NEXT_PUBLIC_SITE_URL` · `ADMIN_EMAILS` · `ADMIN_NOTIFY_EMAIL`
En test : `RESEND_TEST_EMAIL` redirige tous les emails vers une adresse de test.

---

## Infra & règles métier critiques

- **Emails** — `ml@maisonlocht.com` (lib/email-from.ts). Compte Resend **séparé** avec domaine vérifié.
- **DNS Namecheap** — MX = `mx1/mx2.privateemail.com` + SPF/DKIM Amazon SES. Ne pas remettre en "Private Email".
- **Paiement** — Canada → Interac (`anouklocht2003@gmail.com`, question `Quel est le nom de la collection ?`, réponse auto `Cernes`+4 chiffres) · International → virement IBAN BE98 0636 5034 2393.
- **Pièces uniques** — Réservation atomique, jamais de double-vente. Ventes boutique = `sold` + `order_ref=null` (préserver en nettoyage DB).
- **why_locht** — Données privées. Utilisées en interne uniquement (note colis, miroir tracking). Ne jamais afficher publiquement.

---

## Bugs résolus & gotchas

- **Crash `OrderStatus` (juin 2026)** — un fichier `'use server'` ne doit exporter QUE des fonctions async. `export type { OrderStatus }` dans `actions.ts` était compilé par Turbopack en export *valeur* → `ReferenceError: OrderStatus is not defined` à l'évaluation du module → **500 sur tous les server actions admin** (symptôme : "Échec email", pièces qui ne chargent pas). `tsc` ne le détecte pas. **Règle : jamais de `export type` dans un `'use server'` ; importer les types depuis `lib/`.**
- **Images cassées en email** — `pieces.image_url` est mixte : URL Supabase complète OU chemin relatif `/images/…`. Toujours normaliser via `emailImg()` (`lib/email-from.ts`) avant un `<img>` d'email.
- **Resend `emails.send()` ne throw pas** — renvoie `{ data, error }`. Vérifier `error` sinon échec silencieux.
- **2 comptes Resend** — `dimitrikarel77@gmail.com` (domaine `maisonlocht.com` vérifié = **PROD/Vercel**) vs compte Lumina (`luminamodels.ca`). `.env.local` doit contenir la clé du compte dimitrikarel77, sinon 403 en local.
- **Dev local sur hotspot iPhone (NAT64/IPv6)** — le middleware (runtime edge) peut renvoyer `fetch failed` vers Supabase + l'optimiseur d'images bloque les IP NAT64. Artefact **local uniquement**. Redémarrer le dev server ou passer sur un WiFi IPv4.
- **Curly quotes dans OrdersTable.tsx** — le fichier contient des guillemets typographiques Unicode (U+2018/U+2019) dans les expressions JSX. Cause : copier-coller depuis éditeur rich text. Symptôme : cascade `Invalid character` + `AnimatePresence has no closing tag`. Fix : `python3 -c "open(p,'wb').write(open(p,'rb').read().replace(b'\xe2\x80\x98',b\"'\").replace(b'\xe2\x80\x99',b\"'\"))"`. Ne jamais coller de texte stylisé dans des expressions JSX.
- **XSS dans templates email HTML** — tous les champs utilisateur (`first_name`, `address`, `city`, `why_locht`, etc.) doivent passer par `esc()` avant interpolation dans `buildConfirmationEmail` et `buildStatusEmail`. Fonction `esc()` définie localement dans chaque fichier email. Sans ça : XSS stored via `srcdoc` iframe admin (`allow-same-origin` → `window.parent` accessible).
- **Preview email en local** — `npx tsx -e "import { buildConfirmationEmail } from './lib/email-confirmation'; import fs from 'fs'; fs.writeFileSync('/tmp/preview.html', buildConfirmationEmail({...}))"` puis `open /tmp/preview.html`. Valide le rendu sans envoyer de vrai email.

---

## Facturation (factures de vente) ✅

**Livré.** Facture HTML print-optimized, imprimable en PDF depuis l'admin.

- **Technique** : iframe caché dans `OrderRow` — clic → HTML injecté → `iframe.contentWindow.print()` → dialogue impression → "Enregistrer PDF". Zéro dépendance externe.
- **Numérotation** : `LOCHT-2026-001` → `F-2026-001` (via `lib/invoice.ts → invoiceNumber()`)
- **Taxes** : mention neutre "Taxes incluses si applicables" — **toujours bloqué avocate/comptable**. Quand réponse reçue → modifier `lib/invoice.ts` uniquement.
- **Entrée admin** : onglet **Actions** de la row expandée → "↓ Imprimer la facture"
- **Mentions légales** : à faire valider par l'avocate avant usage officiel.

---

## État du Projet — LIVRÉ & AMÉLIORÉ ✅

**En ligne** : https://prevente.maisonlocht.com · **Admin** : /admin
**Repo** : DKsavage/Prevente_MaisonLocht (privé) · **Branch principale** : main

### Dernières livraisons (juin 2026)
- Aperçu email admin (overlay + skeleton + Eye icon + Escape)
- Email confirmation restructuré : 3 étapes éditoriales, montant 48px, champs copiables (`user-select:all` + `mailto:`)
- Email correction redesigné : header ambre, note personnalisée depuis l'admin
- Fix sécurité XSS : `esc()` sur tous les champs utilisateur dans les templates email
- `lib/email-status.ts` : même fix `esc()` sur `firstName`
