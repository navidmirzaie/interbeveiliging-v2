<!--
SYNC IMPACT REPORT
==================
Version change: (unversioned template) → 1.0.0
Type of bump: MAJOR — first full population of all principles from unversioned template state.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Code Quality — Clean Code Principles
  - [PRINCIPLE_2_NAME] → II. TypeScript Design Patterns
  - [PRINCIPLE_3_NAME] → III. Vue Component Convention
  - [PRINCIPLE_4_NAME] → IV. UI Shell & Design System
  - [PRINCIPLE_5_NAME] → V. Architecture Principles

Added sections (beyond template default):
  - VI. Development Boundaries
  - VII. Vue Naming Conventions
  - VIII. Git Workflow
  - IX. Performance
  - X. Supabase Integration
  - XI. Rendering Strategy

Removed sections: None (all template placeholders replaced).

Templates reviewed:
  - .specify/templates/plan-template.md    ✅ No updates required — "Constitution Check" gate
    remains generic and will reflect this constitution at runtime.
  - .specify/templates/spec-template.md    ✅ No updates required — scope/requirements format
    is technology-agnostic and compatible with all principles.
  - .specify/templates/tasks-template.md   ✅ No updates required — task phases align with
    Nuxt layer structure (foundational → user story per layer).
  - .specify/templates/commands/           ✅ No command files found — nothing to update.

Deferred TODOs:
  - None. All placeholders resolved.
-->

# InterBeveiliging Constitution

## Core Principles

### I. Code Quality — Clean Code Principles

**Naming**

- Names MUST reveal intent — use searchable, pronounceable identifiers.
- Booleans: prefix with `is`, `has`, `can`, `should` (e.g. `isPublished`, `hasExpired`).
- Functions: verb + noun pairs — `fetchEmployees`, `publishSchedule`, `validateKvk`.
- Public API surfaces MUST NOT use abbreviations — write `organisationId`, not `orgId`.
- True constants: `SCREAMING_SNAKE_CASE` (e.g. `MAX_SHIFT_HOURS = 12`).

**Functions**

- Single responsibility — each function MUST do exactly one thing.
- Maximum 20 lines per function; extract helpers if exceeded.
- Boolean flag parameters are FORBIDDEN — use two separate functions or an options object.
- Pure computation functions MUST have no side effects; composables handle side effects.
- Guard clauses MUST be used to return early; nesting depth MUST NOT exceed 2 levels.

**What to Avoid**

- Magic numbers MUST be replaced with named constants.
- Deep nesting is FORBIDDEN — max 2 levels; extract or use early returns.
- Vue components over 200 lines MUST be split.
- Comments explaining *what* are FORBIDDEN — code must be self-documenting; comments explain *why*.
- The `any` type is FORBIDDEN — use `unknown` and narrow with type guards.

**DRY & Separation of Concerns**

- Repeated logic MUST be extracted into composables (e.g. `useGrants.ts`, `useSchedule.ts`).
- Business logic MUST NOT appear in Vue templates — delegate to composables or computed.
- Server routes MUST handle HTTP concerns only; business logic lives in service/repository functions.

### II. TypeScript Design Patterns

**Composable Pattern** — Encapsulate stateful logic, side effects, and API calls in composables.
Fetch logic MUST NOT be repeated across components.

```typescript
export const useGrants = (profileId: Ref<string>) => {
  const grants = ref<Grant[]>([])
  const isLoading = ref(false)
  const activeGrants = computed(() =>
    grants.value.filter(g => !isExpired(g.expiresAt))
  )
  watch(profileId, () => fetchGrants(), { immediate: true })
  return { grants, activeGrants, isLoading }
}
```

**Repository Pattern (server-side)** — All Drizzle queries MUST be abstracted behind repository
functions. Server routes MUST NOT use raw Drizzle directly.

```typescript
export const employeeRepository = {
  findByOrg: (db: DrizzleDB, orgId: string) =>
    db.select().from(profiles)
      .where(and(eq(profiles.organisationId, orgId), isNull(profiles.deletedAt))),
  softDelete: (db: DrizzleDB, id: string) =>
    db.update(profiles).set({ deletedAt: new Date() }).where(eq(profiles.id, id))
}
```

