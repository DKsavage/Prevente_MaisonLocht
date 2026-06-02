# Graph Report - .  (2026-06-02)

## Corpus Check
- 94 files · ~314,223 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 445 nodes · 656 edges · 40 communities (23 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.9)
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

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 38 edges
2. `compilerOptions` - 16 edges
3. `requireAdmin()` - 15 edges
4. `createAuthClient()` - 13 edges
5. `Tech Stack` - 13 edges
6. `useLang()` - 11 edges
7. `buildConfirmationEmail()` - 10 edges
8. `getPaymentMethod()` - 9 edges
9. `Supabase (Auth + PostgreSQL)` - 9 edges
10. `POST()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `lib/email-confirmation.ts — Order Confirmation Email Template` --sent_via--> `Resend (Emails)`  [INFERRED]
  lib/email-confirmation.ts → CLAUDE.md
- `lib/supabase-auth.ts — Supabase Auth Client (middleware)` --connects_to--> `Supabase (Auth + PostgreSQL)`  [EXTRACTED]
  lib/supabase-auth.ts → CLAUDE.md
- `lib/supabase-server.ts — Server Supabase Client` --connects_to--> `Supabase (Auth + PostgreSQL)`  [EXTRACTED]
  lib/supabase-server.ts → CLAUDE.md
- `lib/supabase.ts — Browser Supabase Client` --connects_to--> `Supabase (Auth + PostgreSQL)`  [EXTRACTED]
  lib/supabase.ts → CLAUDE.md
- `api/orders/route.ts — POST Order (atomic reservation)` --triggers_email_via--> `Resend (Emails)`  [EXTRACTED]
  app/api/orders/route.ts → CLAUDE.md

## Import Cycles
- None detected.

## Communities (40 total, 17 thin omitted)

### Community 0 - "Admin Actions & Pièces"
Cohesion: 0.07
Nodes (40): addPiece(), changePieceImage(), deletePiece(), getOrderPieces(), OrderStatus, reassignPiece(), releasePiece(), requireAdmin() (+32 more)

### Community 1 - "Landing & Formulaire Commande"
Cohesion: 0.06
Nodes (38): copy, ease, GridPiece, Props, buildModels(), Collection(), copy, ease (+30 more)

### Community 2 - "Étapes Formulaire & UX"
Cohesion: 0.08
Nodes (33): SelectedPiece, copy, ease, editLabel(), FormStep3(), Props, copy, ease (+25 more)

### Community 3 - "Dépendances & Config npm"
Cohesion: 0.05
Nodes (36): dependencies, @base-ui/react, class-variance-authority, clsx, framer-motion, lenis, lucide-react, next (+28 more)

### Community 4 - "Admin Shell & Navigation"
Cohesion: 0.08
Nodes (14): tabs, InvPiece, Order, AdminHomePage(), O, STATUS_FR, AdminOrdersPage(), AdminInventoryPage() (+6 more)

### Community 5 - "API Routes & Adresses"
Cohesion: 0.11
Nodes (16): GET(), NominatimResult, PROVINCE_MAP, AddressResult, Props, CA_PROVINCES, copy, ease (+8 more)

### Community 6 - "UI Components & Aliases"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "Layout & Typographie"
Cohesion: 0.12
Nodes (9): cormorant, dmSans, jetbrains, metadata, BagDrawer(), LenisContext, LenisCtx, useLenis() (+1 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "API Commandes & Inventaire"
Cohesion: 0.18
Nodes (14): api/orders/[code]/route.ts — GET Public Order Status, api/orders/route.ts — POST Order (atomic reservation), components/admin/InventoryGrid.tsx — Inventory Grid with Images, Atomic Reservation (anti-double-sale for unique pieces), Supabase (Auth + PostgreSQL), Supabase Table: orders, Supabase Table: pieces, Supabase Table: rate_limits (+6 more)

### Community 10 - "Design System & Animations"
Cohesion: 0.15
Nodes (14): Animation Rules (Lenis, Framer Motion, CSS reveals), Design System — Luxe Éditorial Crème & Bleu Marine, Framer Motion (Animations React), GSAP + ScrollTrigger (post-launch), Lenis (Smooth Scroll), Next.js 16 (App Router, Turbopack), React Three Fiber (post-launch — section Story), shadcn/ui + lucide-react (+6 more)

### Community 12 - "API Publique & Collection"
Cohesion: 0.29
Nodes (8): api/pieces/route.ts — GET Public Inventory, app/page.tsx — Landing Page, components/landing/Collection.tsx — Collection Gallery, components/landing/Footer.tsx — Footer, components/landing/Hero.tsx — Hero Section, components/landing/Nav.tsx — Sticky Navigation, components/landing/PiecesProvider.tsx — Pieces Data Provider, components/landing/Story.tsx — Brand Story Section

### Community 13 - "Autocomplete Adresse & Form"
Cohesion: 0.29
Nodes (7): api/address-search/route.ts — Address Autocomplete (Nominatim), components/form/AddressAutocomplete.tsx — Nominatim Autocomplete, components/landing/Commander.tsx — Order Form Container, components/form/FormStep1.tsx — Bag + Quantity Selection, components/form/FormStep2.tsx — Customer Info + Address, components/form/FormStep3.tsx — Confirmation + Payment, components/form/OrderForm.tsx — 3-Step Order Orchestrator

### Community 14 - "Analytics & Providers UX"
Cohesion: 0.33
Nodes (6): api/track/route.ts — POST Visit Analytics, components/landing/Cursor.tsx — Custom Cursor (desktop), components/landing/LenisProvider.tsx — Smooth Scroll Provider, components/SiteChrome.tsx — Cursor + Lenis + VisitTracker (non-admin), components/VisitTracker.tsx — Anonymous Session Visit Tracking, Supabase Table: visits

### Community 15 - "Gestion Commandes & Tracking"
Cohesion: 0.33
Nodes (6): app/admin/commandes/page.tsx — Orders Management, app/commande/[code]/page.tsx — Order Tracking, components/admin/OrdersTable.tsx — Orders Table + Note Colis, Note Colis — Personalized Package Note from why_locht, Order Statuses: pending → payment_received → confirmed → shipped, why_locht — Private Customer Message (internal only)

### Community 16 - "Marque & Collection LOCHT 01"
Cohesion: 0.33
Nodes (6): CLAUDE.md — Project Instructions, Collection LOCHT 01 — LES CERNES, Le Kami — Le Moyen (328 CAD), Le Kouna — Le Petit (285 CAD), Le Nafibe — Le Grand (395 CAD), Maison Locht — Brand

### Community 17 - "Règles Métier & Paiement"
Cohesion: 0.40
Nodes (6): Order Reference Format: LOCHT-YYYY-###, Order Flow (3-step form), Payment: Interac (Canada), Payment: Wire Transfer IBAN BE98 0636 5034 2393 (International), lib/generate-ref.ts — Reference Generator (LOCHT-YYYY-###), lib/payment.ts — Payment Method Detection (Interac/wire)

### Community 18 - "Scripts & Utilitaires"
Cohesion: 0.40
Nodes (5): BASE_URL, buildEmail(), main(), resend, supabase

### Community 19 - "Dashboard Admin & Actions"
Cohesion: 0.40
Nodes (5): app/admin/actions.ts — Server Actions, app/admin/page.tsx — Admin Dashboard, components/admin/QuickAction.tsx — Inline Status Progression, Admin Users (2: founder + collaborator), middleware.ts — Protects /admin + ADMIN_EMAILS allowlist

### Community 20 - "Utils & Composants UI"
Cohesion: 0.70
Nodes (3): cn(), Button(), buttonVariants

### Community 21 - "Email & DNS Infrastructure"
Cohesion: 0.50
Nodes (4): DNS: Namecheap MX + SPF/DKIM Amazon SES (Resend), Resend (Emails), lib/email-confirmation.ts — Order Confirmation Email Template, lib/email-from.ts — Sender Constant (ml@maisonlocht.com)

### Community 22 - "Middleware Auth & Config"
Cohesion: 0.67
Nodes (3): clean(), config, middleware()

## Knowledge Gaps
- **191 isolated node(s):** `STATUSES`, `metadata`, `O`, `STATUS_FR`, `MODEL_NAMES` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Admin Actions & Pièces` to `Étapes Formulaire & UX`, `Admin Shell & Navigation`, `Middleware Auth & Config`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `pieceNum()` connect `Landing & Formulaire Commande` to `Admin Actions & Pièces`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `useLang()` connect `Landing & Formulaire Commande` to `Étapes Formulaire & UX`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createServerClient()` (e.g. with `createAuthClient()` and `createClient()`) actually correct?**
  _`createServerClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `STATUSES`, `metadata`, `O` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Actions & Pièces` be split into smaller, more focused modules?**
  _Cohesion score 0.07188778492109878 - nodes in this community are weakly interconnected._
- **Should `Landing & Formulaire Commande` be split into smaller, more focused modules?**
  _Cohesion score 0.05974025974025974 - nodes in this community are weakly interconnected._