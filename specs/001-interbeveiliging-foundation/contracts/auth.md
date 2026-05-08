# API Contract: Auth

**Base**: `/api/auth`

---

## POST /api/auth/register

Creates the initial admin user and organisation. Uses `serverSupabaseServiceRole` — the only permitted use of the service role key.

**Request**:
```json
{
  "organisationName": "string — required, min 2 chars",
  "kvkNumber": "string — required, exactly 8 digits",
  "email": "string — required, valid email",
  "password": "string — required, min 8 chars"
}
```

**Validation** (server-side):
- `kvkNumber` MUST match `/^\d{8}$/`.
- `email` MUST be unique in `auth.users`.
- `organisationName` MUST be non-empty after trim.

**Response `201`**:
```json
{
  "ok": true,
  "data": {
    "organisationId": "uuid",
    "profileId": "uuid"
  }
}
```

**Response `400`** (validation failure):
```json
{ "ok": false, "error": "KvK-nummer moet exact 8 cijfers bevatten" }
```

**Response `409`** (email already registered):
```json
{ "ok": false, "error": "E-mailadres is al in gebruik" }
```

---

## GET /api/auth/session

Returns the current authenticated user's profile and organisation. Called by `useAuthStore.fetchSession()` on app mount.

**Auth**: Required (cookie session).

**Response `200`**:
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "admin | planner | employee"
  },
  "organisation": {
    "id": "uuid",
    "name": "string",
    "primaryColour": "string",
    "logoUrl": "string | null",
    "dashboardTitle": "string | null"
  }
}
```

**Response `401`**: No session — client redirects to `/auth/login`.
