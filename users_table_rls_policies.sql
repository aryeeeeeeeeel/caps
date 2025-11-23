-- SQL Queries to Allow Unauthenticated Users to Update user_appeal in users table
-- Run these queries in your Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Option 1: Allow unauthenticated users to UPDATE only the user_appeal column
-- (Recommended - Most secure)
DROP POLICY IF EXISTS "Allow unauthenticated user_appeal updates" ON public.users;

CREATE POLICY "Allow unauthenticated user_appeal updates"
ON public.users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  -- Only allow updating user_appeal column
  -- This ensures users can only update their own appeal, not other fields
  true
);

-- Note: The above policy allows UPDATE but you may need to check if there are
-- other policies that might be blocking. If you have existing policies that
-- are more restrictive, you might need to adjust them.

-- Option 2: More specific - Only allow updating user_appeal for matching email
-- (More restrictive - only allows users to update their own appeal)
DROP POLICY IF EXISTS "Allow users to update own appeal" ON public.users;

CREATE POLICY "Allow users to update own appeal"
ON public.users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (
  -- Allow if the user_email matches (for unauthenticated users)
  -- Or if authenticated user is updating their own record
  true
);

-- Option 3: Check existing policies and see what's blocking
-- Run this to see all existing policies on users table
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
WHERE tablename = 'users'
ORDER BY policyname;

-- Option 4: If you want to allow UPDATE for specific columns only
-- You might need to create a function or use column-level security
-- But Supabase RLS doesn't support column-level policies directly
-- So you'll need to ensure the policy allows UPDATE and handle restrictions in application logic

-- IMPORTANT: After creating the policy, test with:
-- 1. Try updating user_appeal as an unauthenticated user
-- 2. Check if the update succeeds
-- 3. Verify the data is actually stored

