-- Barber Booking App - Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS blocked_times CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  buffer_minutes INT NOT NULL DEFAULT 5,
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_appointments_phone ON appointments(customer_phone);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_start ON appointments(start_at);
CREATE INDEX idx_appointments_date_status ON appointments(start_at, status);

-- Overlap prevention constraint
-- Prevents any two PENDING or CONFIRMED appointments from overlapping
ALTER TABLE appointments ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED'));

-- One active appointment per phone number (PENDING or CONFIRMED, future only)
-- Note: This needs to be checked in application code since partial unique indexes 
-- with NOW() don't work well. We'll use a function + trigger instead.

-- Function to check for duplicate active bookings
CREATE OR REPLACE FUNCTION check_duplicate_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('PENDING', 'CONFIRMED') THEN
    IF EXISTS (
      SELECT 1 FROM appointments 
      WHERE customer_phone = NEW.customer_phone 
      AND status IN ('PENDING', 'CONFIRMED')
      AND start_at > NOW()
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Customer already has an active booking';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for duplicate check
CREATE TRIGGER check_duplicate_before_insert
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_booking();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Blocked times table (for holidays, breaks, etc.)
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocked_times_range ON blocked_times(start_at, end_at);

-- Row Level Security (RLS) policies
-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;

-- Public can read non-sensitive appointment data (for slot availability)
-- But we'll use service role key which bypasses RLS
-- These policies are for extra security if needed

CREATE POLICY "Service role has full access to appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to blocked_times" ON blocked_times
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON appointments TO service_role;
GRANT ALL ON blocked_times TO service_role;

-- Sample data for testing (optional, comment out for production)
-- INSERT INTO appointments (start_at, end_at, duration_minutes, buffer_minutes, services, customer_name, customer_phone, status)
-- VALUES 
--   (NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '10 hours 50 minutes', 45, 5, '["haircut"]', 'Max Mustermann', '+4917612345678', 'CONFIRMED');
