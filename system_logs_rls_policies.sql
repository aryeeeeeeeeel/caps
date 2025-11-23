-- SQL Queries to Allow Unauthenticated Users to Insert into system_logs
-- Run these queries in your Supabase SQL Editor

-- Option 1: Allow all unauthenticated users to insert into system_logs
-- (Most permissive - allows any insert from unauthenticated users)
-- Enable RLS if not already enabled
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (optional - only if you want to replace it)
DROP POLICY IF EXISTS "Allow unauthenticated inserts" ON public.system_logs;

-- Create policy to allow INSERT for unauthenticated users
CREATE POLICY "Allow unauthenticated inserts"
ON public.system_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Option 2: More Restrictive - Only allow appeal-related inserts from unauthenticated users
-- (Recommended - only allows 'user_action' activity_type for appeals)
-- Enable RLS if not already enabled
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (optional - only if you want to replace it)
DROP POLICY IF EXISTS "Allow unauthenticated appeal inserts" ON public.system_logs;

-- Create policy to allow INSERT only for appeal-related entries
CREATE POLICY "Allow unauthenticated appeal inserts"
ON public.system_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  activity_type = 'user_action' 
  AND (
    activity_description LIKE '%appeal%' 
    OR details->>'appeal_type' IS NOT NULL
    OR details->>'report_title' IS NOT NULL
  )
);

-- Option 3: Allow authenticated users to insert anything, unauthenticated only for appeals
-- (Most secure - authenticated users can insert anything, unauthenticated only appeals)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.system_logs;
DROP POLICY IF EXISTS "Allow unauthenticated appeal inserts only" ON public.system_logs;

-- Policy for authenticated users (can insert anything)
CREATE POLICY "Allow authenticated inserts"
ON public.system_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for unauthenticated users (only appeals)
CREATE POLICY "Allow unauthenticated appeal inserts only"
ON public.system_logs
FOR INSERT
TO anon
WITH CHECK (
  activity_type = 'user_action' 
  AND (
    activity_description LIKE '%appeal%' 
    OR details->>'appeal_type' IS NOT NULL
    OR details->>'report_title' IS NOT NULL
  )
);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'system_logs';

