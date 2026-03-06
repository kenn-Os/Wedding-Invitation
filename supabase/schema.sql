-- ================================================================
-- WEDDING INVITATION APP — SUPABASE DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New Query
-- ================================================================

-- 0. MIGRATION LOGIC (Safe renaming from 'invitee' to 'guest')
DO $$
BEGIN
    -- Rename 'invitees' table to 'guests' if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invitees') THEN
        ALTER TABLE invitees RENAME TO guests;
    END IF;

    -- Rename 'invitee_id' column in 'rsvps' to 'guest_id' if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'rsvps' AND column_name = 'invitee_id') THEN
        ALTER TABLE rsvps RENAME COLUMN invitee_id TO guest_id;
    END IF;

    -- Standardize index name if it exists
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rsvps_invitee_id') THEN
        ALTER INDEX idx_rsvps_invitee_id RENAME TO idx_rsvps_guest_id;
    END IF;
END $$;

-- 1. GUESTS
-- Each guest gets a unique token used to generate their personal invite link.
CREATE TABLE IF NOT EXISTS guests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  token       UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. RSVPS
-- One RSVP per guest (enforced by unique constraint on guest_id).
CREATE TABLE IF NOT EXISTS rsvps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        UUID REFERENCES guests(id) ON DELETE CASCADE,
  submitter_name  TEXT NOT NULL,
  attending       BOOLEAN NOT NULL,
  guest_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guest_id)
);

-- 3. ADDITIONAL GUESTS
-- Names of guests accompanying the primary guest.
CREATE TABLE IF NOT EXISTS additional_guests (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rsvp_id   UUID REFERENCES rsvps(id) ON DELETE CASCADE,
  name      TEXT NOT NULL
);

-- 4. SETTINGS
-- Storing application-wide settings like dashboard password.
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Initialize default password
INSERT INTO settings (key, value)
VALUES ('dashboard_password', 'mildymylove')
ON CONFLICT (key) DO NOTHING;

-- ================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- We use the service role key on the server to bypass RLS for
-- all admin operations. The anon key (used client-side) only
-- accesses what we expose through API routes.
-- ================================================================

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- INDEXES for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests (token);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps (guest_id);
CREATE INDEX IF NOT EXISTS idx_additional_guests_rsvp_id ON additional_guests (rsvp_id);
