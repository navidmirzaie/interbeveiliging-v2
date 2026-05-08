# API Contract: Shifts

**Base**: `/api/shifts`
**Auth**: All routes require authentication.

---

## GET /api/shifts?week=2025-W22

Returns all shifts for the organisation for the given ISO week. `week` is required.

**Response `200`**:
```json
{
  "shifts": [
    {
      "id": "uuid",
      "profileId": "uuid",
      "date": "2025-05-26",
      "startTime": "08:00",
      "endTime": "16:00",
      "locationLabel": "string | null",
      "weekPublished": false
    }
  ],
  "published": false
}
```

**Note**: Employee role returns only their own shifts where `weekPublished = true`.

---

## POST /api/shifts

Creates a new shift. Requires `role IN ('admin', 'planner')`.

**Request**:
```json
{
  "profileId": "uuid — required, must be role='employee'",
  "date": "YYYY-MM-DD — required",
  "startTime": "HH:MM — required",
  "endTime": "HH:MM — required",
  "locationLabel": "string | null"
}
```

**Server validation**:
1. Guard clause: `profileId` profile MUST have `role = 'employee'` — 400 if not.
2. `validateCaoConstraints` called with existing shifts for that guard + new shift.
3. If any violation has `severity = 'error'` → 422 with violations array.

**Response `201`**: Created shift object.

**Response `400`**: `{ "ok": false, "error": "Profiel moet role=employee hebben" }`.

**Response `422`** (CAO hard constraint violation):
```json
{
  "ok": false,
  "error": "CAO-overtreding",
  "violations": [
    {
      "rule": "Art. 26 — maximale dienstduur",
      "employeeId": "uuid",
      "message": "Jan de Vries: dienst overschrijdt 12 uur (13u gepland)",
      "severity": "error"
    }
  ]
}
```

---

## PATCH /api/shifts/:id

Updates an existing shift. Requires `role IN ('admin', 'planner')`.

**Request**: Partial shift fields (`startTime`, `endTime`, `locationLabel`, `date`).

**Response `200`**: Updated shift object.

**Response `422`**: CAO hard constraint violation (same shape as POST 422).

---

## DELETE /api/shifts/:id

Deletes a shift. Requires `role IN ('admin', 'planner')`.

**Response `200`**: `{ "ok": true }`.

---

## PATCH /api/shifts/publish

Publishes all draft shifts for the given week. Requires `role IN ('admin', 'planner')`.

**Request**:
```json
{ "week": "2025-W22" }
```

**Response `200`**: `{ "ok": true, "count": 42 }` — number of shifts published.

---

## POST /api/auto-plan

Triggers the Claude AI auto-plan for the given week. Server-side only — Anthropic key never exposed to client.

**Request**:
```json
{
  "week": "2025-W22",
  "constraints": {
    "hoursPerGuard": 40
  }
}
```

**Response `200`**:
```json
{
  "suggestions": [
    {
      "profileId": "uuid",
      "date": "2025-05-26",
      "startTime": "08:00",
      "endTime": "16:00",
      "locationLabel": null
    }
  ],
  "violations": []
}
```

Auto-plan suggestions are returned as a preview — NOT persisted until `POST /api/shifts` is called for each.

**Response `422`**: `{ "ok": false, "violations": [...] }` — Claude proposed shifts that violate hard CAO constraints; client shows which ones and prompts planner to adjust.
