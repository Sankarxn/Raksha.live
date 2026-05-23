-- Supabase Database Schema Migration
-- RAKSHA: Kerala Flood & Landslide Reporting Platform

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Core crowd-sourced reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- flood | landslide | roadblock | rescue | missing
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | critical
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  photo_url TEXT,
  description TEXT,
  ai_verified BOOLEAN DEFAULT false,
  ai_confidence DOUBLE PRECISION DEFAULT 0.0,
  ai_score DOUBLE PRECISION DEFAULT 0.0,
  anonymous_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clustered Incidents (AI-merged and validated reports)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- flood | landslide | roadblock | rescue
  severity TEXT NOT NULL, -- low | medium | critical
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  report_count INT DEFAULT 1,
  confirmed BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  first_reported_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- 3. Alert subscriptions for push & SMS broadcasts
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT NOT NULL,
  phone TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_phone_district UNIQUE (phone, district)
);

-- 4. Alerts transmission logs
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  channel TEXT NOT NULL, -- fcm | sms | webhook
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast geo-queries and lookup performance
CREATE INDEX IF NOT EXISTS idx_reports_geom ON reports (lat, lng);
CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents (lat, lng);
CREATE INDEX IF NOT EXISTS idx_incidents_active ON incidents (active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_district ON subscriptions (district);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create simple public write policies (allows anonymous client submissions)
CREATE POLICY "Allow public select reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert reports" ON reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Allow public insert incidents" ON incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update incidents" ON incidents FOR UPDATE USING (true);

CREATE POLICY "Allow public select subscriptions" ON subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert alerts" ON alerts FOR INSERT WITH CHECK (true);
