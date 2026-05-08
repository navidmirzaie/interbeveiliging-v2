# Implementation Plan: InterBeveiliging v2 — Project Foundation

**Branch**: `feat/001-interbeveiliging-foundation` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-interbeveiliging-foundation/spec.md`

## Summary

Build the full-stack foundation for InterBeveiliging v2 — a multi-tenant SaaS for Dutch private security organisations to manage guards, weekly schedules, and CAO Particuliere Beveiliging 2024–2026 compliance. The stack is Nuxt 3 (4-layer architecture) + Supabase + Drizzle ORM + Pinia + custom swimlane calendar + Claude AI auto-plan + Resend email + Netlify deployment.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 LTS  
**Primary Dependencies**: Nuxt 3, Vue 3 Composition API, @nuxt/ui ^4.6.1, @nuxtjs/supabase, Drizzle ORM, Pinia, Resend, @anthropic-ai/sdk  
**Storage**: Supabase PostgreSQL (multi-tenant via RLS)  
**Testing**: Vitest (CAO validator unit tests, server util tests)  
**Target Platform**: Netlify (serverless functions + scheduled functions) + Supabase Cloud  
**Project Type**: Web application — SaaS (multi-tenant)  
**Performance Goals**: Schedule page renders 50 guards × 7 days at 60fps; email batch for 50 recipients within 30s  
**Constraints**: Dates stored UTC / displayed Europe/Amsterdam; KvK exactly 8 digits; API keys server-side only  
**Scale/Scope**: Designed for 500 employees / 10,000 shifts per org (constitution requirement)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|---|---|---|
| `@nuxtjs/supabase` used — never raw `@supabase/supabase-js` | ✅ PASS | Module used throughout |
| No FullCalendar / calendar library installed | ✅ PASS | Custom `<table>` swimlane only |
| `@nuxt/ui ^4.6.1` pinned version | ✅ PASS | Exact semver range in `package.json` |
| Repository pattern — no raw Drizzle in server routes | ✅ PASS | `employeeRepository`, `grantRepository`, `shiftRepository` in `layers/core/server/repositories/` |
| RBAC at middleware AND server route level | ✅ PASS | `roleGuard.ts` + per-route `getAuthRole(event)` guard |
| `validateCaoConstraints` called on every shift save | ✅ PASS | Server-side in POST/PATCH `/api/shifts` |
| Layer dependency rule: `tenant → core → ui → base` | ✅ PASS | Import direction enforced by layer structure |
| Soft-delete with `deleted_at` — no hard-delete when shifts exist | ✅ PASS | DELETE route checks for existing shifts |
| Anthropic API key server-side only | ✅ PASS | Lives in `runtimeConfig` (not `runtimeConfig.public`) |
| Resend API key server-side only | ✅ PASS | Lives in `runtimeConfig` (not `runtimeConfig.public`) |
| `ui` layer: props/emits only, no data fetching | ✅ PASS | All `layers/ui` components receive data via props |
| Vue component structure: `<script>` before `<template>`, PascalCase types, generic `defineProps` | ✅ PASS | Enforced by constitution III |
| Rendering strategy: `/schedule` = `ssr: false` | ✅ PASS | `routeRules` in `nuxt.config.ts` (⚠️ note below) |
| `serverSupabaseServiceRole` used only in `POST /api/auth/register` | ✅ PASS | Only registration route uses service role |
| Auto-plan: ghost shifts, planner confirmation required | ✅ PASS | Suggestions never auto-committed |
| `npm run typecheck` before commits | ✅ REQUIRED | Added to git pre-commit hook |

**⚠️ Note on `/schedule` rendering**: The tech plan's route table listed `/schedule` as SSR, but the `routeRules` code block in the same document correctly uses `ssr: false`. The constitution (Rendering Strategy section) and the code are consistent — `ssr: false`. The table comment was an authoring inconsistency. **Constitution governs: `/schedule` = SPA (`ssr: false`).**

**Post-design re-check**: All gates remain PASS after Phase 1 design. No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-interbeveiliging-foundation/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0: decisions and resolved clarifications
├── data-model.md        ← Phase 1: full schema + Drizzle types
├── quickstart.md        ← Phase 1: dev setup instructions
├── contracts/
│   ├── auth.md          ← POST /api/auth/register, GET /api/auth/session
│   ├── employees.md     ← CRUD + availability endpoints
│   ├── shifts.md        ← shifts CRUD, publish, auto-plan
│   └── settings.md      ← settings, role types, grants, email trigger
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
interbeveiliging-v2/
├── layers/
│   ├── base/                          # Layer 1 — infrastructure
│   │   ├── middleware/
│   │   │   ├── auth.ts                # Redirect unauthenticated users to /auth/login
│   │   │   └── guest.ts               # Redirect authenticated users away from /auth/*
│   │   ├── server/
│   │   │   └── utils/
│   │   │       ├── drizzle.ts         # Drizzle client singleton
│   │   │       ├── supabase.ts        # serverSupabaseClient / serverSupabaseUser helpers
│   │   │       ├── caoValidator.ts    # Pure CAO validation functions — no DB
│   │   │       └── resend.ts          # Resend client singleton
│   │   └── types/
│   │       ├── database.ts            # Inferred Drizzle types (Employee, Shift, etc.)
│   │       ├── api.ts                 # Result<T>, CaoViolation, CreateShiftPayload
│   │       └── auth.ts                # UserRole, Session types
│   │
│   ├── ui/                            # Layer 2 — dumb component library
│   │   └── components/
│   │       ├── base/
│   │       │   ├── BaseButton.vue
│   │       │   ├── BaseInput.vue
│   │       │   ├── BaseModal.vue
│   │       │   ├── BaseTable.vue
│   │       │   └── BaseBadge.vue
│   │       ├── schedule/
│   │       │   ├── ScheduleWeekGrid.vue     # Custom swimlane table — props/emits only
│   │       │   ├── ScheduleWeekGridGuardCard.vue  # Child of ScheduleWeekGrid
│   │       │   ├── ShiftCard.vue
│   │       │   ├── ShiftModal.vue           # CAO warning computed reactively
│   │       │   ├── GuardSidebar.vue         # Draggable guard cards
│   │       │   └── AutoPlanPreview.vue      # Ghost shift confirmation UI
│   │       ├── employees/
│   │       │   ├── EmployeeTable.vue
│   │       │   ├── EmployeeForm.vue
│   │       │   ├── EmployeeFormAvailabilityTable.vue  # Child of EmployeeForm
│   │       │   └── EmployeeAvatar.vue
│   │       └── grants/
│   │           └── GrantBadge.vue
│   │
│   ├── core/                          # Layer 3 — features & business logic
│   │   ├── layouts/
│   │   │   └── dashboard.vue          # UDashboardLayout + role-gated nav links
│   │   ├── pages/
│   │   │   ├── index.vue              # Redirect to /dashboard
│   │   │   ├── auth/
│   │   │   │   ├── login.vue
│   │   │   │   └── register.vue
│   │   │   ├── dashboard/
│   │   │   │   └── index.vue
│   │   │   ├── employees/
│   │   │   │   ├── index.vue
│   │   │   │   └── [id].vue
│   │   │   ├── schedule/
│   │   │   │   └── index.vue
│   │   │   └── settings/
│   │   │       └── index.vue
│   │   ├── composables/
│   │   │   ├── useAuth.ts
│   │   │   ├── useEmployees.ts
│   │   │   ├── useGrants.ts
│   │   │   └── useSchedule.ts
│   │   ├── stores/
│   │   │   ├── auth.ts                # useAuthStore — Setup Store syntax
│   │   │   ├── employees.ts           # useEmployeesStore — Setup Store syntax
│   │   │   └── schedule.ts            # useScheduleStore — Setup Store syntax
│   │   └── server/
│   │       ├── api/
│   │       │   ├── auth/
│   │       │   │   ├── register.post.ts
│   │       │   │   └── session.get.ts
│   │       │   ├── employees/
│   │       │   │   ├── index.get.ts
│   │       │   │   ├── index.post.ts
│   │       │   │   ├── [id].get.ts
│   │       │   │   ├── [id].patch.ts
│   │       │   │   ├── [id].delete.ts
│   │       │   │   └── [id]/availability.put.ts
│   │       │   ├── grants/
│   │       │   │   ├── index.post.ts
│   │       │   │   └── [id].delete.ts
│   │       │   ├── role-types/
│   │       │   │   ├── index.get.ts
│   │       │   │   ├── index.post.ts
│   │       │   │   └── [id].delete.ts
│   │       │   ├── shifts/
│   │       │   │   ├── index.get.ts
│   │       │   │   ├── index.post.ts
│   │       │   │   ├── [id].patch.ts
│   │       │   │   ├── [id].delete.ts
│   │       │   │   └── publish.patch.ts
│   │       │   ├── auto-plan/
│   │       │   │   └── index.post.ts
│   │       │   ├── settings/
│   │       │   │   ├── index.get.ts
│   │       │   │   └── index.patch.ts
│   │       │   └── schedule/
│   │       │       └── send-emails.post.ts
│   │       ├── repositories/
│   │       │   ├── employeeRepository.ts
│   │       │   ├── grantRepository.ts
│   │       │   └── shiftRepository.ts
│   │       └── emails/
│   │           ├── guardScheduleEmail.ts
│   │           └── plannerOverviewEmail.ts
│   │
│   └── tenant/                        # Layer 4 — org branding
│       ├── components/
│       │   ├── AppHeader.vue
│       │   ├── AppSidebar.vue
│       │   └── AppLogo.vue
│       └── composables/
│           └── useTenantTheme.ts
│
├── drizzle/
│   ├── schema.ts                      # See data-model.md for full definition
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       └── rls-policies.sql
├── netlify/
│   └── functions/
│       └── send-weekly-emails.ts      # Netlify Scheduled Function (@hourly)
├── app/
│   └── assets/
│       └── css/
│           └── main.css               # @import "tailwindcss"; @import "@nuxt/ui";
├── nuxt.config.ts
├── netlify.toml
└── .env.example
```

