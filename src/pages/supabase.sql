-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['login'::text, 'logout'::text, 'report'::text, 'feedback'::text, 'profile'::text])),
  activity_description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_email_fkey FOREIGN KEY (user_email) REFERENCES public.users(user_email)
);
CREATE TABLE public.device_fingerprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text,
  user_agent text,
  ip_address inet,
  is_trusted boolean DEFAULT false,
  last_used_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT device_fingerprints_pkey PRIMARY KEY (id),
  CONSTRAINT device_fingerprints_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  report_id uuid,
  overall_rating integer NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5),
  response_time_rating integer CHECK (response_time_rating >= 0 AND response_time_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 0 AND communication_rating <= 5),
  resolution_satisfaction integer CHECK (resolution_satisfaction >= 0 AND resolution_satisfaction <= 5),
  categories ARRAY,
  would_recommend boolean,
  comments text,
  read boolean DEFAULT false,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.incident_reports(id),
  CONSTRAINT feedback_user_email_fkey FOREIGN KEY (user_email) REFERENCES public.users(user_email)
);
CREATE TABLE public.incident_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'resolved'::text])),
  location text,
  barangay text,
  coordinates jsonb,
  image_urls ARRAY,
  reporter_email text,
  reporter_name text,
  admin_response text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  photo_datetime timestamp with time zone,
  resolved_at timestamp without time zone,
  reporter_address text,
  reporter_contact text,
  scheduled_response_time timestamp with time zone,
  estimated_arrival_time timestamp with time zone,
  actual_response_started timestamp with time zone,
  actual_resolved_time timestamp with time zone,
  current_eta_minutes integer,
  response_route_data jsonb,
  report_submitted timestamp with time zone,
  read boolean DEFAULT false,
  estimated_response_time timestamp with time zone,
  auto_notification_sent boolean DEFAULT false,
  auto_status_notification_sent boolean DEFAULT false,
  resolved_photo_url text,
  CONSTRAINT incident_reports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.incident_response_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  incident_report_id uuid NOT NULL,
  route_coordinates jsonb NOT NULL,
  calculated_distance_km numeric,
  calculated_eta_minutes integer NOT NULL,
  route_polyline text,
  calculated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT incident_response_routes_pkey PRIMARY KEY (id),
  CONSTRAINT fk_incident_report FOREIGN KEY (incident_report_id) REFERENCES public.incident_reports(id),
  CONSTRAINT incident_response_routes_incident_report_id_fkey FOREIGN KEY (incident_report_id) REFERENCES public.incident_reports(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'error'::text, 'update'::text])),
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  related_report_id uuid,
  action_url text,
  is_automated boolean DEFAULT false,
  trigger_type text CHECK (trigger_type = ANY (ARRAY['scheduled_response'::text, 'response_started'::text, 'eta_reminder'::text, 'incident_resolved'::text])),
  scheduled_for timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code text NOT NULL,
  device_fingerprint text NOT NULL,
  purpose text NOT NULL CHECK (purpose = ANY (ARRAY['new_device_auth'::text, 'password_reset'::text, 'email_verification'::text])),
  is_used boolean DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id),
  CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.posts (
  post_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id integer,
  username text NOT NULL,
  post_content text NOT NULL,
  post_created_at timestamp with time zone DEFAULT now(),
  post_updated_at timestamp with time zone DEFAULT now(),
  avatar_url text,
  CONSTRAINT posts_pkey PRIMARY KEY (post_id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['login'::text, 'logout'::text, 'notify'::text, 'update_report'::text, 'user_action'::text, 'system'::text])),
  activity_description text NOT NULL,
  target_user_email text,
  target_report_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  user_id integer NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  username text NOT NULL,
  user_email text NOT NULL UNIQUE,
  user_firstname text,
  user_lastname text,
  user_avatar_url text,
  user_password text NOT NULL,
  date_registered timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  id integer,
  auth_uuid uuid UNIQUE,
  user_address text,
  user_contact_number text,
  role text DEFAULT 'user'::text,
  status text DEFAULT 'inactive'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'banned'::text])),
  warnings integer DEFAULT 0,
  last_warning_date timestamp with time zone,
  last_active_at timestamp with time zone,
  is_authenticated boolean DEFAULT false,
  is_online boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);