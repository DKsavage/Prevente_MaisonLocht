# Maison Locht — Pré-vente LOCHT 01 · LES CERNES

Site de pré-vente de luxe (pièces uniques) — Next.js 14 · Supabase · Resend · Vercel.

**En ligne :** https://prevente.maisonlocht.com · **Admin :** /admin

---

## Démarrer sur une nouvelle machine

```bash
git clone https://github.com/DKsavage/Prevente_MaisonLocht.git
cd Prevente_MaisonLocht
npm install
cp .env.example .env.local      # puis remplir avec les valeurs de Vercel → Settings → Env Vars
npm run dev                     # http://localhost:3000
```

> Node 18+. Les secrets ne sont pas dans le repo — récupère-les dans Vercel → Settings → Environment Variables.

## Workflow de modification

```bash
# modifier le code dans VSCode…
npx tsc --noEmit                # vérifier les types
git add -A && git commit -m "..." && git push    # Vercel redéploie automatiquement
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de dev local |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Vérification TypeScript |

## Architecture

- `app/` — pages (landing, `/admin/*`, `/commande/[code]`) + `app/api/*` (routes)
- `app/admin/actions.ts` — server actions admin
- `lib/` — Supabase, schémas Zod, paiement, transporteurs, emails
- `components/` — `landing/`, `form/`, `admin/`
- `middleware.ts` — protège `/admin`

**Détails complets et règles métier : voir `CLAUDE.md`.**

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (PostgreSQL + Auth + Storage) · Resend (emails) · Framer Motion + Lenis · Vercel.
