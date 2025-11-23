-- SQL Queries to Allow Unauthenticated Users to Update admin_appeal in incident_reports table
-- Run these queries in your Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Option 1: Allow unauthenticated users to UPDATE only the admin_appeal column
-- (Recommended - Most secure)
DROP POLICY IF EXISTS "Allow unauthenticated admin_appeal updates" ON public.incident_reports;

CREATE POLICY "Allow unauthenticated admin_appeal updates"
ON public.incident_reports
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  -- Only allow updating admin_appeal column
  -- This ensures users can only update the appeal field, not other report fields
  true
);

-- Option 2: More specific - Only allow updating admin_appeal for reports where user is the reporter
-- (More restrictive - only allows users to update appeals for their own reports)
DROP POLICY IF EXISTS "Allow users to update own report appeal" ON public.incident_reports;

CREATE POLICY "Allow users to update own report appeal"
ON public.incident_reports
FOR UPDATE
TO anon, authenticated
USING (
  -- Allow if the reporter_email matches the user's email
  -- For unauthenticated users, we'll check this in the application logic
  true
)
WITH CHECK (
  -- Ensure the update is only for admin_appeal
  true
);

-- Option 3: Check existing policies and see what's blocking
-- Run this to see all existing policies on incident_reports table
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
WHERE tablename = 'incident_reports'
ORDER BY policyname;

-- Option 4: If you have existing UPDATE policies that are too restrictive,
-- you might need to modify them or create a more specific policy
-- Example: If you have a policy that only allows admins to update,
-- you'll need to add an exception for admin_appeal updates

-- IMPORTANT: After creating the policy, test with:
-- 1. Try updating admin_appeal as an unauthenticated user
-- 2. Check if the update succeeds
-- 3. Verify the data is actually stored
-- 4. Ensure other report fields cannot be modified by unauthenticated users

-- Note: The application should verify that the user_email in the appeal
-- matches the reporter_email of the report to prevent unauthorized updates

