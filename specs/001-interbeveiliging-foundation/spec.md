# Feature Specification: InterBeveiliging v2 — Project Foundation

**Feature Branch**: `feat/001-interbeveiliging-foundation`
**Created**: 2026-04-21
**Status**: Active
**Input**: Full-stack SaaS for Dutch private security organisations to manage guards, shifts, and CAO compliance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authentication & Onboarding (Priority: P1)

An organisation admin registers an account, is authenticated, and lands on their dashboard with org branding. A guard logs in and sees only their own schedule.

**Why this priority**: Without auth and RBAC no other feature can work. The multi-tenant boundary is established here.

**Independent Test**: Run the app locally, register an org, verify the dashboard loads with org name in the topbar. Log in as an employee and verify `/settings` redirects to `/dashboard`.

**Acceptance Scenarios**:

1. **Given** an unregistered org, **When** the admin fills in the register form (name, KvK, email, password), **Then** the org is created, auth.users entry seeded, profile created, and the admin lands on `/dashboard`.
2. **Given** a registered employee, **When** they try to navigate to `/settings`, **Then** `roleGuard.ts` redirects them to `/dashboard` (client-side) and the API returns 403 (server-side).
3. **Given** an invalid KvK (≠ 8 digits), **When** the admin submits registration, **Then** validation rejects with Dutch error message.

---

### User Story 2 — Employee Management (Priority: P2)

Admin/planner manages the guard roster: adds, edits, soft-deletes employees, assigns role types (beveiliger, receptionist, etc.), and sets daily availability.

**Why this priority**: Employees must exist before shifts can be created.

**Independent Test**: Add an employee, assign a role type grant, set availability to max 6h on Wednesday, verify the profile appears in the employee list with the correct badge.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they create a new employee, **Then** a profile with `role = 'employee'` is created and appears in the employee list.
2. **Given** a soft-deleted employee, **When** the list is fetched, **Then** profiles with `deleted_at IS NOT NULL` are excluded.
3. **Given** an employee with availability of 0h on Sunday, **When** auto-plan runs, **Then** no shifts are proposed on Sunday for that guard.

---

### User Story 3 — Schedule Management & CAO Validation (Priority: P3)

Planner builds the weekly schedule via the swimlane grid: drags guards, creates shifts, sees real-time CAO warnings, and publishes the week. Guards receive their personal schedule by email.

**Why this priority**: Core value proposition of the product.

**Independent Test**: Create a 13-hour shift for a guard — verify the amber CAO Art. 26 warning appears in ShiftModal. Publish the week and verify `week_published = true` on all shifts.

**Acceptance Scenarios**:

1. **Given** a planner, **When** they drop a guard card onto a day cell, **Then** a ShiftModal opens pre-filled with that guard and day.
2. **Given** a shift with duration > 720 minutes, **When** saved, **Then** `validateCaoConstraints` returns an `error` severity violation and the save is rejected.
3. **Given** a published week, **When** the scheduled email job runs, **Then** each `role=employee` profile receives their personal shift table and each `role=planner/admin` receives the full overview.

---

### User Story 4 — Auto-Plan (Priority: P4)

Planner triggers the AI auto-planner for a week. Claude generates draft shift suggestions respecting availability and CAO constraints. Planner reviews the ghost-state preview and commits or discards.

**Why this priority**: Differentiating feature but requires stories 1–3 complete first.

**Independent Test**: Trigger auto-plan for an empty week with 3 guards and availability data. Verify shifts appear as `.ghost` in the swimlane. Verify no suggestion violates a hard CAO constraint.

**Acceptance Scenarios**:

1. **Given** a planner, **When** they click "Auto-plan", **Then** a POST to `/api/auto-plan` is made server-side (Anthropic key never on client) and ghost shifts appear.
2. **Given** auto-plan output, **When** the planner clicks "Bevestigen", **Then** ghost shifts are persisted as `draft` and the preview is dismissed.
3. **Given** auto-plan output, **When** the planner clicks "Verwerpen", **Then** no shifts are saved.

---

### Edge Cases

- What happens when two planners edit the same week simultaneously? Last write wins; no optimistic lock — acceptable for v1.
- How does the system handle an organisation with 0 published shifts at email send time? No email is sent (guarded by `count(shifts) > 0 AND week_published = true`).
- What if Resend API returns a transient error? Log the error server-side; email is skipped for that recipient in that run. No retry queue in v1.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate users via Supabase email+password (no magic link).
- **FR-002**: System MUST enforce RBAC at both middleware and server route levels.
- **FR-003**: System MUST validate KvK numbers as exactly 8 digits on registration.
- **FR-004**: System MUST soft-delete employees (`deleted_at`) — hard-delete when shifts exist is FORBIDDEN.
- **FR-005**: System MUST call `validateCaoConstraints` on every shift save; violations with `severity='error'` block persistence.
- **FR-006**: System MUST render the schedule as a custom HTML table swimlane — no external calendar library.
- **FR-007**: System MUST send weekly emails via Resend server-side only; API key MUST NOT appear in `runtimeConfig.public`.
- **FR-008**: System MUST scope every shift query to `organisation_id` AND a date range.
- **FR-009**: Auto-plan MUST route through the server (Nitro) — Anthropic API key never exposed to client.
- **FR-010**: Auto-plan suggestions MUST be previewed as ghost shifts and require explicit planner confirmation before persisting.

### Key Entities

- **Organisation**: Multi-tenant root — one organisation per deployment context; RLS enforces isolation.
- **Profile**: Extends `auth.users`; role enum (`admin`, `planner`, `employee`); soft-deletable.
- **RoleType**: Organisation-specific guard role names (beveiliger, receptionist, etc.).
- **Grant**: Links a Profile to a RoleType with optional date range; drives badge rendering.
- **Shift**: The schedulable unit — date, start/end time, guard, location, published flag.
- **EmployeeAvailability**: Per-guard, per-weekday max hours constraint for auto-plan.
- **OrganisationSettings**: Email send time/day config per org.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin can complete registration and reach the dashboard in under 90 seconds.
- **SC-002**: Planner can create and publish a full week's schedule for 10 guards in under 5 minutes.
- **SC-003**: CAO violation warnings appear within 200ms of changing start/end time in ShiftModal.
- **SC-004**: Weekly emails for 50 employees send within 30 seconds of the scheduled cron trigger.
- **SC-005**: Schedule page renders the swimlane grid for 50 guards × 7 days with no jank (60fps).

## Assumptions

- Organisations are onboarded manually (self-service registration); no super-admin portal in v1.
- Mobile support is out of scope for v1; desktop-first at ≥1024px viewport.
- Offline support is out of scope; stable internet connectivity assumed.
- A single Supabase project is shared across all organisations; RLS provides tenant isolation.
- The design reference files (`ib-styles.css`, `ib-views-*.js`, `ib-components.js`) are present in the project root during development.
