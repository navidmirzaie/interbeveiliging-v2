-- Enable RLS on all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Organisations: users see only their own org
CREATE POLICY "org_isolation" ON organisations
  FOR ALL USING (id = (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

-- Profiles: readable by all profiles in same org; only admin can write
CREATE POLICY "profile_org_read" ON profiles
  FOR SELECT USING (organisation_id = (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "profile_admin_write" ON profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "profile_admin_update" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'planner')
  );

-- Role types: all org members can read; admin can write
CREATE POLICY "role_types_read" ON role_types
  FOR SELECT USING (organisation_id = (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "role_types_admin_write" ON role_types
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Grants: all org members can read; only admin can write
CREATE POLICY "grants_read" ON grants
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE organisation_id = (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "grants_admin_write" ON grants
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Organisation settings: all org members can read; admin/planner can write
CREATE POLICY "settings_read" ON organisation_settings
  FOR SELECT USING (organisation_id = (
    SELECT organisation_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "settings_write" ON organisation_settings
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'planner')
  );

-- Employee availability: all org members can read; admin/planner or self can write
CREATE POLICY "availability_read" ON employee_availability
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE organisation_id = (
        SELECT organisation_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "availability_write" ON employee_availability
  FOR ALL USING (
    profile_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'planner')
  );

-- Shifts: admin/planner see all org shifts; employee sees only own published shifts
CREATE POLICY "shift_access" ON shifts
  FOR SELECT USING (
    (profile_id = auth.uid() AND week_published = true)
    OR (
      organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid())
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'planner')
    )
  );

CREATE POLICY "shift_planner_write" ON shifts
  FOR ALL USING (
    organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'planner')
  );
