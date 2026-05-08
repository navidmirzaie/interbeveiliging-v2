# Research: InterBeveiliging v2 — Project Foundation

**Branch**: `feat/001-interbeveiliging-foundation` | **Date**: 2026-04-21
**Phase**: 0 — All NEEDS CLARIFICATION resolved

---

## Decision 1: Nuxt Layer Architecture vs Monolith

**Decision**: 4-layer Nuxt extends system (`base → ui → core → tenant`).

**Rationale**: The project has clear separation concerns: infrastructure utilities (base), reusable dumb components (ui), feature business logic (core), and branding overrides (tenant). Nuxt's `extends` array with local paths achieves this without a monorepo tool. Each layer compiles as a Nuxt Layer, enabling clean dependency direction enforcement.

**Alternatives considered**:
- Single-layer monolith: simpler initially but mixes concerns; impossible to enforce the ui layer's no-fetch contract without architectural separation.
- Turborepo monorepo: overkill for one application; adds significant tooling complexity.

---

## Decision 2: Drizzle ORM vs Prisma vs raw SQL

**Decision**: Drizzle ORM with PostgreSQL (Supabase).

**Rationale**: Drizzle is TypeScript-first with zero-runtime overhead, generates type-safe queries without a code generation step per change, and produces SQL that is easily audited. Migration files are plain SQL, readable by the Supabase SQL editor. Prisma adds a binary query engine and a code generation step that complicates serverless cold starts on Netlify.

**Alternatives considered**:
- Prisma: widely used but cold-start overhead on serverless is a known issue; binary engine complicates Netlify functions.
- Raw SQL (pg or postgres.js): no type safety; N+1 query bugs are harder to detect.

---

## Decision 3: @nuxtjs/supabase vs raw @supabase/supabase-js

**Decision**: `@nuxtjs/supabase` module exclusively.

**Rationale**: The Nuxt module handles SSR cookie hydration, session auto-refresh, and provides `serverSupabaseClient`/`serverSupabaseUser` helpers that correctly attach the user's JWT to server-side queries, enforcing RLS. Raw `supabase-js` instantiated on the server would require manual token forwarding and breaks RLS if the service role key is used carelessly.

**Alternatives considered**:
- Raw `@supabase/supabase-js`: rejected per constitution — FORBIDDEN in this project.

---

## Decision 4: Custom Swimlane Table vs FullCalendar

**Decision**: Custom `<table>` swimlane grid — no external calendar library.

**Rationale**: FullCalendar adds ~200KB to the bundle, introduces an external API surface to learn, and its resource/timeline view doesn't match the exact pixel-perfect design in `ib-styles.css`. The swimlane is a guard-per-row, day-per-column table — a standard HTML table with fixed columns. Native HTML5 drag events (no library) handle guard sidebar → cell drops. The custom component is fully SSR-safe since it uses no `window`/`document` APIs.

**Note on rendering strategy**: The constitution's rendering table lists `/schedule` as `SPA (ssr: false)`. Even though the swimlane itself is SSR-safe, the route rule `'/schedule': { ssr: false }` is retained to match the constitution. The constitution governs; the table comment in the tech plan that says "SSR" was an authoring inconsistency — the code block in the same document correctly uses `ssr: false`.

**Alternatives considered**:
- FullCalendar: rejected per constitution — FORBIDDEN.
- vue-cal: rejected per constitution — FORBIDDEN.

---

## Decision 5: Email — Resend vs SendGrid vs Nodemailer

**Decision**: Resend via `npm: resend` SDK, server-side (Nitro) only.

**Rationale**: Resend is the modern, developer-friendly transactional email API with first-class TypeScript support. It has no self-hosted infrastructure requirement, simple API key auth, and supports `Promise.all` concurrency for batch sends. The API key stays in `runtimeConfig` (server-only), never in `runtimeConfig.public`.

**Alternatives considered**:
- SendGrid: more enterprise features not needed here; heavier SDK.
- Nodemailer: requires an SMTP server or credentials; more ops overhead than an API-based service.

---

## Decision 6: AI Auto-Plan — Claude claude-sonnet-4-20250514 via Anthropic API

**Decision**: `claude-sonnet-4-20250514` model, server-side Nitro route, structured output via tool_use.

**Rationale**: Claude can reason about scheduling constraints when given the CAO rules and employee availability as context. Using `tool_use` to return structured JSON shift objects avoids parsing prose output. The API call is strictly server-side — the `ANTHROPIC_API_KEY` lives in `runtimeConfig` (not public). Auto-plan output is always presented as ghost shifts requiring planner confirmation — never auto-committed.

**Alternatives considered**:
- GPT-4o: not the project's AI stack per the tech plan.
- Client-side inference: FORBIDDEN — API key exposure risk.

---

## Decision 7: Deployment — Netlify vs Vercel

**Decision**: Netlify with Nitro's Netlify preset.

**Rationale**: Nuxt 3 has a first-class Netlify adapter (`nitro.preset = 'netlify'`). Scheduled email function maps to Netlify Scheduled Functions (`@hourly`). Static assets get `Cache-Control: immutable` via `netlify.toml` headers. Environment variables are set in the Netlify UI — never committed.

**Alternatives considered**:
- Vercel: also first-class Nuxt support, but the project spec explicitly calls for Netlify.
- Self-hosted (VPS): more ops burden; not appropriate for a SaaS MVP.

---

## Decision 8: CAO Particuliere Beveiliging 2024–2026 Validation Architecture

**Decision**: Pure function module `caoValidator.ts` in `layers/base/server/utils/` returning `CaoViolation[]`.

**Rationale**: The CAO rules are deterministic given shift start/end times and a guard's shift history. Pure functions are infinitely fast (no I/O), trivially testable with Vitest, and can be called from both the ShiftModal (client-side warning display) and the server (pre-persist validation gate). The types are shared via `layers/base/types/api.ts`.

**Hard vs Soft constraints**:
- `severity: 'error'` = hard constraint (auto-plan rejects, manual save blocked).
- `severity: 'warning'` = soft constraint (ShiftModal shows amber banner, planner can override).

Hard constraints: daily rest < 11h, shift > 12h, night shift > 9h, weekly hours > 60.
Soft/warning constraints: shift 5.5–8h without 30min break, night series > 7 consecutive, average 13-week > 45h/week.

---

## Resolved Clarifications

| Item | Resolution |
|---|---|
| Testing framework | Vitest (Nuxt 3 default) for unit/integration tests on CAO validator and server utilities |
| Node version | 20 LTS (specified in `netlify.toml`) |
| Timezone | All dates stored UTC; displayed in `Europe/Amsterdam` using `Intl.DateTimeFormat` |
| Branch numbering | Sequential (per `init-options.json`: `"branch_numbering": "sequential"`) |
| Auth method | Supabase email+password only — no magic link, no OAuth in v1 |
| KvK validation | Exactly 8 digits (`/^\d{8}$/`), validated both client and server |
