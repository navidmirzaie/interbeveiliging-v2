# Quickstart: InterBeveiliging v2

**Branch**: `feat/001-interbeveiliging-foundation` | **Date**: 2026-04-21

## Prerequisites

- Node.js 20 LTS
- npm ≥ 10
- Supabase project (free tier or higher)
- Resend account + API key
- Anthropic API key

## 1. Clone & Install

```bash
git clone <repo-url> interbeveiliging
cd interbeveiliging
npm install
```

## 2. Environment Setup

```bash
cp .env.example .env
```

Fill in `.env`:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
RESEND_FROM_ADDRESS=rooster@yourdomain.nl
CRON_SECRET=<random-32-char-string>
```

**Never commit `.env`** — it is in `.gitignore`.

## 3. Database Migrations

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migration to Supabase
npx drizzle-kit push
```

Verify in the Supabase SQL editor that the 7 tables exist: `organisations`, `profiles`, `role_types`, `grants`, `organisation_settings`, `employee_availability`, `shifts`.

## 4. Supabase RLS Setup

Run the RLS policy SQL in the Supabase SQL editor (see `drizzle/migrations/rls-policies.sql`). Verify each table has RLS enabled and at least one policy.

## 5. Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the login page.

## 6. First Registration

1. Navigate to `/auth/register`.
2. Fill in organisation name, KvK number (8 digits), admin email, and password.
3. Submit — you should land on `/dashboard` with the org name in the topbar.

## 7. Create Test Employees

1. Go to `/employees` → "Medewerker toevoegen".
2. Create at least 2 employees with `role = 'employee'`.
3. Assign a role type (e.g. "Beveiliger") to each employee.

## 8. Test the Schedule

1. Go to `/schedule`.
2. Drag an employee card from the GuardSidebar to a day cell.
3. Fill in start/end time in the ShiftModal.
4. Test CAO warning: enter a shift > 9 hours — verify the amber Art. 26 warning appears.
5. Save the shift — it should appear as `.draft` in the swimlane.

## 9. Publish & Email Test

1. In `/schedule`, click "Publiceren".
2. Trigger the email API manually: `curl -X POST http://localhost:3000/api/schedule/send-emails -H "x-cron-secret: $CRON_SECRET"`.
3. Check your Resend dashboard for sent emails.

## 10. Type Check

```bash
npm run typecheck
```

MUST pass with zero errors before any commit.

## 11. Deploy to Netlify

```bash
npm install --save-dev @netlify/functions
```

In Netlify UI:
- Set all environment variables from section 2.
- Connect the repository.
- Build command: `npm run build`.
- Publish directory: `.output/public`.

Verify the scheduled function `send-weekly-emails` appears in the Netlify Functions dashboard with a "Scheduled" badge.

## Validation Checklist

- [ ] `npm run typecheck` passes
- [ ] Login/logout flow works
- [ ] Employee CRUD works (create, list, soft-delete)
- [ ] Swimlane renders correctly for 7 days
- [ ] ShiftModal CAO warning triggers at > 540 minutes
- [ ] Shift save blocked when `severity = 'error'`
- [ ] Week publish sets `week_published = true`
- [ ] Email send API returns 200 for a published week
- [ ] Employee role cannot access `/settings`
- [ ] Auto-plan shows ghost shifts and requires confirmation