**Result Pattern** — Server utilities MUST return `Result<T>`; throwing for expected errors is
FORBIDDEN.

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string }
```

**Guard Clause Pattern** — Always validate and return early. Nested if-else pyramids are FORBIDDEN.

```typescript
if (!user) throw createError({ statusCode: 401 })
if (user.role !== 'admin') throw createError({ statusCode: 403 })
if (!orgId) throw createError({ statusCode: 400 })
// do work
```

**Immutability by Default** — Prefer `const`. Mutating props or Pinia store state directly outside
actions is FORBIDDEN.

### III. Vue Component Convention

All Vue components MUST follow this exact structure — no exceptions:

```vue
<script lang="ts" setup>

// 1. Types first — PascalCase
type Props = {
  name: string
  employeeId: string
  isActive?: boolean
}

// 2. Props — always generic syntax
const props = defineProps<Props>()

// 3. Emits — always generic syntax with named tuples
const emits = defineEmits<{
  'click': []
  'update:modelValue': [value: string]
  'employee:selected': [id: string]
}>()

// 4. Composables
const { employees, fetchEmployees } = useEmployees()

// 5. Reactive state
const isOpen = ref(false)

// 6. Computed
const fullName = computed(() => `${props.name}`)

// 7. Lifecycle
onMounted(() => fetchEmployees())

</script>

<template>
  <!-- template content -->
</template>
```

Rules:

- `<script>` MUST come before `<template>`.
- Type names MUST be PascalCase (`Props`, not `props`).
- `defineProps<Props>()` generic syntax MUST always be used — runtime object syntax is FORBIDDEN.
- Named tuple form MUST always be used in `defineEmits`.
- `<style>` blocks are FORBIDDEN — Tailwind utility classes only.
- One component per file — co-locating multiple components is FORBIDDEN.

### IV. UI Shell & Design System

**Nuxt UI Version**: `@nuxt/ui ^4.6.1`. Installing `@next` or unpinned `@latest` is FORBIDDEN.

Key v4 facts:
- v4 merges Nuxt UI and Nuxt UI Pro — `UDashboardLayout`, `USidebar`, `UDashboardPanel` and all
  Pro components are free and included.
- `@nuxt/icon`, `@nuxt/fonts`, `@nuxtjs/color-mode` are auto-registered — adding them separately
  to `modules` is FORBIDDEN.
- Tailwind CSS v4 MUST be imported via CSS, not as a PostCSS plugin:

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

- Design tokens MUST be defined with Tailwind v4's `@theme` directive — not in `tailwind.config.ts`.

**Design Reference** — The Claude Design output files (`InterBeveiliging.html`, `ib-styles.css`,
`ib-components.js`, `ib-views-1.js`, `ib-views-2.js`, `README.md`) are the authoritative source of
truth for all visual and interaction decisions. The Nuxt implementation MUST match them exactly.

**Design Tokens** (light mode):

```css
--c-navy:      #1E3A5F   /* sidebar bg — never changes in dark mode */
--c-blue:      #2563EB
--c-blue-bg:   #DBEAFE
--c-blue-tx:   #1E40AF
--c-slate:     #64748B
--c-border:    #E2E8F0
--c-bg:        #F1F5F9
--c-surface:   #FFFFFF
--c-text:      #0F172A
--c-muted:     #94A3B8
--c-green-bg:  #DCFCE7; --c-green-tx: #166534
--c-amber-bg:  #FEF3C7; --c-amber-tx: #92400E
--c-red-bg:    #FEE2E2; --c-red-tx:   #991B1B
--c-purple-bg: #EDE9FE; --c-purple-tx: #5B21B6
```

Dark mode (`html.dark`):

```css
--c-bg: #0F172A; --c-surface: #1E293B; --c-border: #2D3F55; --c-text: #F1F5F9
```

Sidebar background (`#1E3A5F`) MUST NOT change in dark mode.

