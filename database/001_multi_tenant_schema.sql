-- =====================================================
-- VOTR Platform - Multi-Tenant Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BANDS (Tenant Table)
-- Each band is a tenant with isolated data
-- =====================================================
CREATE TABLE public.bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- URL-friendly name: "tribe", "yuma", "bliss"
    logo_url TEXT,
    colors_json JSONB DEFAULT '{"primary": "#FFB800", "secondary": "#FF3366"}'::jsonb,
    tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'core', 'pro', 'enterprise')),
    voting_opens_at TIMESTAMPTZ,
    voting_closes_at TIMESTAMPTZ,
    max_masqueraders INTEGER DEFAULT 3000,
    contact_email TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. PLATFORM ADMINS (You - Super Admin)
-- Separate from band admins
-- =====================================================
CREATE TABLE public.platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 3. BAND ADMINS (Band owners / managers)
-- Links Supabase Auth users to their band
-- =====================================================
CREATE TABLE public.band_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, band_id)
);

-- =====================================================
-- 4. SECTIONS (Band sections - e.g. "Blue Devils", "Fantasy")
-- =====================================================
CREATE TABLE public.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. SONGS (Shared Road March song list)
-- Songs are global - all bands vote on the same songs
-- =====================================================
CREATE TABLE public.songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    year INTEGER NOT NULL DEFAULT 2027,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. QR CODES (One per masquerader, tied to band + section)
-- The QR code IS the identity - no accounts needed
-- =====================================================
CREATE TABLE public.qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    code_string TEXT NOT NULL UNIQUE, -- The scannable code (e.g., "VOTR-TRB-A1B2C3")
    masquerader_name TEXT,
    masquerader_email TEXT,
    voted BOOLEAN DEFAULT FALSE,
    voted_at TIMESTAMPTZ,
    scanned_at TIMESTAMPTZ, -- When QR was first scanned
    device_hash TEXT, -- Device fingerprint on vote
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. VOTES (One vote per QR code)
-- =====================================================
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE UNIQUE,
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    device_hash TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. ANOMALY FLAGS (Suspicious activity log)
-- =====================================================
CREATE TABLE public.anomaly_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    flag_type TEXT NOT NULL CHECK (flag_type IN (
        'multiple_devices', 'rapid_voting', 'ip_cluster', 'suspicious_pattern'
    )),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    related_qr_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
    related_vote_id UUID REFERENCES public.votes(id) ON DELETE SET NULL,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. ANALYTICS EVENTS (General engagement tracking)
-- =====================================================
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id UUID REFERENCES public.bands(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'qr_scan', 'vote_attempt', 'page_view', 'error', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_qr_codes_code ON public.qr_codes(code_string);
CREATE INDEX idx_qr_codes_band ON public.qr_codes(band_id);
CREATE INDEX idx_qr_codes_voted ON public.qr_codes(band_id, voted);
CREATE INDEX idx_votes_band ON public.votes(band_id);
CREATE INDEX idx_votes_song ON public.votes(song_id);
CREATE INDEX idx_votes_created ON public.votes(created_at);
CREATE INDEX idx_votes_section ON public.votes(band_id, section_id);
CREATE INDEX idx_anomaly_band ON public.anomaly_flags(band_id);
CREATE INDEX idx_analytics_band_type ON public.analytics_events(band_id, event_type);
CREATE INDEX idx_analytics_created ON public.analytics_events(created_at);
CREATE INDEX idx_sections_band ON public.sections(band_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ----- PLATFORM ADMINS -----
-- Platform admins can see everything
CREATE POLICY "platform_admins_self" ON public.platform_admins
    FOR SELECT USING (user_id = auth.uid());

-- ----- BANDS -----
-- Anyone can view active bands (for public-facing pages)
CREATE POLICY "bands_public_read" ON public.bands
    FOR SELECT USING (is_active = TRUE);

-- Band admins can update their own band
CREATE POLICY "bands_admin_update" ON public.bands
    FOR UPDATE USING (
        id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
    );

-- Platform admins can do everything with bands
CREATE POLICY "bands_platform_admin" ON public.bands
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- ----- BAND ADMINS -----
-- Band admins can see other admins in their band
CREATE POLICY "band_admins_read" ON public.band_admins
    FOR SELECT USING (
        band_id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- Platform admins can manage band admins
CREATE POLICY "band_admins_platform" ON public.band_admins
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- ----- SECTIONS -----
-- Band admins can manage their sections
CREATE POLICY "sections_band_admin" ON public.sections
    FOR ALL USING (
        band_id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- ----- SONGS -----
-- Everyone can read songs (needed for voting PWA)
CREATE POLICY "songs_public_read" ON public.songs
    FOR SELECT USING (is_active = TRUE);

-- Platform admins can manage songs
CREATE POLICY "songs_platform_admin" ON public.songs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- ----- QR CODES -----
-- Band admins can view/manage their QR codes
CREATE POLICY "qr_codes_band_admin" ON public.qr_codes
    FOR ALL USING (
        band_id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- Service role has full access (for edge functions / voting API)
CREATE POLICY "qr_codes_service" ON public.qr_codes
    FOR ALL USING (auth.role() = 'service_role');

-- ----- VOTES -----
-- Band admins can view votes for their band
CREATE POLICY "votes_band_admin_read" ON public.votes
    FOR SELECT USING (
        band_id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

-- Service role can insert votes (voting API)
CREATE POLICY "votes_service" ON public.votes
    FOR ALL USING (auth.role() = 'service_role');

-- ----- ANOMALY FLAGS -----
CREATE POLICY "anomaly_band_admin" ON public.anomaly_flags
    FOR ALL USING (
        band_id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "anomaly_service" ON public.anomaly_flags
    FOR ALL USING (auth.role() = 'service_role');

-- ----- ANALYTICS EVENTS -----
CREATE POLICY "analytics_band_admin" ON public.analytics_events
    FOR SELECT USING (
        band_id IN (SELECT band_id FROM public.band_admins WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
    );

CREATE POLICY "analytics_service" ON public.analytics_events
    FOR ALL USING (auth.role() = 'service_role');
