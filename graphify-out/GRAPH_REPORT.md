# Graph Report - .  (2026-06-05)

## Corpus Check
- 6 files · ~323,741 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 514 nodes · 810 edges · 45 communities (22 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Actions & Emails|Admin Actions & Emails]]
- [[_COMMUNITY_Landing & Formulaire|Landing & Formulaire]]
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
- [[_COMMUNITY_Aperçu Email Admin|Aperçu Email Admin]]
- [[_COMMUNITY_Email Confirmation Restructuré|Email Confirmation Restructuré]]
- [[_COMMUNITY_Email Correction & Note|Email Correction & Note]]
- [[_COMMUNITY_Sécurité & Escaping HTML|Sécurité & Escaping HTML]]
- [[_COMMUNITY_Facturation & Invoice|Facturation & Invoice]]
- [[_COMMUNITY_Images Kouna|Images Kouna]]
- [[_COMMUNITY_Images Kami|Images Kami]]
- [[_COMMUNITY_Images Nafibe|Images Nafibe]]
- [[_COMMUNITY_Logos Maison Locht|Logos Maison Locht]]
- [[_COMMUNITY_Images Lifestyle|Images Lifestyle]]
- [[_COMMUNITY_Stack & Architecture|Stack & Architecture]]
- [[_COMMUNITY_Contexte Langue FREN|Contexte Langue FR/EN]]
- [[_COMMUNITY_ScrollToTop|ScrollToTop]]
- [[_COMMUNITY_Transporteurs & Tracking|Transporteurs & Tracking]]
- [[_COMMUNITY_Liste Pays FREN|Liste Pays FR/EN]]
- [[_COMMUNITY_Modèles Pièces (nomsprix)|Modèles Pièces (noms/prix)]]
- [[_COMMUNITY_Formatage Temps Relatif|Formatage Temps Relatif]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]

## God Nodes (most connected - your core abstractions)
1. `createServerClient()` - 38 edges
2. `OrderRow()` - 23 edges
3. `buildConfirmationEmail()` - 20 edges
4. `requireAdmin()` - 16 edges
5. `compilerOptions` - 16 edges
6. `createAuthClient()` - 15 edges
7. `shippedBody()` - 14 edges
8. `paymentBody()` - 12 edges
9. `useLang()` - 11 edges
10. `buildStatusEmail()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Server action: getEmailPreviewHtml(ref, kind, correctionNote?) — returns preview HTML without sending email` --references--> `buildStatusEmail()`  [INFERRED]
  CLAUDE.md → lib/email-status.ts
- `Invoice HTML structure: A4 page, watermark ML, gold top rule, header/parties/subject/table/totaux/payment/footer, print-optimized CSS` --conceptually_related_to--> `document_() — wraps email content in full HTML document shell`  [INFERRED]
  docs/facture-dev-2026-001.html → lib/email-status.ts
- `TrackingPage()` --calls--> `createServerClient()`  [EXTRACTED]
  app/commande/[code]/page.tsx → lib/supabase-server.ts
- `main()` --calls--> `createClient()`  [INFERRED]
  scripts/diag-email.ts → lib/supabase.ts
- `Bug: XSS in HTML email templates — user fields must pass through esc() before interpolation` --references--> `esc() — HTML escape function for user input`  [EXTRACTED]
  CLAUDE.md → lib/email-status.ts

## Import Cycles
- None detected.

## Communities (45 total, 23 thin omitted)

### Community 0 - "Admin Actions & Emails"
Cohesion: 0.06
Nodes (41): copy, ease, GridPiece, Props, buildModels(), Collection(), copy, ease (+33 more)

### Community 1 - "Landing & Formulaire"
Cohesion: 0.07
Nodes (33): correctionNote state, correctionOpen state, EmailBtn(), EmailRow(), isLate(), Loader2 icon (lucide-react), mobileTab state, MODEL_NAMES (+25 more)

### Community 2 - "Étapes Formulaire & UX"
Cohesion: 0.10
Nodes (31): addPiece(), changePieceImage(), deletePiece(), getEmailPreviewHtml(), getOrderPieces(), reassignPiece(), releasePiece(), requireAdmin() (+23 more)

### Community 3 - "Dépendances & Config npm"
Cohesion: 0.07
Nodes (29): GET(), NominatimResult, PROVINCE_MAP, AddressResult, Props, SelectedPiece, CA_PROVINCES, copy (+21 more)

### Community 4 - "Admin Shell & Navigation"
Cohesion: 0.09
Nodes (35): Server action: getEmailPreviewHtml(ref, kind, correctionNote?) — returns preview HTML without sending email, Bug: curly quotes (U+2018/U+2019) in OrdersTable.tsx JSX — causes Invalid character + AnimatePresence parse error, Bug: XSS in HTML email templates — user fields must pass through esc() before interpolation, Component: Aperçu email — Eye icon overlay + skeleton + iframe srcdoc + Escape closes, Component: Email correction — sendCorrectionEmail with optional correctionNote, amber header, inline textarea in Actions tab, Livraisons juin 2026 — aperçu email, email confirmation restructuré, email correction redesigné, fix XSS esc(), copy, STEPS (+27 more)

### Community 5 - "API Routes & Adresses"
Cohesion: 0.05
Nodes (33): dependencies, @base-ui/react, class-variance-authority, clsx, framer-motion, lenis, lucide-react, next (+25 more)

