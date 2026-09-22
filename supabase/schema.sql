-- ==============================================================================
-- Bitfoot Hunt: Footprints - Supabase Database Schema
-- Run this script in the Supabase SQL Editor to initialize or update all tables,
-- views, Realtime publications, and Row Level Security (RLS).
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_username TEXT NOT NULL,
  x_avatar_url TEXT,
  zcash_address TEXT,
  is_guest BOOLEAN DEFAULT false,
  unlocked_sectors INTEGER[] DEFAULT '{1}'::INTEGER[],
  highest_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration checks for existing databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'unlocked_sectors'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN unlocked_sectors INTEGER[] DEFAULT '{1}'::INTEGER[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'highest_score'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN highest_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Indexes for fast profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_x_username ON public.profiles (x_username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON public.profiles (is_guest);

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
CREATE INDEX IF NOT EXISTS idx_chapter_scores_created_at ON public.chapter_scores (created_at DESC);

-- 4. Leaderboard View
-- Computes rank, aggregates each hunter's highest score per chapter, total cleared chapters, and best duration
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
  DENSE_RANK() OVER (ORDER BY ut.total_points DESC, ut.best_time_ms ASC) AS rank,
  p.id AS user_id,
  p.x_username,
  COALESCE(p.x_avatar_url, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || p.x_username) AS x_avatar_url,
  p.is_guest,
  COALESCE(ut.total_points, 0) AS total_points,
  COALESCE(ut.chapters_cleared, 0) AS chapters_cleared,
  COALESCE(ut.best_time_ms, 0) AS best_time_ms,
  COALESCE(p.unlocked_sectors, '{1}'::INTEGER[]) AS unlocked_sectors,
  p.created_at
FROM public.profiles p
INNER JOIN user_totals ut ON p.id = ut.user_id
ORDER BY total_points DESC, best_time_ms ASC;

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_scores ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read profiles
DROP POLICY IF EXISTS "Allow public read for profiles" ON public.profiles;
CREATE POLICY "Allow public read for profiles"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Profiles: WRITE HARDENING (SEC-3)
-- The previous policy was `FOR ALL USING (true) WITH CHECK (true)`, which let any
-- anonymous caller who held the public anon key rewrite or wipe every profile row.
-- Writes are now restricted to the row owner. Guest sessions and guest progress
-- updates are written by the service-role API routes (`/api/chapter/complete`,
-- `/api/profile`) which bypass RLS after server-side validation.
-- NOTE: there is intentionally NO delete policy - deletes stay denied by default.
DROP POLICY IF EXISTS "Allow upsert for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for own profile" ON public.profiles;

CREATE POLICY "Allow insert for own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update for own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Chapter Scores: Public can read scores for leaderboard and statistics
DROP POLICY IF EXISTS "Allow public read for chapter_scores" ON public.chapter_scores;
CREATE POLICY "Allow public read for chapter_scores"
  ON public.chapter_scores
  FOR SELECT
  USING (true);

-- Chapter Scores: STRICT ANTI-CHEAT
-- Client cannot directly INSERT scores. All scores pass through /api/chapter/complete
-- which uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS after server-side validation.

-- 6. Trigger to automatically sync Supabase Auth users to public.profiles upon X (Twitter) or Google OAuth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, x_username, x_avatar_url, is_guest, unlocked_sectors)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'Hunter_' || SUBSTRING(NEW.id::text FROM 1 FOR 6)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id::text
    ),
    false,
    '{1}'::INTEGER[]
  )
  ON CONFLICT (id) DO UPDATE
  SET
    x_username = EXCLUDED.x_username,
    x_avatar_url = EXCLUDED.x_avatar_url,
    is_guest = false,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable Realtime on chapter_scores and profiles for live leaderboard updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chapter_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chapter_scores;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Skip if supabase_realtime publication is not configured
END $$;