**Layout constants**: sidebar 240px (collapsed 56px) · topbar 56px · page padding 24px ·
card padding 16px · radius sm/md/lg 6px/8px/12px · transition 0.18s ease.

**Typography**: Font Inter (400/500/600/700) · base 14px/1.5 · page title 16px/600 ·
table header 11px/700/uppercase.

**Custom Swimlane Calendar** — Installing FullCalendar, vue-cal, or any calendar package is
FORBIDDEN. The schedule MUST be a custom `<table>` swimlane grid as specified in `ib-styles.css`
and `ib-views-2.js` (RoosterView), living in
`layers/ui/components/schedule/ScheduleWeekGrid.vue`.

`ScheduleWeekGrid.vue` MUST be props/emits only — no data fetching:

```typescript
type Props = {
  shifts: Shift[]
  guards: Guard[]
  weekDays: string[]   // ['Ma','Di','Wo','Do','Vr','Za','Zo']
  weekDates: string[]  // ['19 mei', ...]
  isReadOnly: boolean
}
const emits = defineEmits<{
  'shift:click':   [shiftId: string]
  'shift:add':     [guardId: string, day: number]
  'guard:dropped': [employeeId: string, day: number]
}>()
```

Drag-and-drop MUST use native HTML5 drag events — no library.

**CAO Validation** — Reactively computed from `startTime`/`endTime` in ShiftModal:

```typescript
const duration = ((endH*60+endM) - (startH*60+startM) + 1440) % 1440
// duration > 540 → amber: art. 4.2 warning
// night shift (startH >= 22 || startH < 6) && duration > 480 → amber: art. 4.3 warning
```

`validateCaoConstraints` MUST be called on every shift save.

### V. Architecture Principles

**Nuxt Layer Dependency Rule** — Each layer MUST only import from layers below it. Never reverse.

```
tenant  →  core  →  ui  →  base
```

**UI Layer Contract** — Every component in `layers/ui` MUST:
- Receive all data via props.
- Communicate back only via emits.
- NEVER call `useFetch`, `useAsyncData`, or any network composable.
- NEVER import from `core` or `tenant`.

**Role-Based Access Control (RBAC)** — Three roles: `admin`, `planner`, `employee`.

| Area | admin | planner | employee |
|---|---|---|---|
| Settings page | ✅ | ✅ | ❌ redirect `/dashboard` |
| Schedule — create/edit shifts | ✅ | ✅ | ❌ |
| Schedule — can be scheduled | ❌ | ❌ | ✅ only |
| Employees — add/edit | ✅ | ✅ | ❌ |
| View own schedule | ✅ | ✅ | ✅ |
| Receive weekly own-schedule email | ❌ | ❌ | ✅ |
| Receive weekly overview email | ✅ | ✅ | ❌ |

RBAC MUST be enforced at both `middleware/roleGuard.ts` AND server route level. Client-side
middleware alone is NEVER sufficient.

**Planner self-scheduling rule** — The employee dropdown in shift creation and the auto-plan engine
MUST exclude profiles with role `admin` or `planner`. Only `role = 'employee'` profiles are
schedulable.

**Multi-Tenancy**:
- Bypassing Supabase RLS with the service role key client-side is FORBIDDEN.
- `organisationId` MUST always be derived from the authenticated user server-side — never from
  the request body.
- Employees MUST be soft-deleted with `deleted_at` — hard-deleting when shifts exist is FORBIDDEN.

## Development Boundaries

| ✅ Always | ⚠️ Ask First | 🚫 Never |
|---|---|---|
| Run `npm run typecheck` before commits | Add new Supabase tables or change RLS | Commit `.env` or API keys |
| Validate all inputs server-side | Add third-party npm packages | Hard-delete employees with shifts |
| Use Drizzle transactions for multi-table writes | Change DB column types on existing data | Bypass RLS with service role key client-side |
| Keep `ui` layer components prop/emit only | Add new Nuxt Layer | Import from a higher layer |
| Call `validateCaoConstraints` on every shift save | Modify applied migration files | Store auth tokens in localStorage |
| Preview auto-plan suggestions before saving | Change CAO constraint logic | Auto-commit AI-generated shifts without planner review |