### Community 6 - "UI Components & Aliases"
Cohesion: 0.09
Nodes (14): tabs, InvPiece, Order, AdminHomePage(), AdminHelpPage(), AdminOrdersPage(), AdminInventoryPage(), formatNumberFr() (+6 more)

### Community 7 - "Layout & Typographie"
Cohesion: 0.14
Nodes (23): sendCorrectionEmail(), buildConfirmationEmail(), causeEffect(), ConfirmationData, coordCard(), coordRow(), correctionExplanation(), correctionHeader() (+15 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (23): App Icon — Maison Locht handwritten signature logo, navy blue on white, app favicon, Lifestyle campaign photo — 4 models (2 men, 2 women) on orange backdrop, each carrying a different Maison Locht bag (Kouna, Kami, Nafibe variants), African-inspired wax and fouta textile outfits, fruits on ground, blue striped textile floor cloth, Hero campaign photo — single female model on orange backdrop standing atop pile of Maison Locht bags (multiple colors: red, blue, yellow, green, brown), wearing patchwork wax textile outfit, blue head wrap, gold jewelry, Le Kami (medium bag) — product photo, yellow leather and multicolor wax kente patchwork, structured duffle silhouette, brass beaded keychain charm, on striped fouta textile surface, Le Kami (medium bag) — product photo, dark navy/black leather and checkered wax patchwork, structured duffle silhouette, brass hoop and beaded keychain charm, on striped fouta textile surface, Le Kami (medium bag) — product photo, cognac/tan leather and wax striped textile patchwork, structured duffle silhouette open from top, brass hoop and beaded keychain charm, on striped fouta textile surface, Le Kouna (small bag) — product photo, blue leather and wax striped green/navy patchwork, compact boxy silhouette, brass hoop and beaded keychain charm, on striped fouta textile surface, Le Kouna (small bag) — product photo, burgundy/wine leather and dark wax patchwork, compact boxy silhouette, dual top handles, brass hoop and beaded keychain charm, on striped fouta textile surface (+15 more)

### Community 9 - "API Commandes & Inventaire"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 10 - "Design System & Animations"
Cohesion: 0.10
Nodes (21): Maison Locht Brand, Bug: Two Resend accounts confusion, Bug: Resend emails.send() does not throw, Collection LOCHT 01 — LES CERNES, Design System — Luxe Éditorial (Crème & Bleu Marine), Le Kami (Le Moyen, 328 CAD), Le Kouna (Le Petit, 285 CAD), Le Nafibe (Le Grand, 395 CAD) (+13 more)

### Community 11 - "Admin Skeleton & Loading"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "API Publique & Collection"
Cohesion: 0.10
Nodes (20): app/admin/commandes/page.tsx — Order Management, app/page.tsx — Landing Page, AdminShell Component, AutoRefresh Component, NoteColis Component, OrdersTable Component, Facturation — Invoice PDF Feature, lib/carriers.ts — Carriers + Tracking URLs (+12 more)

### Community 13 - "Autocomplete Adresse & Form"
Cohesion: 0.14
Nodes (8): cormorant, dmSans, jetbrains, metadata, BagDrawer(), LenisContext, LenisCtx, useLenis()

### Community 15 - "Gestion Commandes & Tracking"
Cohesion: 0.40
Nodes (5): BASE_URL, buildEmail(), main(), resend, supabase

### Community 16 - "Marque & Collection LOCHT 01"
Cohesion: 0.70
Nodes (3): cn(), Button(), buttonVariants

### Community 17 - "Règles Métier & Paiement"
Cohesion: 0.50
Nodes (4): api/orders/route.ts — POST Order, Supabase Table: orders, lib/generate-ref.ts — Reference Generator (LOCHT-YYYY-###), lib/schemas.ts — Zod Validation

### Community 19 - "Dashboard Admin & Actions"
Cohesion: 0.67
Nodes (3): app/admin/actions.ts — Server Actions, Bug: OrderStatus export type in use server (juin 2026), QuickAction Component

### Community 20 - "Utils & Composants UI"
Cohesion: 0.67
Nodes (3): api/pieces/route.ts — GET Inventory Public, PiecesProvider Component, Supabase Table: pieces

### Community 21 - "Email & DNS Infrastructure"
Cohesion: 0.67
Nodes (3): Bug: Mixed image URLs in emails, lib/email-confirmation.ts — Confirmation Email Template, lib/email-from.ts — Sender Constant (ml@maisonlocht.com)

## Knowledge Gaps
- **196 isolated node(s):** `metadata`, `O`, `MODEL_NAMES`, `PROVINCE_MAP`, `NominatimResult` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerClient()` connect `Étapes Formulaire & UX` to `Landing & Formulaire`, `Admin Shell & Navigation`, `UI Components & Aliases`, `Layout & Typographie`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `pieceNum()` connect `Admin Actions & Emails` to `Étapes Formulaire & UX`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `buildConfirmationEmail()` connect `Layout & Typographie` to `Admin Actions & Emails`, `Étapes Formulaire & UX`, `Dépendances & Config npm`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createServerClient()` (e.g. with `createAuthClient()` and `createClient()`) actually correct?**
  _`createServerClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `O`, `MODEL_NAMES` to the rest of the system?**
  _201 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Actions & Emails` be split into smaller, more focused modules?**
  _Cohesion score 0.05807622504537205 - nodes in this community are weakly interconnected._
- **Should `Landing & Formulaire` be split into smaller, more focused modules?**
  _Cohesion score 0.06567992599444958 - nodes in this community are weakly interconnected._