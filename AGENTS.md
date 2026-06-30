<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## This repo: Unobtainium — portfolio site + admin dashboard

Two packages that run independently:

| Package | Dir | Framework | Dev command |
|---------|-----|-----------|-------------|
| Frontend | `/` | Next.js 14.2.15 (App Router) | `npm run dev` → :3000 |
| Backend  | `server/` | Fastify 4 + Prisma 5 + SQLite | `npm run dev` → :3001 |

### Frontend commands (`/`)
- `npm run dev` — Next.js dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)

### Backend commands (`server/`)
- `npm run dev` — Fastify dev server on port 3001 (uses `tsx watch`)
- `npm run build` — TypeScript compilation (`tsc`)
- `npx prisma migrate dev` — apply DB migrations (Prisma + SQLite)
- `npm run db:seed` — seed DB with demo data
- No lint or test commands currently configured

### DB setup
- SQLite file: `server/prisma/dev.db`
- Run migrations and seed **from the `server/` directory**
- Schema: 5 models — User, Service, Contact, Project, Testimonial

### Architecture notes
- **Frontend source** is under `src/`, `@/` aliases to `src/`
- **shadcn/ui v4 with base-nova style** using `@base-ui/react` primitives (NOT Radix). Components use `data-slot` attributes.
- **No tests exist.** There is no test framework, test runner, or test config in either package.
- **Auth flow:** Login POST to `/api/auth/login` sets an `auth-token` httpOnly cookie (JWT). `src/middleware.ts` protects `/dashboard/*` — server-side cookie check, redirects to `/login`.
- **All frontend API calls** hardcode `http://localhost:3001` (no env var abstraction).
- **Forms** use `react-hook-form` + `zodResolver` with Zod schemas.
- **Tailwind** CSS-variable theming (`globals.css`), class-based dark mode. Uses `@tailwindcss/postcss` in PostCSS config (not the classic PostCSS plugin convention).
- **CSS:** `tw-animate-css` for animations, `tailwind-merge` + `clsx` for class merging (`cn()` in `src/lib/utils.ts`).
- No `loading.tsx`, `error.tsx`, or `not-found.tsx` files. Only error handling is try/catch with empty fallbacks.
- Single root layout (`src/app/layout.tsx`) with inline nav bar — no nested layouts or separate nav component.

### Routing
- `/`, `/about`, `/services`, `/services/[id]`, `/projects`, `/contact` — public
- `/login` — public (client component)
- `/dashboard` — protected by middleware + server-side cookie check in `page.tsx`; admin CRUD for all entities
