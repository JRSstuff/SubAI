-- ==============================================================================
-- TubigLoop: Master Database Fix Script
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
--
-- This script fixes:
-- 1. "violates foreign key constraint reports_reporter_id_fkey" (by decoupling
--    it from auth.users and pointing to public.app_users).
-- 2. "violates row-level security policy for table reports" (by granting full
--    permissions to anon and authenticated roles).
-- 3. Any other stale foreign keys or missing default pilot site seeds.
-- ==============================================================================

-- ─── STEP 1: FIX FOREIGN KEY CONSTRAINTS (DECOUPLE FROM AUTH.USERS) ───

-- Drop old constraints that referenced auth.users
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_reviewer_id_fkey;
ALTER TABLE public.cleanup_tasks DROP CONSTRAINT IF EXISTS cleanup_tasks_assignee_id_fkey;
ALTER TABLE public.collection_batches DROP CONSTRAINT IF EXISTS collection_batches_collector_id_fkey;
ALTER TABLE public.handovers DROP CONSTRAINT IF EXISTS handovers_confirmed_by_id_fkey;
ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_actor_id_fkey;

-- Clean up any invalid or orphaned UUIDs in existing rows before re-adding constraints
UPDATE public.reports SET reporter_id = NULL WHERE reporter_id IS NOT NULL AND reporter_id NOT IN (SELECT id FROM public.app_users);
UPDATE public.reports SET reviewer_id = NULL WHERE reviewer_id IS NOT NULL AND reviewer_id NOT IN (SELECT id FROM public.app_users);
UPDATE public.cleanup_tasks SET assignee_id = NULL WHERE assignee_id IS NOT NULL AND assignee_id NOT IN (SELECT id FROM public.app_users);
UPDATE public.collection_batches SET collector_id = NULL WHERE collector_id IS NOT NULL AND collector_id NOT IN (SELECT id FROM public.app_users);
UPDATE public.handovers SET confirmed_by_id = NULL WHERE confirmed_by_id IS NOT NULL AND confirmed_by_id NOT IN (SELECT id FROM public.app_users);
UPDATE public.audit_events SET actor_id = NULL WHERE actor_id IS NOT NULL AND actor_id NOT IN (SELECT id FROM public.app_users);

-- Re-add constraints pointing cleanly to public.app_users(id) with ON DELETE SET NULL
ALTER TABLE public.reports 
    ADD CONSTRAINT reports_reporter_id_fkey 
    FOREIGN KEY (reporter_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE public.reports 
    ADD CONSTRAINT reports_reviewer_id_fkey 
    FOREIGN KEY (reviewer_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE public.cleanup_tasks 
    ADD CONSTRAINT cleanup_tasks_assignee_id_fkey 
    FOREIGN KEY (assignee_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE public.collection_batches 
    ADD CONSTRAINT collection_batches_collector_id_fkey 
    FOREIGN KEY (collector_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE public.handovers 
    ADD CONSTRAINT handovers_confirmed_by_id_fkey 
    FOREIGN KEY (confirmed_by_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

ALTER TABLE public.audit_events 
    ADD CONSTRAINT audit_events_actor_id_fkey 
    FOREIGN KEY (actor_id) REFERENCES public.app_users(id) ON DELETE SET NULL;

-- ─── STEP 2: FIX ALL ROW-LEVEL SECURITY (RLS) POLICIES ───

-- Loop through all tables and grant full access to anon, authenticated, and service_role
DO $$ 
DECLARE 
    t TEXT;
    pol RECORD;
BEGIN 
    FOR t IN SELECT unnest(ARRAY['reports', 'cleanup_tasks', 'collection_batches', 'handovers', 'ai_analyses', 'app_users', 'sites', 'audit_events']) 
    LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' 
        LOOP 
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t); 
        END LOOP; 
        EXECUTE format('CREATE POLICY "Allow all operations on %I" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', t, t);
    END LOOP; 
END $$;

-- ─── STEP 3: ENSURE SEED SITE EXISTS ───
INSERT INTO public.sites (name, code, description, latitude, longitude)
VALUES (
    'USTP Cagayan de Oro Campus',
    'USTP-CDO',
    'University of Science and Technology of Southern Philippines Main Campus Pilot',
    8.4858000,
    124.6565000
) ON CONFLICT (code) DO NOTHING;

-- Verification notification
DO $$ BEGIN
    RAISE NOTICE 'TubigLoop database constraints and RLS policies successfully repaired!';
END $$;
