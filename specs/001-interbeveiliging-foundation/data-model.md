# Data Model: InterBeveiliging v2 — Project Foundation

**Branch**: `feat/001-interbeveiliging-foundation` | **Date**: 2026-04-21

---

## Entity Map

```
auth.users (Supabase managed)
    ↑ 1:1
organisations ←── profiles ─── role_types
                      |              ↑
                   grants ──────────┘
                   shifts
                   employee_availability
                   organisation_settings ─── organisations
```

---

## Entities

### organisations

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | Organisation display name |
| `kvk_number` | `text` | UNIQUE, NOT NULL | Must be exactly 8 digits — validated at app layer |
| `primary_colour` | `text` | DEFAULT `'#1E3A5F'` | Tenant branding colour |
| `logo_url` | `text` | NULLABLE | Supabase Storage CDN URL |
| `dashboard_title` | `text` | NULLABLE | Custom topbar title override |
| `created_at` | `timestamp with time zone` | DEFAULT `now()` | |

**Validation rules**:
- `kvk_number` MUST match `/^\d{8}$/` — enforced in registration API route.
- `primary_colour` MUST be a valid CSS hex colour if provided.

---

### profiles

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | |
| `organisation_id` | `uuid` | FK → `organisations(id)` NOT NULL | |
| `first_name` | `text` | NOT NULL | |
| `last_name` | `text` | NOT NULL | |
| `email` | `text` | NOT NULL | Mirrors `auth.users.email` |
| `phone` | `text` | NULLABLE | |
| `employee_number` | `text` | NULLABLE | Internal org reference |
| `role` | `enum('admin', 'planner', 'employee')` | NOT NULL, DEFAULT `'employee'` | |
| `contract_hours_per_period` | `integer` | DEFAULT `144` | CAO Art. 10 — loonperiode norm |
| `deleted_at` | `timestamp with time zone` | NULLABLE | Soft-delete marker |
| `created_at` | `timestamp with time zone` | DEFAULT `now()` | |

**Validation rules**:
- `deleted_at IS NOT NULL` profiles MUST be excluded from all list queries.
- Profiles with `role IN ('admin', 'planner')` MUST NOT appear in shift creation employee dropdowns.
- Hard-deleting a profile that has associated shifts is FORBIDDEN.

**Indexes**:
- `(organisation_id)` — all list queries scope by org.
- `(organisation_id, deleted_at)` — soft-delete filter.
- `(organisation_id, role)` — RBAC filtering.

---

### role_types

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organisation_id` | `uuid` | FK → `organisations(id)` NOT NULL | |
| `name` | `text` | NOT NULL | e.g. "Beveiliger", "Receptionist" |

**Constraints**: `UNIQUE (organisation_id, name)` — no duplicate role names per org.

---

### grants

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `profile_id` | `uuid` | FK → `profiles(id)` NOT NULL | |
| `role_type_id` | `uuid` | FK → `role_types(id)` NOT NULL | |
| `starts_at` | `date` | NULLABLE | NULL = from the beginning of time |
| `expires_at` | `date` | NULLABLE | NULL = never expires |
| `created_at` | `timestamp with time zone` | DEFAULT `now()` | |

**Active grant check** (client-side computed): `starts_at <= today AND (expires_at IS NULL OR expires_at >= today)`.

**Indexes**: `(profile_id)`, `(role_type_id)`.

---

### organisation_settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `organisation_id` | `uuid` | PK, FK → `organisations(id)` | One row per org |
| `email_send_time` | `time` | DEFAULT `'08:00'` | HH:MM — Amsterdam TZ implied |
| `email_send_day` | `integer` | DEFAULT `1` | ISO weekday: 1 = Monday … 7 = Sunday |
| `updated_at` | `timestamp with time zone` | DEFAULT `now()` | |

---

### employee_availability

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `profile_id` | `uuid` | FK → `profiles(id)` NOT NULL | |
| `day_of_week` | `integer` | NOT NULL | 0 = Monday … 6 = Sunday |
| `max_hours` | `decimal(4,2)` | DEFAULT `8.00` | Max schedulable hours for that day |

**Constraints**: `UNIQUE (profile_id, day_of_week)` — one entry per guard per day.

**Validation**: `day_of_week` MUST be `0–6`. `max_hours` MUST be `0.00–24.00`.

---

### shifts

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organisation_id` | `uuid` | FK → `organisations(id)` NOT NULL | |
| `profile_id` | `uuid` | FK → `profiles(id)` NOT NULL | |
| `date` | `date` | NOT NULL | Stored UTC |
| `start_time` | `time` | NOT NULL | |
| `end_time` | `time` | NOT NULL | Overnight allowed (end_time < start_time) |
| `location_label` | `text` | NULLABLE | Free-text location |
| `week_published` | `boolean` | DEFAULT `false` | |
| `created_at` | `timestamp with time zone` | DEFAULT `now()` | |

