-- =====================================================================
-- TubigLoop CDO: Complete PostgreSQL Schema for Supabase
-- Zero Email Dependencies: Direct, Instant Campus Auth (app_users)
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'reporter',      -- Campus Reporter (Student / Staff)
        'reviewer',      -- Maintenance Reviewer / Facilities Dispatcher
        'collector',     -- Authorized Campus Cleanup Personnel
        'recycler',      -- Partner Recycler / Scrap Buyer
        'admin'          -- System Administrator
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'Submitted',
        'Needs inspection',
        'Verified',
        'Rejected',
        'Duplicate'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM (
        'Planned',
        'Assigned',
        'In progress',
        'Collected',
        'Awaiting disposition',
        'Closed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE priority_band AS ENUM (
        'Low',           -- Score 0-1
        'Medium',        -- Score 2-3
        'High'           -- Score 4-5
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE material_category AS ENUM (
        'pet_bottles',
        'flexible_packaging',
        'residual_waste',
        'silt',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE measurement_basis AS ENUM (
        'scale_weighed',
        'unmeasured'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE handover_status AS ENUM (
        'pending',
        'confirmed',
        'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE dataset_origin AS ENUM (
        'pilot',
        'demo'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Core Tables

-- 3.1 Campus Sites
CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    latitude NUMERIC(10, 7) NOT NULL DEFAULT 8.4858,
    longitude NUMERIC(10, 7) NOT NULL DEFAULT 124.6565,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Initial CDO Pilot Site
INSERT INTO public.sites (name, code, description, latitude, longitude)
VALUES (
    'USTP Cagayan de Oro Campus',
    'USTP-CDO',
    'University of Science and Technology of Southern Philippines Main Campus Pilot',
    8.4858000,
    124.6565000
) ON CONFLICT (code) DO NOTHING;

-- 3.2 Direct App Users (Instant Auth without external email limits)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'reporter',
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 Drainage Obstruction Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL UNIQUE,
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    reporter_name TEXT,
    location_name TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    review_state report_status NOT NULL DEFAULT 'Submitted',
    reviewer_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    review_notes TEXT,
    duplicate_of_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    dataset_origin dataset_origin NOT NULL DEFAULT 'pilot',
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 Cleanup Tasks & Transparent Priority Scoring (0 to 5)
CREATE TABLE IF NOT EXISTS public.cleanup_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE UNIQUE,
    assignee_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    state task_status NOT NULL DEFAULT 'Assigned',
    priority_score SMALLINT NOT NULL CHECK (priority_score >= 0 AND priority_score <= 5) DEFAULT 2,
    priority_band priority_band NOT NULL DEFAULT 'Medium',
    obstruction_score SMALLINT NOT NULL CHECK (obstruction_score >= 0 AND obstruction_score <= 2) DEFAULT 1,
    disruption_score SMALLINT NOT NULL CHECK (disruption_score >= 0 AND disruption_score <= 2) DEFAULT 1,
    time_awaiting_score SMALLINT NOT NULL CHECK (time_awaiting_score >= 0 AND time_awaiting_score <= 1) DEFAULT 0,
    priority_reason TEXT,
    target_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- 3.5 Collection Batches (Measured Mass & Evidence)
CREATE TABLE IF NOT EXISTS public.collection_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.cleanup_tasks(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    material_category material_category NOT NULL,
    measured_kg NUMERIC(10, 2) NOT NULL CHECK (measured_kg >= 0),
    measurement_basis measurement_basis NOT NULL DEFAULT 'scale_weighed',
    before_photo_url TEXT,
    after_photo_url TEXT,
    dataset_origin dataset_origin NOT NULL DEFAULT 'pilot',
    collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6 Recipient Handovers (Chain-of-Custody & Mass Reconciliation)
CREATE TABLE IF NOT EXISTS public.handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.collection_batches(id) ON DELETE CASCADE,
    recipient_org TEXT NOT NULL,
    submitted_kg NUMERIC(10, 2) NOT NULL CHECK (submitted_kg >= 0),
    accepted_kg NUMERIC(10, 2) NOT NULL CHECK (accepted_kg >= 0),
    confirmation_state handover_status NOT NULL DEFAULT 'pending',
    evidence_url TEXT,
    notes TEXT,
    confirmed_by_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT handover_not_exceed_submitted CHECK (accepted_kg <= submitted_kg)
);

-- 3.7 AI Vision Analyses (Gemini 2.5 Flash Cache & Audit)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    suggested_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_score NUMERIC(4, 3),
    is_unclear BOOLEAN NOT NULL DEFAULT false,
    reviewer_corrected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.8 Immutable Audit Events
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Auto Sequence for Reference Numbers (TL-YYYY-0001)
CREATE SEQUENCE IF NOT EXISTS report_ref_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_report_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference_no IS NULL OR NEW.reference_no = '' THEN
        NEW.reference_no := 'TL-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('report_ref_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_report_ref ON public.reports;
CREATE TRIGGER trg_generate_report_ref
    BEFORE INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION generate_report_ref();

-- 5. Row Level Security Policies
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- App Users Policies
DROP POLICY IF EXISTS "Allow select on app_users" ON public.app_users;
CREATE POLICY "Allow select on app_users" ON public.app_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on app_users" ON public.app_users;
CREATE POLICY "Allow insert on app_users" ON public.app_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on app_users" ON public.app_users;
CREATE POLICY "Allow update on app_users" ON public.app_users FOR UPDATE USING (true);

-- Sites Policies
DROP POLICY IF EXISTS "Sites are readable by all" ON public.sites;
CREATE POLICY "Sites are readable by all" ON public.sites FOR SELECT USING (true);

-- Reports Policies
DROP POLICY IF EXISTS "Reports readable by all" ON public.reports;
CREATE POLICY "Reports readable by all" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
CREATE POLICY "Anyone can insert reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update reports" ON public.reports;
CREATE POLICY "Anyone can update reports" ON public.reports FOR UPDATE USING (true);

-- Tasks Policies
DROP POLICY IF EXISTS "Tasks readable by all" ON public.cleanup_tasks;
CREATE POLICY "Tasks readable by all" ON public.cleanup_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage tasks" ON public.cleanup_tasks;
CREATE POLICY "Anyone can manage tasks" ON public.cleanup_tasks FOR ALL USING (true);

-- Batches Policies
DROP POLICY IF EXISTS "Batches readable by all" ON public.collection_batches;
CREATE POLICY "Batches readable by all" ON public.collection_batches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert batches" ON public.collection_batches;
CREATE POLICY "Anyone can insert batches" ON public.collection_batches FOR INSERT WITH CHECK (true);

-- Handovers Policies
DROP POLICY IF EXISTS "Handovers readable by all" ON public.handovers;
CREATE POLICY "Handovers readable by all" ON public.handovers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can log handovers" ON public.handovers;
CREATE POLICY "Anyone can log handovers" ON public.handovers FOR ALL USING (true);

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-photos', 'evidence-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Report Photos" ON storage.objects;
CREATE POLICY "Public Read Report Photos" ON storage.objects FOR SELECT USING (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "Public Upload Report Photos" ON storage.objects;
CREATE POLICY "Public Upload Report Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-photos');

DROP POLICY IF EXISTS "Public Upload Evidence Photos" ON storage.objects;
CREATE POLICY "Public Upload Evidence Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence-photos');
