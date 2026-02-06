-- Row-Level Security policies for App Sommeil
-- Execute this in Supabase SQL Editor after creating the tables

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/modify their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (id = auth.uid());

-- Enable RLS on work_shifts
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

-- Work shifts: users can only see/modify their own shifts
CREATE POLICY "Users can view own shifts" ON work_shifts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own shifts" ON work_shifts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own shifts" ON work_shifts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own shifts" ON work_shifts
  FOR DELETE USING (user_id = auth.uid());

-- Enable RLS on transition_plans
ALTER TABLE transition_plans ENABLE ROW LEVEL SECURITY;

-- Transition plans: users can only see/modify their own plans
CREATE POLICY "Users can view own plans" ON transition_plans
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plans" ON transition_plans
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plans" ON transition_plans
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own plans" ON transition_plans
  FOR DELETE USING (user_id = auth.uid());

-- Enable RLS on plan_days
ALTER TABLE plan_days ENABLE ROW LEVEL SECURITY;

-- Plan days: users can only see/modify days of their own plans (via join)
CREATE POLICY "Users can view own plan days" ON plan_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transition_plans
      WHERE transition_plans.id = plan_days.plan_id
      AND transition_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own plan days" ON plan_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transition_plans
      WHERE transition_plans.id = plan_days.plan_id
      AND transition_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan days" ON plan_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM transition_plans
      WHERE transition_plans.id = plan_days.plan_id
      AND transition_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan days" ON plan_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM transition_plans
      WHERE transition_plans.id = plan_days.plan_id
      AND transition_plans.user_id = auth.uid()
    )
  );