**Structure Decision**: Nuxt 4-layer extends system (Option 2 variant: no separate frontend/backend directories — Nuxt collocates both). Repositories in `layers/core/server/repositories/`, email templates in `layers/core/server/emails/`.

## Complexity Tracking

> No violations — all architecture decisions comply with the constitution.

---

## Phase 0: Research — Complete

See [research.md](research.md) for all decisions and resolved clarifications.

Key findings:
- `/schedule` route: `ssr: false` per constitution (swimlane has no browser-API dependency but SSR is disabled to match constitution's rendering strategy table).
- CAO validator: hard constraints block saves (`severity: 'error'`); soft constraints show ShiftModal warnings (`severity: 'warning'`).
- Branch numbering: sequential (from `init-options.json`).

---

## Phase 1: Design — Complete

### Data Model

See [data-model.md](data-model.md) for the full schema, Drizzle type definitions, RLS policy table, state transitions, and index strategy.

**7 tables**: `organisations`, `profiles`, `role_types`, `grants`, `organisation_settings`, `employee_availability`, `shifts`.

### API Contracts

See [contracts/](contracts/):
- [auth.md](contracts/auth.md) — registration + session
- [employees.md](contracts/employees.md) — CRUD + availability
- [shifts.md](contracts/shifts.md) — shifts CRUD, publish, auto-plan
- [settings.md](contracts/settings.md) — settings, role types, grants, email trigger

### Quickstart

See [quickstart.md](quickstart.md) for dev setup, first registration, and validation checklist.

### Agent Context

Updated `CLAUDE.md` via `update-agent-context.sh claude` — tech stack, project structure, and build commands reflect this plan.
