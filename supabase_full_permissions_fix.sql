-- Ensure the 'user_settings' table exists
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT user_settings_pkey PRIMARY KEY (user_id)
);

-- Enable Row Level Security (RLS) for 'user_settings'
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for 'user_settings' if they exist, then recreate them
DROP POLICY IF EXISTS "Authenticated users can read their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Authenticated users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Authenticated users can update their own settings" ON public.user_settings;

CREATE POLICY "Authenticated users can read their own settings" ON public.user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own settings" ON public.user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own settings" ON public.user_settings
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grant all privileges on 'user_settings' to anon and authenticated roles
GRANT ALL ON public.user_settings TO anon, authenticated;


-- Ensure the 'user_api_keys' table exists
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    api_keys jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT user_api_keys_pkey PRIMARY KEY (user_id)
);

-- Enable Row Level Security (RLS) for 'user_api_keys'
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for 'user_api_keys' if they exist, then recreate them
DROP POLICY IF EXISTS "Authenticated users can read their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Authenticated users can insert their own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Authenticated users can update their own API keys" ON public.user_api_keys;

CREATE POLICY "Authenticated users can read their own API keys" ON public.user_api_keys
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own API keys" ON public.user_api_keys
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own API keys" ON public.user_api_keys
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grant all privileges on 'user_api_keys' to anon and authenticated roles
GRANT ALL ON public.user_api_keys TO anon, authenticated;


-- Ensure the 'user_scans' table exists
CREATE TABLE IF NOT EXISTS public.user_scans (
    scan_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target text NOT NULL,
    timestamp bigint NOT NULL,
    status text NOT NULL,
    progress jsonb,
    config jsonb NOT NULL,
    results jsonb DEFAULT '{}'::jsonb NOT NULL,
    errors text[] DEFAULT '{}'::text[] NOT NULL,
    elapsed_ms bigint,
    completed_at bigint,
    security_grade numeric(3,1),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) for 'user_scans'
ALTER TABLE public.user_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for 'user_scans' if they exist, then recreate them
DROP POLICY IF EXISTS "Authenticated users can read their own scans" ON public.user_scans;
DROP POLICY IF EXISTS "Authenticated users can insert their own scans" ON public.user_scans;
DROP POLICY IF EXISTS "Authenticated users can update their own scans" ON public.user_scans;
DROP POLICY IF EXISTS "Authenticated users can delete their own scans" ON public.user_scans;

CREATE POLICY "Authenticated users can read their own scans" ON public.user_scans
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own scans" ON public.user_scans
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own scans" ON public.user_scans
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own scans" ON public.user_scans
FOR DELETE USING (auth.uid() = user_id);

-- Grant all privileges on 'user_scans' to anon and authenticated roles
GRANT ALL ON public.user_scans TO anon, authenticated;


-- Ensure usage on the public schema is granted to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;