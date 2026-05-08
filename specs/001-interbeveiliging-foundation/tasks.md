---
description: "Task list for InterBeveiliging v2 — full-stack implementation"
---

# Tasks: InterBeveiliging v2 — Project Foundation

**Input**: Design documents from `specs/001-interbeveiliging-foundation/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Constitution corrections applied to user's task breakdown**:
- A-01: `vue-cal` removed from install list — FORBIDDEN by constitution (custom swimlane only)
- D-00: `npm install @nuxt/ui@next` → `npm install @nuxt/ui@^4.6.1` (pinned version required)
- H-03: "ghost overlay on vue-cal" → ghost shifts rendered as `.ghost` CSS class in custom swimlane

---

## Module A — Foundation & Auth

### A-01 — Nuxt 3 project with 4-layer architecture

- [X] A-01a Initialize Nuxt 3 project at repo root (nuxi init, keep existing files)
- [X] A-01b [P] Create `layers/base/nuxt.config.ts` — infrastructure layer config
- [X] A-01c [P] Create `layers/ui/nuxt.config.ts` — dumb component layer config
- [X] A-01d [P] Create `layers/core/nuxt.config.ts` — feature layer config
- [X] A-01e [P] Create `layers/tenant/nuxt.config.ts` — branding layer config
- [X] A-01f Wire root `nuxt.config.ts` to extend all 4 layers, add `@nuxt/ui` + `@nuxtjs/supabase` modules
- [X] A-01g [P] Install packages: `@nuxt/ui@^4.6.1 @nuxtjs/supabase drizzle-orm drizzle-kit pinia date-fns date-fns-tz resend @anthropic-ai/sdk @netlify/functions`
- [X] A-01h Set up `app/assets/css/main.css` with `@import "tailwindcss"; @import "@nuxt/ui";`
- [X] A-01i Create `.env.example` with all required variable names
- [X] A-01j Create `layers/base/types/api.ts` — `Result<T>`, `CaoViolation`, shared types
- [X] A-01k Create `layers/base/types/auth.ts` — `UserRole`, `Session` types
- [X] A-01l Verify: `npm run dev` starts and resolves pages from core layer

### A-02 — Drizzle ORM + Supabase schema

- [X] A-02a Create `drizzle/schema.ts` — all 7 tables with Drizzle column definitions (from data-model.md)
- [X] A-02b Create `drizzle.config.ts` pointing to `DATABASE_URL`
- [X] A-02c Add `db:generate`, `db:migrate`, `db:studio` scripts to `package.json`
- [X] A-02d Create `layers/base/server/utils/drizzle.ts` — singleton Drizzle client
- [X] A-02e Create `drizzle/migrations/rls-policies.sql` with all RLS policy SQL (from contracts)
- [X] A-02f Run `npm run db:generate` — verify migration file created

### A-03 — Organisation registration page

- [X] A-03a Create `layers/core/pages/auth/register.vue` — KvK validation, email, password fields
- [X] A-03b Create `layers/core/server/api/auth/register.post.ts` — org + user + profile in one transaction
- [X] A-03c Implement KvK validation (`/^\d{8}$/`) client-side and server-side
- [X] A-03d On success: redirect to `/dashboard`; on failure: inline Dutch error messages

### A-04 — Login + auth middleware

- [X] A-04a Create `layers/core/pages/auth/login.vue` — email/password login via `useSupabaseClient()`
- [X] A-04b Create `layers/base/middleware/auth.ts` — redirect unauthenticated → `/auth/login`
- [X] A-04c Create `layers/base/middleware/guest.ts` — redirect authenticated away from `/auth/*`
- [X] A-04d Create `layers/base/middleware/roleGuard.ts` — redirect `role=employee` away from `/settings/*`
- [X] A-04e Create `layers/core/stores/auth.ts` — Setup Store: `user`, `organisation`, `role`, `canPlan`, `isEmployee`, `isAdmin`, `isPlanner`, `fetchSession`, `clear`
- [X] A-04f Create `layers/base/server/utils/supabase.ts` — `getOrgId` and `getAuthRole` helpers

### A-05 — Employees + Schedule Pinia stores

- [X] A-05a Create `layers/core/stores/employees.ts` — `all`, `schedulable` computed (role=employee only), `fetch`, `updateAvailability`
- [X] A-05b Create `layers/core/stores/schedule.ts` — `shifts`, `selectedWeek`, `fetchWeek`, `createShift`, `updateShift`, `deleteShift`, `publishWeek`
- [X] A-05c Verify `schedulable` computed never includes admin or planner profiles

---

## Module B — Employee Management

### B-01 — Employee list page

- [X] B-01a Create `layers/core/server/repositories/employeeRepository.ts` — `findByOrg`, `findById`, `create`, `update`, `softDelete`
- [X] B-01b Create `layers/core/server/api/employees/index.get.ts` — GET /api/employees
- [X] B-01c Create `layers/ui/components/employees/EmployeeTable.vue` — name, number, email, phone, grant badges (props/emits only)
- [X] B-01d Create `layers/core/pages/employees/index.vue` — fetch + render EmployeeTable

### B-02 — Add/Edit employee form

- [X] B-02a Create `layers/ui/components/employees/EmployeeForm.vue` — modal, props/emits only
- [X] B-02b Create `layers/core/server/api/employees/index.post.ts` — POST /api/employees
- [X] B-02c Create `layers/core/server/api/employees/[id].patch.ts` — PATCH /api/employees/:id
- [X] B-02d Create `layers/ui/components/employees/EmployeeFormAvailabilityTable.vue` — 7-day availability input (child of EmployeeForm)

### B-03 — Soft-delete employee

- [X] B-03a Create `layers/core/server/api/employees/[id].delete.ts` — sets `deleted_at`, blocks if shifts exist
- [X] B-03b Create `layers/core/server/api/employees/[id].get.ts` — GET /api/employees/:id with availability
- [X] B-03c Create `layers/core/server/api/employees/[id]/availability.put.ts` — PUT availability upsert
- [X] B-03d Add confirm dialog to employee list for soft-delete action

---

## Module C — Roles & Grants

### C-01 — Role type management

- [X] C-01a Create `layers/core/server/repositories/grantRepository.ts` — `findByProfile`, `create`, `delete`
- [X] C-01b Create `layers/core/server/api/role-types/index.get.ts`
- [X] C-01c Create `layers/core/server/api/role-types/index.post.ts`
- [X] C-01d Create `layers/core/server/api/role-types/[id].delete.ts` — blocked if active grants reference it

### C-02 — Grant assignment UI

- [X] C-02a Create `layers/ui/components/grants/GrantBadge.vue` — active/expired/pending states
- [X] C-02b Create `layers/core/pages/employees/[id].vue` — detail page with grants section
- [X] C-02c Create `layers/core/server/api/grants/index.post.ts`
- [X] C-02d Create `layers/core/server/api/grants/[id].delete.ts`

---

## Module D — Dashboard Layout & Schedule (Manual)

### D-00 — Dashboard layout shell + design system

- [X] D-00a Create `app/assets/css/main.css` tokens section — copy all CSS custom properties from design spec (`--c-navy`, `--c-blue`, etc.)
- [X] D-00b Create `layers/core/layouts/dashboard.vue` — `UDashboardLayout` + `UDashboardPanel` (240px, collapsible)
- [X] D-00c Implement sidebar: navy `#1E3A5F` bg, role-gated nav links, user info at bottom
- [X] D-00d Implement topbar: hamburger toggle, page title, dark mode toggle, bell, divider, org name, avatar
- [X] D-00e Dark mode: toggle `html.dark` class + persist to `localStorage`
- [X] D-00f Add `definePageMeta({ layout: 'dashboard' })` to all authenticated pages

### D-01 — Custom swimlane calendar component

- [X] D-01a Create `layers/ui/components/schedule/ScheduleWeekGrid.vue` — `<table>` swimlane, props/emits only, SSR-safe
- [X] D-01b Implement table structure: `table-layout: fixed`, first col 160px, 7 equal day columns, min row height 56px
- [X] D-01c Implement shift block CSS variants: `.published`, `.draft`, `.ghost`
- [X] D-01d Implement empty cell hover: dashed "+" add-shift button
- [X] D-01e Wire emits: `shift:click`, `shift:add`, `guard:dropped`
- [X] D-01f Create `layers/ui/components/schedule/ScheduleWeekGridGuardCard.vue` — child of ScheduleWeekGrid, `draggable="true"`, `@dragstart` sets `dataTransfer`

### D-02 — Shift modal + role enforcement

- [X] D-02a Create `layers/core/server/repositories/shiftRepository.ts` — `findByWeek`, `create`, `update`, `delete`, `publishWeek`
- [X] D-02b Create `layers/ui/components/schedule/ShiftModal.vue` — employee dropdown (schedulable only), date, start/end time, location; CAO warning banner
- [X] D-02c Create `layers/core/server/api/shifts/index.post.ts` — validates `profileId.role === 'employee'`, calls `validateCaoConstraints`
- [X] D-02d Create `layers/core/server/api/shifts/[id].patch.ts`
- [X] D-02e Create `layers/core/server/api/shifts/[id].delete.ts`

### D-03 — Schedule page + publish flow

- [X] D-03a Create `layers/core/server/api/shifts/index.get.ts` — scoped to `organisation_id` + date range
- [X] D-03b Create `layers/core/server/api/shifts/publish.patch.ts`
- [X] D-03c Create `layers/core/pages/schedule/index.vue` — week navigation, ScheduleWeekGrid + GuardSidebar, publish button

### D-04 — Employee schedule view (read-only)

- [X] D-04a Employee role sees own published shifts only in the swimlane (`isReadOnly: true` prop)
- [X] D-04b Same week navigation UI as planner view

---

## Module G — Drag-and-Drop & CAO

### G-01 — Guard sidebar + native drag

- [X] G-01a Create `layers/ui/components/schedule/GuardSidebar.vue` — renders `GuardCard` list, search input, role=employee only
- [X] G-01b Implement `ScheduleWeekGrid` day cell `@dragover.prevent` + `@drop` handlers

### G-02 — Shift modal — matching design spec exactly

- [X] G-02a Align `ShiftModal.vue` with `ib-components.js` spec: footer buttons ("Verwijderen" left, "Annuleren" + "Opslaan" right)
- [X] G-02b Implement nested `ConfirmDialog` before delete
- [X] G-02c On save/delete: update `useScheduleStore().shifts` directly — no full refetch

### G-03 — CAO validator utility

- [X] G-03a Create `layers/base/server/utils/caoValidator.ts` — all 18 CAO rules as pure functions
- [X] G-03b Implement: max shift duration (Art. 26), max night shift (Art. 28), daily rest (Art. 27 lid 1), weekly rest A+B (Art. 27 lid 2), free Sundays (Art. 27 lid 3)
- [X] G-03c Implement: max weekly hours (Art. 26), 13-week average cap (Art. 26), full-time norm (Art. 10)
- [X] G-03d Implement: night shift definition + max per period (Art. 28), night shift series + 2-week cap (Art. 28)
- [X] G-03e Implement: break rules (Art. 29), heavy night schedule (Art. 28)
- [X] G-03f Create `layers/base/types/database.ts` — inferred Drizzle types + `CaoViolation` export
- [X] G-03g Write Vitest unit tests — one test per CAO rule (18 tests)

### G-04 — CAO warning display

- [X] G-04a Server route shift POST/PATCH returns `violations[]` alongside result
- [X] G-04b ShiftModal displays amber warning banner for `severity: 'warning'`
- [X] G-04c Shift save blocked client-side and server-side for `severity: 'error'`

---

## Module H — Auto-Schedule (AI)

### H-01 — Auto-schedule API route

- [X] H-01a Create `layers/core/server/api/auto-plan/index.post.ts` — fetch employees + history, build prompt, call Claude
- [X] H-01b Fetch past 16 weeks per employee for CAO rolling-window constraints

### H-02 — Claude prompt

- [X] H-02a Create `layers/core/server/api/auto-plan/buildPrompt.ts` — system prompt with 18 CAO rules as numbered constraints
- [X] H-02b Instruction: return only valid JSON `{ suggestions: [...], unfillable: [...] }`
- [X] H-02c Parse response with `Result<T>` pattern (try/catch JSON.parse)
- [X] H-02d Use model `claude-sonnet-4-20250514` via `@anthropic-ai/sdk`

### H-03 — Auto-plan preview UI

- [X] H-03a Create `layers/ui/components/schedule/AutoPlanPreview.vue` — ghost shift overlay in swimlane, summary counts, accept/reject actions
- [X] H-03b "Auto-plannen" button on schedule page (admin/planner only)
- [X] H-03c Loading state while Claude generates; ghost shifts appear as `.ghost` CSS class in swimlane

### H-04 — Auto-plan confirmation route

- [X] H-04a Create `layers/core/server/api/auto-plan/confirm.post.ts` — re-validates CAO, saves in single Drizzle transaction
- [X] H-04b Returns saved shifts with any last-minute violations

---

## Module F — Tenant Branding

### F-01 — Tenant layer structure

- [X] F-01a Create `layers/tenant/components/AppHeader.vue`, `AppSidebar.vue`, `AppLogo.vue`
- [X] F-01b Create `layers/tenant/composables/useTenantTheme.ts`

### F-02 — useTenantTheme composable

- [X] F-02a Apply CSS vars `--color-primary` from auth store org data to `document.documentElement`
- [X] F-02b Watch org changes reactively; fallback to `#1E3A5F`

### F-03 — AppLogo component

- [X] F-03a Render `organisation.logo_url` from Supabase Storage
- [X] F-03b Fallback to org name initials avatar if no logo

### F-04 — AppHeader + AppSidebar overrides + settings

- [X] F-04a AppHeader: AppLogo slot + `--color-primary` background token
- [X] F-04b AppSidebar: nav items via props, styled with tenant token
- [X] F-04c Settings page: upload logo, change primary colour

---

## Module E — Email + Dashboard

### E-01 — Weekly email system

- [X] E-01a Create `layers/core/server/emails/guardScheduleEmail.ts` — guard personal shift table template
- [X] E-01b Create `layers/core/server/emails/plannerOverviewEmail.ts` — full week overview template
- [X] E-01c Create `layers/base/server/utils/resend.ts` — Resend singleton
- [X] E-01d Create `layers/core/server/api/schedule/send-emails.post.ts` — CRON_SECRET validation, Amsterdam TZ check, send logic
- [X] E-01e Create `netlify/functions/send-weekly-emails.ts` — Netlify Scheduled Function (`@hourly`)
- [X] E-01f Create `netlify.toml` — build config, scheduled function, security headers, cache headers

### E-02 — Dashboard home + settings page

- [X] E-02a Create `layers/core/pages/dashboard/index.vue` — stats cards (total employees, shifts this week, today's shifts), quick links
- [X] E-02b Create `layers/core/pages/settings/index.vue` — org name, email send time/day, logo upload, primary colour
- [X] E-02c Create `layers/core/server/api/settings/index.get.ts` and `index.patch.ts` (403 for employee role)
- [X] E-02d Create `error.vue` at repo root — global error page with `clearError({ redirect: '/dashboard' })`

---

## Dependencies & Execution Order

- **A-01** → everything (project must exist first)
- **A-02** → A-03, A-04, B-01 (schema must exist before any DB operation)
- **A-04** → all authenticated pages
- **G-03** → D-02c, D-03b, H-01, H-04 (CAO validator needed before shift saves)
- **D-01** → G-01, G-02, D-03 (swimlane must exist before schedule page)
- **B-01** → D-02 (employees must exist before shift modal)
- **H-01, H-02** → H-03, H-04 (API before UI)
- **E-01** → requires D-03 (shifts must be publishable before email can send them)
