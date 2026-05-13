CREATE INDEX IF NOT EXISTS "shifts_org_date_idx" ON "shifts" ("organisation_id", "date");
CREATE INDEX IF NOT EXISTS "employee_availability_profile_idx" ON "employee_availability" ("profile_id");
CREATE INDEX IF NOT EXISTS "role_types_org_idx" ON "role_types" ("organisation_id");
