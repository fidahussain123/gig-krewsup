-- ============================================================
-- PAYMENTS SCHEMA - Run this in Supabase SQL Editor
-- ============================================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_id VARCHAR(200) UNIQUE NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SAVED EVENTS TABLE (replaces saved[] array on event row)
CREATE TABLE IF NOT EXISTS public.saved_events (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

-- 3. PAYMENT COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.payment_complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  complaint_reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK(status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payments_event_id     ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_organizer_id ON public.payments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_saved_events_user     ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_events_event    ON public.saved_events(event_id);
CREATE INDEX IF NOT EXISTS idx_complaints_event      ON public.payment_complaints(event_id);
CREATE INDEX IF NOT EXISTS idx_complaints_worker     ON public.payment_complaints(worker_id);

-- ============================================================
-- UPDATED_AT TRIGGER (reuse existing function if already exists)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_complaints_updated_at
  BEFORE UPDATE ON public.payment_complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS actual_end_time   TIMESTAMPTZ;

-- organizer_profiles table
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS account_number  TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS ifsc_code       TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS bank_name       TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS gst_number      TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS pan             TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS cin             TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS company_type    TEXT;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS average_rating  NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.organizer_profiles ADD COLUMN IF NOT EXISTS first_event     BOOLEAN DEFAULT FALSE;

-- worker_profiles table
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS upi_id         TEXT;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS average_rating  NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.worker_profiles ADD COLUMN IF NOT EXISTS dob             DATE;
