# API Contract: Employees

**Base**: `/api/employees`
**Auth**: All routes require authentication. Write routes require `role IN ('admin', 'planner')`.

---

## GET /api/employees

Returns all non-deleted profiles for the authenticated user's organisation.

**Response `200`**:
```json
{
  "employees": [
    {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string | null",
      "employeeNumber": "string | null",
      "role": "admin | planner | employee",
      "contractHoursPerPeriod": 144,
      "grants": [
        {
          "id": "uuid",
          "roleTypeName": "string",
          "startsAt": "date | null",
          "expiresAt": "date | null"
        }
      ]
    }
  ]
}
```

---

## POST /api/employees

Creates a new employee profile. Requires `role IN ('admin', 'planner')` — enforced server-side.

**Request**:
```json
{
  "firstName": "string — required",
  "lastName": "string — required",
  "email": "string — required, valid email",
  "phone": "string | null",
  "employeeNumber": "string | null",
  "role": "employee | planner | admin — default: employee",
  "contractHoursPerPeriod": "integer — default: 144"
}
```

**Response `201`**: Created employee object (same shape as list item).

**Response `403`**: Caller is `role = 'employee'`.

---

## GET /api/employees/:id

Returns a single employee including their availability settings.

**Response `200`**:
```json
{
  "employee": { "...same as list item..." },
  "availability": [
    { "dayOfWeek": 0, "maxHours": 8.0 },
    { "dayOfWeek": 1, "maxHours": 8.0 },
    "...",
    { "dayOfWeek": 6, "maxHours": 0.0 }
  ]
}
```

---

## PATCH /api/employees/:id

Updates an employee's profile fields.

**Request**: Partial profile fields (any subset of POST body).

**Response `200`**: Updated employee object.

**Response `403`**: Caller is `role = 'employee'` and is not the target profile.

---

## DELETE /api/employees/:id

Soft-deletes an employee by setting `deleted_at = now()`. Hard-delete is FORBIDDEN if shifts exist.

**Response `200`**: `{ "ok": true }`.

**Response `409`**: Employee has shifts — cannot delete (hard delete not allowed per constitution).

---

## PUT /api/employees/:id/availability

Upserts the 7-day availability for an employee.

**Request**:
```json
{
  "availability": [
    { "dayOfWeek": 0, "maxHours": 8.0 },
    { "dayOfWeek": 1, "maxHours": 8.0 },
    { "dayOfWeek": 2, "maxHours": 6.0 },
    { "dayOfWeek": 3, "maxHours": 8.0 },
    { "dayOfWeek": 4, "maxHours": 8.0 },
    { "dayOfWeek": 5, "maxHours": 0.0 },
    { "dayOfWeek": 6, "maxHours": 0.0 }
  ]
}
```

**Validation**: Array MUST have exactly 7 entries with `dayOfWeek 0–6` and `maxHours 0.00–24.00`.

**Response `200`**: `{ "ok": true }`.