## Vue Naming Conventions

All components MUST follow the official Vue style guide:

- Component file names MUST be PascalCase: `EmployeeForm.vue`, `ScheduleWeekGrid.vue`.
- Component names in templates MUST be PascalCase: `<EmployeeForm />`, NOT `<employee-form />`.
- All component names MUST be multi-word: `ShiftCard.vue` ✅, `Card.vue` ❌.
- Base (dumb) components in `layers/ui` MUST be prefixed with `Base`:
  `BaseButton.vue`, `BaseInput.vue`, `BaseModal.vue`, `BaseTable.vue`, `BaseBadge.vue`.
- Tightly-coupled child components MUST be prefixed with the parent name:
  `ScheduleWeekGridGuardCard.vue` (child of `ScheduleWeekGrid`).
- Page components in `pages/` are NEVER imported directly — routed only.

Before writing any new Vue component, composable, or store, the `vue` PatternsDev skill MUST be
consulted. Where the PatternsDev skill conflicts with this constitution, the constitution takes
precedence on architecture decisions; PatternsDev takes precedence on component-level
implementation patterns.

## Git Workflow

**Feature Branch Naming** — Every feature, fix, or chore MUST be on its own branch.
Committing directly to `main` is FORBIDDEN.

Format: `<type>/<short-description>` (lowercase, hyphens, max 5 words after type)

| Type | When to use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `chore/` | Config, deps, tooling |
| `refactor/` | Code restructure, no behaviour change |
| `test/` | Adding or fixing tests |
| `docs/` | Documentation only |

Branches MUST always be cut from `main`. Branching off another feature branch is FORBIDDEN.

**Conventional Commits** — All commit messages MUST follow Conventional Commits v1.0.0:

```
<type>(<optional scope>): <description>
```

Valid scopes: `auth`, `employees`, `schedule`, `email`, `ui`, `tenant`, `cao`, `settings`, `db`.

Rules:
- Description MUST be lowercase, imperative mood, no trailing period.
- One logical change per commit — bundling unrelated changes is FORBIDDEN.
- Breaking changes: add `!` after type and a `BREAKING CHANGE:` footer.

## Performance

Performance is a first-class requirement. Every implementation decision MUST consider
scalability at 500 employees / 10,000 shifts.

**Vue & Nuxt**:
- Heavy modals/overlays MUST use `<Lazy*>` components (e.g. `<LazyShiftModal>`).
- `v-once` MUST be used for static content that never changes after initial render.
- `v-memo` MUST be used for list items that only re-render on specific prop changes.
- Watchers where a computed property suffices are FORBIDDEN.
- Pinia store state MUST be kept flat and minimal.
- `shallowRef` MUST be used for large arrays where deep reactivity is unnecessary.
- `callOnce` MUST be used for one-time initialisation logic.
- `useFetch` MUST be preferred over `$fetch` in components.

**Data Fetching**:
- Reactive refs MUST be used in `useFetch` URLs — manually calling fetch in watchers is FORBIDDEN.
- `dedupe: 'cancel'` MUST be used on week navigation fetches.
- Employee lists MUST be paginated server-side for organisations beyond 50 employees.
- Drizzle `select()` MUST specify only required columns — `select *` in production is FORBIDDEN.
- All foreign keys and WHERE-clause columns MUST be indexed (`organisation_id`, `profile_id`,
  `date`, `week_published`).

**Database & Drizzle**:
- Every shift query MUST be scoped to `organisation_id` AND a date range.
- Drizzle transactions MUST be used for any operation writing to more than one table.
- N+1 queries are FORBIDDEN — use Drizzle joins.

**Email**:
- Email HTML MUST be rendered server-side in the Nitro route.
- Email templates MUST use inline CSS only — no external fonts or large images.
- Sending to many recipients MUST use `Promise.all` with a concurrency limit — sequential
  `await` in a loop is FORBIDDEN.