**Validation rules**:
- Every query on `shifts` MUST include `organisation_id = $orgId AND date BETWEEN $from AND $to`.
- `profile_id` MUST reference a profile with `role = 'employee'` — enforced in the POST route.
- `validateCaoConstraints` MUST be called before every insert/update.

**Indexes**:
- `(organisation_id, date)` — primary query pattern.
- `(organisation_id, profile_id, date)` — guard schedule lookup.
- `(organisation_id, week_published, date)` — email send filter.
- `created_at` — time-based admin queries.

---

## Row-Level Security Policies

| Table | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `organisations` | Authenticated users whose `profile.organisation_id` matches | Admin only via service role (registration) |
| `profiles` | All profiles in same org (`organisation_id` match) | Admin only for write; employee can update own row |
| `role_types` | All org members | Admin only |
| `grants` | All org members | Admin only |
| `organisation_settings` | All org members | Admin/planner only |
| `employee_availability` | All org members | Admin/planner; employee can update own |
| `shifts` | Admin/planner: all org shifts; Employee: own `week_published = true` shifts only | Admin/planner: all; Employee: none |

---

## State Transitions

### Shift lifecycle

```
[created as draft]  →  week_published = true  →  [published]
       ↓                                                ↓
   [soft-delete via deleteShift]            [only planner can unpublish]
```

### Profile lifecycle

```
[active: deleted_at IS NULL]  →  soft-delete  →  [inactive: deleted_at IS NOT NULL]
                                                        ↓
                                              [NOT hard-deletable if shifts exist]
```

### Grant lifecycle

```
[active: starts_at <= today <= expires_at]
[pending: starts_at > today]
[expired: expires_at < today]
[open-ended: expires_at IS NULL → never expires]
```

---

## Drizzle Schema (TypeScript)

```typescript
// drizzle/schema.ts
import { pgTable, uuid, text, timestamp, date, time, boolean, integer, decimal, pgEnum, unique } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'planner', 'employee'])

export const organisations = pgTable('organisations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  name:            text('name').notNull(),
  kvkNumber:       text('kvk_number').unique().notNull(),
  primaryColour:   text('primary_colour').default('#1E3A5F'),
  logoUrl:         text('logo_url'),
  dashboardTitle:  text('dashboard_title'),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const profiles = pgTable('profiles', {
  id:                       uuid('id').primaryKey(),
  organisationId:           uuid('organisation_id').notNull().references(() => organisations.id),
  firstName:                text('first_name').notNull(),
  lastName:                 text('last_name').notNull(),
  email:                    text('email').notNull(),
  phone:                    text('phone'),
  employeeNumber:           text('employee_number'),
  role:                     roleEnum('role').notNull().default('employee'),
  contractHoursPerPeriod:   integer('contract_hours_per_period').default(144),
  deletedAt:                timestamp('deleted_at', { withTimezone: true }),
  createdAt:                timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const roleTypes = pgTable('role_types', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  name:           text('name').notNull(),
}, (t) => ({ uniq: unique().on(t.organisationId, t.name) }))

export const grants = pgTable('grants', {
  id:           uuid('id').primaryKey().defaultRandom(),
  profileId:    uuid('profile_id').notNull().references(() => profiles.id),
  roleTypeId:   uuid('role_type_id').notNull().references(() => roleTypes.id),
  startsAt:     date('starts_at'),
  expiresAt:    date('expires_at'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const organisationSettings = pgTable('organisation_settings', {
  organisationId: uuid('organisation_id').primaryKey().references(() => organisations.id),
  emailSendTime:  time('email_send_time').default('08:00'),
  emailSendDay:   integer('email_send_day').default(1),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const employeeAvailability = pgTable('employee_availability', {
  id:          uuid('id').primaryKey().defaultRandom(),
  profileId:   uuid('profile_id').notNull().references(() => profiles.id),
  dayOfWeek:   integer('day_of_week').notNull(),
  maxHours:    decimal('max_hours', { precision: 4, scale: 2 }).default('8.00'),
}, (t) => ({ uniq: unique().on(t.profileId, t.dayOfWeek) }))

export const shifts = pgTable('shifts', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id),
  profileId:      uuid('profile_id').notNull().references(() => profiles.id),
  date:           date('date').notNull(),
  startTime:      time('start_time').notNull(),
  endTime:        time('end_time').notNull(),
  locationLabel:  text('location_label'),
  weekPublished:  boolean('week_published').default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
})
```
