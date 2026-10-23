-- ==============================================================================
-- TubigLoop: Fix Row-Level Security (RLS) on "reports" and Related Tables
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
--
-- Why did this error happen?
-- Because the database tables had RLS enabled with default "authenticated only"
-- policies (or no policies at all). Since the Next.js server actions communicate
-- with Supabase using the Anon Key without email confirmation barriers, Postgres
-- considers the role 'anon' and rejects the INSERT.
--
-- This script safely drops any restrictive policies and creates open policies for
-- both 'anon' and 'authenticated' roles.
-- ==============================================================================

-- 1. REPORTS TABLE (Fixes: "new row violates row-level security policy for table reports")
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reports' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reports', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "Allow select on reports"
ON public.reports FOR SELECT
TO anon, authenticated, service_role
USING (true);

CREATE POLICY "Allow insert on reports"
ON public.reports FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

CREATE POLICY "Allow update on reports"
ON public.reports FOR UPDATE
TO anon, authenticated, service_role
USING (true);

-- 2. CLEANUP TASKS TABLE
ALTER TABLE public.cleanup_tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'cleanup_tasks' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.cleanup_tasks', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "Allow all on cleanup_tasks"
ON public.cleanup_tasks FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 3. AI ANALYSES TABLE
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ai_analyses' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_analyses', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "Allow all on ai_analyses"
ON public.ai_analyses FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 4. COLLECTION BATCHES TABLE
ALTER TABLE public.collection_batches ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'collection_batches' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.collection_batches', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "Allow all on collection_batches"
ON public.collection_batches FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 5. HANDOVERS TABLE
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'handovers' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.handovers', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "Allow all on handovers"
ON public.handovers FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 6. APP USERS TABLE
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'app_users' AND schemaname = 'public' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.app_users', pol.policyname); 
    END LOOP; 
END $$;

CREATE POLICY "Allow all on app_users"
ON public.app_users FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- (Optional Alternative)
-- If you prefer to completely disable RLS for the campus pilot:
--
-- ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cleanup_tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.collection_batches DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.handovers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_analyses DISABLE ROW LEVEL SECURITY;
-- ==============================================================================
