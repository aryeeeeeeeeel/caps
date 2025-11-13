[
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "Admins can insert activity logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "Admins can read all activity logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "System can insert admin activity logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "Users can insert their own activity logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.jwt() ->> 'email'::text) = user_email)"
  },
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "Users can read their own activity logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.jwt() ->> 'email'::text) = user_email)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "activity_logs_insert_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_email = auth.email())"
  },
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "activity_logs_select_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_email = auth.email())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "device_fingerprints",
    "policyname": "Allow inserts for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "device_fingerprints",
    "policyname": "Service role full access",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'service_role'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "device_fingerprints",
    "policyname": "Users can delete own device fingerprints",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "device_fingerprints",
    "policyname": "Users can insert own device fingerprints",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "device_fingerprints",
    "policyname": "Users can update own device fingerprints",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "device_fingerprints",
    "policyname": "Users can view own device fingerprints",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Admins can read all feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Admins can update feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "is_admin()",
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Users can insert their own feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.jwt() ->> 'email'::text) = user_email)"
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Users can read their own feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.jwt() ->> 'email'::text) = user_email)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Users can update their own feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((auth.jwt() ->> 'email'::text) = user_email)",
    "with_check": "((auth.jwt() ->> 'email'::text) = user_email)"
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Users insert own feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_email = auth.email())"
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "Users read own feedback",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_email = auth.email())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "feedback_insert_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_email = auth.email())"
  },
  {
    "schemaname": "public",
    "tablename": "feedback",
    "policyname": "feedback_select_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_email = auth.email())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Admins can insert incident reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Admins can read all incident reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Admins can update incident reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "is_admin()",
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Users can create reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Users can insert their own reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.jwt() ->> 'email'::text) = reporter_email)"
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Users can read their own reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.jwt() ->> 'email'::text) = reporter_email)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Users can read their own reports or super admin",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(((auth.jwt() ->> 'email'::text) = reporter_email) OR is_super_admin())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Users can update their own reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((auth.jwt() ->> 'email'::text) = reporter_email)",
    "with_check": "((auth.jwt() ->> 'email'::text) = reporter_email)"
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "Users can view their own incident reports",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(reporter_email = (auth.jwt() ->> 'email'::text))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_reports",
    "policyname": "super_admin_full_access_incidents",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "is_super_admin()",
    "with_check": "is_super_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "incident_response_routes",
    "policyname": "Admins can delete incident response routes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_response_routes",
    "policyname": "Admins can insert incident response routes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "incident_response_routes",
    "policyname": "Admins can read all incident response routes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "incident_response_routes",
    "policyname": "Admins can update incident response routes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "is_admin()",
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "Admins can insert notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "Admins can read all notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "Admins can update notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "is_admin()",
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "Users can insert notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.jwt() ->> 'email'::text) = user_email)"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "Users can read their own notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.jwt() ->> 'email'::text) = user_email)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "Users can update their own notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((auth.jwt() ->> 'email'::text) = user_email)",
    "with_check": "((auth.jwt() ->> 'email'::text) = user_email)"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "insert_by_admin",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.jwt() ->> 'role'::text) = 'admin'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "notifications",
    "policyname": "select_own_notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_email = (auth.jwt() ->> 'email'::text))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "system_logs",
    "policyname": "Admins can insert system logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_admin()"
  },
  {
    "schemaname": "public",
    "tablename": "system_logs",
    "policyname": "Admins can read all system logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "system_logs",
    "policyname": "Authenticated users can read system logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "system_logs",
    "policyname": "insert_system_logs_admin",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.jwt() ->> 'role'::text) = 'admin'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Admins can manage all users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Allow user registration",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Enable read access for all users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Enable update for users based on id",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Users can read own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Users can read own profile or super admin",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((auth.uid() = id) OR is_super_admin())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Users can update own profile or super admin",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((auth.uid() = id) OR is_super_admin())",
    "with_check": "((auth.uid() = id) OR is_super_admin())"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "admin_update_user_status",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((auth.jwt() ->> 'role'::text) = 'admin'::text)",
    "with_check": "((auth.jwt() ->> 'role'::text) = 'admin'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "allow_duplicate_check_during_registration",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "super_admin_full_access",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "is_super_admin()",
    "with_check": "is_super_admin()"
  }
]

-- Get all policies in the database
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;