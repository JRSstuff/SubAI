-- =====================================================================
-- TubigLoop CDO: Complete PostgreSQL Schema for Supabase
-- Aligned with CEIW 2026 Campus Pilot Specifications (TUBIGLOOP_GRAND_PLAN.md)
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

-- 3.2 User Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
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
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reporter_name TEXT,
    location_name TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    description TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    review_state report_status NOT NULL DEFAULT 'Submitted',
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    confirmed_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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

-- 5. Safe Trigger: Auto-Provision Profile on auth.users Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    default_site UUID;
    user_assigned_role public.user_role;
    raw_role_text TEXT;
BEGIN
    -- Safely find default pilot site if exists
    SELECT id INTO default_site FROM public.sites LIMIT 1;

    -- Safely parse role text without crashing if missing or invalid
    raw_role_text := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'reporter'));
    
    IF raw_role_text IN ('reporter', 'reviewer', 'collector', 'recycler', 'admin') THEN
        user_assigned_role := raw_role_text::public.user_role;
    ELSE
        user_assigned_role := 'reporter'::public.user_role;
    END IF;

    -- Insert profile safely
    INSERT INTO public.profiles (id, full_name, role, site_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        user_assigned_role,
        default_site
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent transaction rollback on auth.users if profiles has an issue
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleanup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sites are readable by all authenticated users"
    ON public.sites FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles are readable by authenticated users"
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Profiles can be inserted by auth trigger"
    ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Reports readable by authenticated"
    ON public.reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Reporters can insert reports"
    ON public.reports FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL);

CREATE POLICY "Reviewers and admins can update reports"
    ON public.reports FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin')));

CREATE POLICY "Tasks readable by authenticated"
    ON public.cleanup_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Reviewers and admins can manage tasks"
    ON public.cleanup_tasks FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin')));

CREATE POLICY "Collectors can update assigned task progress"
    ON public.cleanup_tasks FOR UPDATE TO authenticated USING (assignee_id = auth.uid());

CREATE POLICY "Batches readable by authenticated"
    ON public.collection_batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Collectors can insert collection batches"
    ON public.collection_batches FOR INSERT TO authenticated WITH CHECK (collector_id = auth.uid());

CREATE POLICY "Handovers readable by authenticated"
    ON public.handovers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Collectors and recyclers can log handovers"
    ON public.handovers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Reviewers and admins can confirm handovers"
    ON public.handovers FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin')));

-- 7. Storage Bucket Initialization
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-photos', 'evidence-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Access for Report Photos"
    ON storage.objects FOR SELECT USING (bucket_id = 'report-photos');

CREATE POLICY "Authenticated Users Can Upload Report Photos"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'report-photos');

CREATE POLICY "Authenticated Users Can Upload Evidence Photos"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence-photos');