**Long-Term Architecture Rules**:
- Logic in templates is FORBIDDEN — computed properties and composables only.
- Repository pattern is MANDATORY — raw Drizzle in server routes is FORBIDDEN.
- Pinia stores are the single source of truth — components MUST NOT fetch their own data.
- CAO validator MUST be pure functions — stateless, no DB calls.
- Layer boundaries are performance boundaries — the `ui` layer MUST NEVER fetch data.

## Supabase Integration

Importing or instantiating `@supabase/supabase-js` directly is FORBIDDEN in a Nuxt project.
The official Nuxt module `@nuxtjs/supabase` MUST always be used.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/confirm',
      exclude: ['/auth/register'],
    }
  }
})
```

| Composable / Util | Where | Purpose |
|---|---|---|
| `useSupabaseClient()` | Vue components, composables | Client-side Supabase queries |
| `useSupabaseUser()` | Vue components, composables | Reactive current user ref |
| `useSupabaseSession()` | Vue components | Reactive session ref |
| `serverSupabaseClient(event)` | Nitro server routes | Server-side queries (respects user JWT) |
| `serverSupabaseUser(event)` | Nitro server routes | Get authenticated user in server routes |
| `serverSupabaseServiceRole(event)` | Nitro server routes | Admin operations only — use sparingly |

Rules:
- `serverSupabaseServiceRole` is ONLY permitted in `POST /api/auth/register` — all other uses
  are FORBIDDEN.
- Auth state MUST always be read from `useSupabaseUser()` — manual cookie storage is FORBIDDEN.
- Session cookies are managed automatically by the module — manual auth cookie setting is FORBIDDEN.

## Rendering Strategy

| Route | Strategy | Reason |
|---|---|---|
| `/auth/login`, `/auth/register` | SPA (`ssr: false`) | No SEO needed, fast static render |
| `/dashboard` | SSR | First meaningful paint with real data |
| `/employees` | SSR | List page benefits from server-rendered data |
| `/employees/[id]` | SSR | Data-heavy detail page |
| `/schedule` | SPA (`ssr: false`) | Custom calendar requires browser APIs |
| `/settings/**` | SPA (`ssr: false`) | Admin-only, no SEO |
| `/api/*` | Server (Nitro) | Always server — never rendered |

The `routeRules` approach in `nuxt.config.ts` MUST be used — per-file `definePageMeta({ ssr: false })`
is discouraged except for one-off overrides.

Key rules:
- Any page using the custom swimlane calendar MUST have `ssr: false`.
- `ssr: false` MUST NEVER be used on pages that need to be crawlable or shareable via URL.

## Governance

This constitution supersedes all other practices, conventions, and prior agreements for the
InterBeveiliging project. All architecture, code quality, and workflow decisions MUST be
consistent with the principles declared here.

**Amendment Procedure**:
1. Propose the change in writing, stating the rationale and the principle(s) affected.
2. Assess semantic version bump: PATCH for clarifications, MINOR for additions, MAJOR for
   removals or redefinitions.
3. Update this file, increment `CONSTITUTION_VERSION`, and set `LAST_AMENDED_DATE` to today.
4. Propagate changes to any affected templates (`plan-template.md`, `spec-template.md`,
   `tasks-template.md`) and update the Sync Impact Report comment at the top of this file.
5. Commit with: `docs: amend constitution to vX.Y.Z (<summary>)`.

**Compliance Review**:
- Every pull request MUST pass the Constitution Check gate in `plan.md` before merge.
- Any deviation from a principle marked FORBIDDEN is grounds for blocking the PR.
- Complexity exceptions require explicit justification in the plan's Complexity Tracking table.

**Version Policy**: Semantic versioning — MAJOR.MINOR.PATCH.
- MAJOR: Backward-incompatible governance/principle removals or redefinitions.
- MINOR: New principle or section added, or materially expanded guidance.
- PATCH: Clarifications, wording, typo fixes, non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
