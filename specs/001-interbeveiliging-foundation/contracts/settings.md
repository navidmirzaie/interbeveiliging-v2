# API Contract: Settings & Role Types

---

## Settings

**Base**: `/api/settings`
**Auth**: Required. `role = 'employee'` → 403 (enforced server-side AND via `roleGuard.ts` middleware).

### GET /api/settings

Returns the organisation settings and the organisation profile.

**Response `200`**:
```json
{
  "organisation": {
    "id": "uuid",
    "name": "string",
    "kvkNumber": "string",
    "primaryColour": "string",
    "logoUrl": "string | null",
    "dashboardTitle": "string | null"
  },
  "emailSettings": {
    "emailSendTime": "08:00",
    "emailSendDay": 1
  }
}
```

### PATCH /api/settings

Updates organisation settings.

**Request** (any subset):
```json
{
  "organisationName": "string",
  "primaryColour": "#1E3A5F",
  "dashboardTitle": "string | null",
  "emailSendTime": "HH:MM",
  "emailSendDay": 1
}
```

**Response `200`**: `{ "ok": true }`.

---

## Role Types

**Base**: `/api/role-types`

### GET /api/role-types

Returns all role types for the organisation.

**Response `200`**:
```json
{
  "roleTypes": [
    { "id": "uuid", "name": "Beveiliger" },
    { "id": "uuid", "name": "Receptionist" }
  ]
}
```

### POST /api/role-types

Creates a new role type. Requires `role = 'admin'`.

**Request**: `{ "name": "string — required" }`.

**Response `201`**: `{ "id": "uuid", "name": "string" }`.

**Response `409`**: Name already exists for this org.

### DELETE /api/role-types/:id

Deletes a role type. Requires `role = 'admin'`. Blocked if active grants reference this role type.

**Response `200`**: `{ "ok": true }`.

**Response `409`**: `{ "ok": false, "error": "Roltype heeft actieve toewijzingen" }`.

---

## Grants

**Base**: `/api/grants`

### POST /api/grants

Assigns a role type to an employee. Requires `role = 'admin'`.

**Request**:
```json
{
  "profileId": "uuid",
  "roleTypeId": "uuid",
  "startsAt": "YYYY-MM-DD | null",
  "expiresAt": "YYYY-MM-DD | null"
}
```

**Response `201`**: Created grant object.

### DELETE /api/grants/:id

Removes a grant. Requires `role = 'admin'`.

**Response `200`**: `{ "ok": true }`.

---

## Email Trigger

**Base**: `/api/schedule`

### POST /api/schedule/send-emails

Triggered by the Netlify Scheduled Function hourly. Validates the `x-cron-secret` header, checks `organisation_settings.email_send_time` against current Amsterdam time, and sends weekly emails if matched.

**Headers**: `x-cron-secret: <CRON_SECRET>` — required.

**Logic**:
1. Load all organisations where `email_send_day` = today's ISO weekday.
2. For each org, check `email_send_time` matches current Amsterdam hour (±15 min window).
3. Find the latest week with at least one `week_published = true` shift.
4. Send `guardScheduleEmail` to each `role='employee'` profile.
5. Send `plannerOverviewEmail` to each `role IN ('admin', 'planner')` profile.
6. Skip if no published shifts exist for the week.

**Response `200`**: `{ "ok": true, "sent": 12 }`.

**Response `401`**: Missing or wrong `x-cron-secret`.
