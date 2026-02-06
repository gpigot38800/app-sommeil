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
