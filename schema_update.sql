-- Update Script for Avrina LeadScout Expansion
-- Run this in your Supabase SQL Editor

-- 1. Update app_config table
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS ai_api_key text,
ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'google',
ADD COLUMN IF NOT EXISTS db_url text;

-- 2. Update leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS url text,
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS niche text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'To Do',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS pain_points text,
ADD COLUMN IF NOT EXISTS value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS analysis jsonb,
ADD COLUMN IF NOT EXISTS outreach jsonb;

-- 3. Update profiles table for productivity targets
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_target integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS weekly_target integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS monthly_target integer DEFAULT 100;

-- 4. Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  image_url text,
  author_id uuid REFERENCES auth.users ON DELETE SET NULL,
  status text DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published blogs" ON public.blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage blogs" ON public.blogs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Create visitor_stats table
CREATE TABLE IF NOT EXISTS public.visitor_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path text,
  user_agent text,
  referrer text,
  ip_address text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert stats" ON public.visitor_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view stats" ON public.visitor_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
