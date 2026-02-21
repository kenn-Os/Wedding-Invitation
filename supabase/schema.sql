-- ================================================================
-- WEDDING INVITATION APP — SUPABASE DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New Query
-- ================================================================

-- 1. INVITEES
-- Each invited guest gets a unique token used to generate their personal invite link.
CREATE TABLE IF NOT EXISTS invitees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  token       UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. RSVPS
-- One RSVP per invitee (enforced by unique constraint on invitee_id).
CREATE TABLE IF NOT EXISTS rsvps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitee_id      UUID REFERENCES invitees(id) ON DELETE CASCADE,
  submitter_name  TEXT NOT NULL,
  attending       BOOLEAN NOT NULL,
  guest_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (invitee_id)
);

-- 3. ADDITIONAL GUESTS
-- Names of guests accompanying the primary invitee.
CREATE TABLE IF NOT EXISTS additional_guests (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rsvp_id   UUID REFERENCES rsvps(id) ON DELETE CASCADE,
  name      TEXT NOT NULL
);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- We use the service role key on the server to bypass RLS for
-- all admin operations. The anon key (used client-side) only
-- accesses what we expose through API routes.
-- ================================================================

ALTER TABLE invitees ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_guests ENABLE ROW LEVEL SECURITY;

-- Deny all access for anonymous/authenticated users.
-- All reads/writes go through server API routes using the service role.
-- This keeps data secure and prevents direct client-side database access.

-- Optional: If you want to use the anon key directly (not recommended),
-- you can create policies like:
-- CREATE POLICY "allow_insert_rsvp" ON rsvps FOR INSERT WITH CHECK (true);
-- But for this app, all access is via server-side API routes.

-- ================================================================
-- INDEXES for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_invitees_token ON invitees (token);
CREATE INDEX IF NOT EXISTS idx_rsvps_invitee_id ON rsvps (invitee_id);
CREATE INDEX IF NOT EXISTS idx_additional_guests_rsvp_id ON additional_guests (rsvp_id);
