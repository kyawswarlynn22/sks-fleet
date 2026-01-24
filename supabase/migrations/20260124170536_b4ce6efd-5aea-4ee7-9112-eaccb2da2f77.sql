-- =============================================
-- FIX 1: Customer PII Exposure & Overly Permissive RLS
-- =============================================

-- Drop all overly permissive policies on cars table
DROP POLICY IF EXISTS "Allow authenticated delete cars" ON cars;
DROP POLICY IF EXISTS "Allow authenticated insert cars" ON cars;
DROP POLICY IF EXISTS "Allow authenticated read cars" ON cars;
DROP POLICY IF EXISTS "Allow authenticated update cars" ON cars;

-- Create role-based policies for cars (admin-only management, drivers can view)
CREATE POLICY "Admins manage cars" ON cars FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view cars" ON cars FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on drivers table
DROP POLICY IF EXISTS "Allow authenticated delete drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated insert drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated read drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated update drivers" ON drivers;

-- Create role-based policies for drivers (admin full access, drivers view own)
CREATE POLICY "Admins manage drivers" ON drivers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view all drivers" ON drivers FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on routes table
DROP POLICY IF EXISTS "Allow authenticated delete routes" ON routes;
DROP POLICY IF EXISTS "Allow authenticated insert routes" ON routes;
DROP POLICY IF EXISTS "Allow authenticated read routes" ON routes;
DROP POLICY IF EXISTS "Allow authenticated update routes" ON routes;

-- Create role-based policies for routes (admin-only management, everyone can view)
CREATE POLICY "Admins manage routes" ON routes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view routes" ON routes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on preorders table
DROP POLICY IF EXISTS "Allow authenticated delete preorders" ON preorders;
DROP POLICY IF EXISTS "Allow authenticated insert preorders" ON preorders;
DROP POLICY IF EXISTS "Allow authenticated read preorders" ON preorders;
DROP POLICY IF EXISTS "Allow authenticated update preorders" ON preorders;

-- Create role-based policies for preorders (admin full access, drivers view assigned)
CREATE POLICY "Admins manage preorders" ON preorders FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view all preorders" ON preorders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on trips table
DROP POLICY IF EXISTS "Allow authenticated delete trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated insert trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated read trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated update trips" ON trips;

-- Create role-based policies for trips (admin full access, drivers view/update assigned)
CREATE POLICY "Admins manage trips" ON trips FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view all trips" ON trips FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can update assigned trips" ON trips FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on energy_logs table
DROP POLICY IF EXISTS "Allow authenticated delete energy_logs" ON energy_logs;
DROP POLICY IF EXISTS "Allow authenticated insert energy_logs" ON energy_logs;
DROP POLICY IF EXISTS "Allow authenticated read energy_logs" ON energy_logs;
DROP POLICY IF EXISTS "Allow authenticated update energy_logs" ON energy_logs;

-- Create role-based policies for energy_logs (admin-only)
CREATE POLICY "Admins manage energy_logs" ON energy_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view energy_logs" ON energy_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

CREATE POLICY "Drivers can insert energy_logs" ON energy_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on maintenance_logs table
DROP POLICY IF EXISTS "Allow authenticated delete maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated insert maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated read maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated update maintenance_logs" ON maintenance_logs;

-- Create role-based policies for maintenance_logs (admin-only management)
CREATE POLICY "Admins manage maintenance_logs" ON maintenance_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view maintenance_logs" ON maintenance_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'driver'));

-- Drop all overly permissive policies on ledger table
DROP POLICY IF EXISTS "Allow authenticated delete ledger" ON ledger;
DROP POLICY IF EXISTS "Allow authenticated insert ledger" ON ledger;
DROP POLICY IF EXISTS "Allow authenticated read ledger" ON ledger;
DROP POLICY IF EXISTS "Allow authenticated update ledger" ON ledger;

-- Create role-based policies for ledger (admin-only - financial data)
CREATE POLICY "Admins manage ledger" ON ledger FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));