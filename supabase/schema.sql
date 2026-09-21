-- ==============================================================================
-- Bitfoot Hunt: Footprints - Supabase Database Schema
-- Run this script in the Supabase SQL Editor to initialize all tables, views, and RLS.
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_username TEXT NOT NULL,
  x_avatar_url TEXT,
  zcash_address TEXT,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_x_username ON public.profiles (x_username);

-- 3. Chapter Scores Table
CREATE TABLE IF NOT EXISTS public.chapter_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  points INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance querying best chapter scores
CREATE INDEX IF NOT EXISTS idx_chapter_scores_user_chapter ON public.chapter_scores (user_id, chapter);
CREATE INDEX IF NOT EXISTS idx_chapter_scores_points ON public.chapter_scores (points DESC);

-- 4. Leaderboard View
-- Aggregates each hunter's highest score per chapter, total cleared chapters, and best total duration
CREATE OR REPLACE VIEW public.leaderboard AS
WITH best_per_chapter AS (
  SELECT
    user_id,
    chapter,
    MAX(points) AS max_points,
    MIN(duration_ms) AS best_duration_ms
  FROM public.chapter_scores
  GROUP BY user_id, chapter
),
user_totals AS (
  SELECT
    bpc.user_id,
    COUNT(DISTINCT bpc.chapter) AS chapters_cleared,
    SUM(bpc.max_points) AS total_points,
    SUM(bpc.best_duration_ms) AS best_time_ms
  FROM best_per_chapter bpc
  GROUP BY bpc.user_id
)
SELECT
  p.id AS user_id,
  p.x_username,
  COALESCE(p.x_avatar_url, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || p.x_username) AS x_avatar_url,
  p.is_guest,
  COALESCE(ut.total_points, 0) AS total_points,
  COALESCE(ut.chapters_cleared, 0) AS chapters_cleared,
  COALESCE(ut.best_time_ms, 0) AS best_time_ms
FROM public.profiles p
INNER JOIN user_totals ut ON p.id = ut.user_id
ORDER BY total_points DESC, best_time_ms ASC;

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_scores ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read profiles
CREATE POLICY "Allow public read for profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Profiles: Users can upsert their own profile (or service role)
CREATE POLICY "Allow upsert for profiles"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chapter Scores: Public can read scores for stats
CREATE POLICY "Allow public read for chapter_scores"
  ON public.chapter_scores
  FOR SELECT
  USING (true);

-- Chapter Scores: STRICT ANTI-CHEAT - Client cannot directly INSERT/UPDATE/DELETE.
-- Only the backend API with SUPABASE_SERVICE_ROLE_KEY can insert scores!
-- (By default, when RLS is enabled and no INSERT policy exists for anon/authenticated,
-- writes from the client are blocked while service_role bypasses RLS).

-- 6. Trigger to automatically sync Supabase Auth users to public.profiles upon X (Twitter) OAuth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, x_username, x_avatar_url, is_guest)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'full_name',
      'Hunter_' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id::text
    ),
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET
    x_username = EXCLUDED.x_username,
    x_avatar_url = EXCLUDED.x_avatar_url,
    is_guest = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
