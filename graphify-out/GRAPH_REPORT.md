# Graph Report - .  (2026-06-04)

## Corpus Check
- 101 files · ~320,146 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 497 nodes · 750 edges · 47 communities (22 shown, 25 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Actions & Pièces|Admin Actions & Pièces]]
- [[_COMMUNITY_Landing & Formulaire Commande|Landing & Formulaire Commande]]
- [[_COMMUNITY_Étapes Formulaire & UX|Étapes Formulaire & UX]]
- [[_COMMUNITY_Dépendances & Config npm|Dépendances & Config npm]]
- [[_COMMUNITY_Admin Shell & Navigation|Admin Shell & Navigation]]
- [[_COMMUNITY_API Routes & Adresses|API Routes & Adresses]]
- [[_COMMUNITY_UI Components & Aliases|UI Components & Aliases]]
- [[_COMMUNITY_Layout & Typographie|Layout & Typographie]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_API Commandes & Inventaire|API Commandes & Inventaire]]
- [[_COMMUNITY_Design System & Animations|Design System & Animations]]
- [[_COMMUNITY_Admin Skeleton & Loading|Admin Skeleton & Loading]]
- [[_COMMUNITY_API Publique & Collection|API Publique & Collection]]
- [[_COMMUNITY_Autocomplete Adresse & Form|Autocomplete Adresse & Form]]
- [[_COMMUNITY_Analytics & Providers UX|Analytics & Providers UX]]
- [[_COMMUNITY_Gestion Commandes & Tracking|Gestion Commandes & Tracking]]
- [[_COMMUNITY_Marque & Collection LOCHT 01|Marque & Collection LOCHT 01]]
- [[_COMMUNITY_Règles Métier & Paiement|Règles Métier & Paiement]]
- [[_COMMUNITY_Scripts & Utilitaires|Scripts & Utilitaires]]
- [[_COMMUNITY_Dashboard Admin & Actions|Dashboard Admin & Actions]]
- [[_COMMUNITY_Utils & Composants UI|Utils & Composants UI]]
- [[_COMMUNITY_Email & DNS Infrastructure|Email & DNS Infrastructure]]
- [[_COMMUNITY_Middleware Auth & Config|Middleware Auth & Config]]
- [[_COMMUNITY_Admin Layout & Metadata|Admin Layout & Metadata]]
- [[_COMMUNITY_Scripts One-Time|Scripts One-Time]]
- [[_COMMUNITY_AutoRefresh & Admin Shell|AutoRefresh & Admin Shell]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Page Inventaire|Page Inventaire]]
- [[_COMMUNITY_Page Login Admin|Page Login Admin]]
- [[_COMMUNITY_Page Statistiques|Page Statistiques]]
- [[_COMMUNITY_Skeleton Shell|Skeleton Shell]]
- [[_COMMUNITY_Contexte Langue FREN|Contexte Langue FR/EN]]
- [[_COMMUNITY_ScrollToTop|ScrollToTop]]
- [[_COMMUNITY_Transporteurs & Tracking|Transporteurs & Tracking]]
- [[_COMMUNITY_Liste Pays FREN|Liste Pays FR/EN]]
- [[_COMMUNITY_Modèles Pièces (nomsprix)|Modèles Pièces (noms/prix)]]
- [[_COMMUNITY_Formatage Temps Relatif|Formatage Temps Relatif]]
- [[_COMMUNITY_Facturation & Invoice|Facturation & Invoice]]
- [[_COMMUNITY_Images Kouna|Images Kouna]]
- [[_COMMUNITY_Images Kami|Images Kami]]
- [[_COMMUNITY_Images Nafibe|Images Nafibe]]
- [[_COMMUNITY_Logos Maison Locht|Logos Maison Locht]]
- [[_COMMUNITY_Images Lifestyle|Images Lifestyle]]
- [[_COMMUNITY_Stack & Architecture|Stack & Architecture]]

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 38 edges
2. `compilerOptions` - 16 edges
3. `requireAdmin()` - 15 edges
4. `createAuthClient()` - 15 edges
5. `buildConfirmationEmail()` - 12 edges
6. `useLang()` - 11 edges
7. `Maison Locht Pré-vente Project` - 11 edges
8. `pieceNum()` - 10 edges
9. `shippedBody()` - 9 edges
10. `getPaymentMethod()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `TrackingPage()` --calls--> `createServerClient()`  [EXTRACTED]
  app/commande/[code]/page.tsx → lib/supabase-server.ts
- `middleware()` --calls--> `createServerClient()`  [INFERRED]
  middleware.ts → lib/supabase-server.ts
- `main()` --calls--> `createClient()`  [INFERRED]
  scripts/diag-email.ts → lib/supabase.ts
- `sendStatusEmailInternal()` --calls--> `buildStatusEmail()`  [EXTRACTED]
  app/admin/actions.ts → lib/email-status.ts
- `resendConfirmation()` --calls--> `buildConfirmationEmail()`  [EXTRACTED]
  app/admin/actions.ts → lib/email-confirmation.ts

## Import Cycles
- None detected.

## Communities (47 total, 25 thin omitted)

### Community 0 - "Admin Actions & Pièces"
Cohesion: 0.05
Nodes (33): cormorant, dmSans, jetbrains, metadata, BagDrawer(), buildModels(), Collection(), copy (+25 more)

### Community 1 - "Landing & Formulaire Commande"
Cohesion: 0.10
Nodes (29): addPiece(), changePieceImage(), deletePiece(), getOrderPieces(), reassignPiece(), releasePiece(), requireAdmin(), resendConfirmation() (+21 more)

### Community 2 - "Étapes Formulaire & UX"
Cohesion: 0.07
Nodes (30): GET(), NominatimResult, PROVINCE_MAP, AddressResult, Props, SelectedPiece, CA_PROVINCES, copy (+22 more)

### Community 3 - "Dépendances & Config npm"
Cohesion: 0.08
Nodes (22): isLate(), MODEL_NAMES, Order, OrderRow(), PieceItem, AdminHomePage(), O, NEXT (+14 more)

### Community 4 - "Admin Shell & Navigation"
Cohesion: 0.05
Nodes (36): dependencies, @base-ui/react, class-variance-authority, clsx, framer-motion, lenis, lucide-react, next (+28 more)

### Community 5 - "API Routes & Adresses"
Cohesion: 0.14
Nodes (19): buildConfirmationEmail(), ConfirmationData, generateReference(), generateInteracAnswer(), getPaymentMethod(), INTERAC_SECURITY_QUESTION, paymentInstructions(), PaymentMethod (+11 more)

### Community 6 - "UI Components & Aliases"
Cohesion: 0.12
Nodes (19): copy, ease, GridPiece, Props, Ctx, PiecesCtx, PiecesProvider(), DbPiece (+11 more)

### Community 7 - "Layout & Typographie"
Cohesion: 0.10
Nodes (24): App Icon — Maison Locht handwritten signature logo, navy blue on white, app favicon, Lifestyle campaign photo — 4 models (2 men, 2 women) on orange backdrop, each carrying a different Maison Locht bag (Kouna, Kami, Nafibe variants), African-inspired wax and fouta textile outfits, fruits on ground, blue striped textile floor cloth, Hero campaign photo — single female model on orange backdrop standing atop pile of Maison Locht bags (multiple colors: red, blue, yellow, green, brown), wearing patchwork wax textile outfit, blue head wrap, gold jewelry, Le Kami (medium bag) — product photo, yellow leather and multicolor wax kente patchwork, structured duffle silhouette, brass beaded keychain charm, on striped fouta textile surface, Le Kami (medium bag) — product photo, dark navy/black leather and checkered wax patchwork, structured duffle silhouette, brass hoop and beaded keychain charm, on striped fouta textile surface, Le Kami (medium bag) — product photo, cognac/tan leather and wax striped textile patchwork, structured duffle silhouette open from top, brass hoop and beaded keychain charm, on striped fouta textile surface, Le Kouna (small bag) — product photo, blue leather and wax striped green/navy patchwork, compact boxy silhouette, brass hoop and beaded keychain charm, on striped fouta textile surface, Le Kouna (small bag) — product photo, burgundy/wine leather and dark wax patchwork, compact boxy silhouette, dual top handles, brass hoop and beaded keychain charm, on striped fouta textile surface (+16 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.17
Nodes (19): copy, STEPS, TrackingPage(), carrierName(), CARRIERS, trackingUrl(), emailImg(), buildStatusEmail() (+11 more)

### Community 9 - "API Commandes & Inventaire"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Design System & Animations"
Cohesion: 0.10
Nodes (21): Maison Locht Brand, Bug: Two Resend accounts confusion, Bug: Resend emails.send() does not throw, Collection LOCHT 01 — LES CERNES, Design System — Luxe Éditorial (Crème & Bleu Marine), Le Kami (Le Moyen, 328 CAD), Le Kouna (Le Petit, 285 CAD), Le Nafibe (Le Grand, 395 CAD) (+13 more)

### Community 11 - "Admin Skeleton & Loading"
Cohesion: 0.13
Nodes (6): tabs, formatNumberFr(), clean(), createClient(), AdminStatsPage(), MODEL_NAMES

### Community 12 - "API Publique & Collection"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "Autocomplete Adresse & Form"
Cohesion: 0.10
Nodes (20): app/admin/commandes/page.tsx — Order Management, app/page.tsx — Landing Page, AdminShell Component, AutoRefresh Component, NoteColis Component, OrdersTable Component, Facturation — Invoice PDF Feature, lib/carriers.ts — Carriers + Tracking URLs (+12 more)

### Community 15 - "Gestion Commandes & Tracking"
Cohesion: 0.40
Nodes (5): BASE_URL, buildEmail(), main(), resend, supabase

### Community 16 - "Marque & Collection LOCHT 01"
Cohesion: 0.70
Nodes (3): cn(), Button(), buttonVariants

### Community 17 - "Règles Métier & Paiement"
Cohesion: 0.50
Nodes (4): api/orders/route.ts — POST Order, Supabase Table: orders, lib/generate-ref.ts — Reference Generator (LOCHT-YYYY-###), lib/schemas.ts — Zod Validation

### Community 18 - "Scripts & Utilitaires"
Cohesion: 0.67
Nodes (3): clean(), config, middleware()

### Community 20 - "Utils & Composants UI"
Cohesion: 0.67
Nodes (3): app/admin/actions.ts — Server Actions, Bug: OrderStatus export type in use server (juin 2026), QuickAction Component

### Community 21 - "Email & DNS Infrastructure"
Cohesion: 0.67
Nodes (3): api/pieces/route.ts — GET Inventory Public, PiecesProvider Component, Supabase Table: pieces

### Community 22 - "Middleware Auth & Config"
Cohesion: 0.67
Nodes (3): Bug: Mixed image URLs in emails, lib/email-confirmation.ts — Confirmation Email Template, lib/email-from.ts — Sender Constant (ml@maisonlocht.com)

## Knowledge Gaps
- **200 isolated node(s):** `metadata`, `O`, `MODEL_NAMES`, `PROVINCE_MAP`, `NominatimResult` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Landing & Formulaire Commande` to `Dépendances & Config npm`, `API Routes & Adresses`, `TypeScript Config`, `Admin Skeleton & Loading`, `Scripts & Utilitaires`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `pieceNum()` connect `UI Components & Aliases` to `Admin Actions & Pièces`, `Landing & Formulaire Commande`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `useLang()` connect `Admin Actions & Pièces` to `Étapes Formulaire & UX`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createServerClient()` (e.g. with `createAuthClient()` and `createClient()`) actually correct?**
  _`createServerClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `O`, `MODEL_NAMES` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Actions & Pièces` be split into smaller, more focused modules?**
  _Cohesion score 0.05012531328320802 - nodes in this community are weakly interconnected._
- **Should `Landing & Formulaire Commande` be split into smaller, more focused modules?**
  _Cohesion score 0.10202020202020202 - nodes in this community are weakly interconnected._