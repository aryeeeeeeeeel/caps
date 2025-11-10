[
  {
    "trigger_name": "tr_check_filters",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION realtime.subscription_check_filters()",
    "event_object_table": "subscription"
  },
  {
    "trigger_name": "tr_check_filters",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION realtime.subscription_check_filters()",
    "event_object_table": "subscription"
  },
  {
    "trigger_name": "update_objects_updated_at",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION storage.update_updated_at_column()",
    "event_object_table": "objects"
  },
  {
    "trigger_name": "key_encrypt_secret_trigger_raw_key",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION pgsodium.key_encrypt_secret_raw_key()",
    "event_object_table": "key"
  },
  {
    "trigger_name": "key_encrypt_secret_trigger_raw_key",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION pgsodium.key_encrypt_secret_raw_key()",
    "event_object_table": "key"
  },
  {
    "trigger_name": "on_email_confirmed",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION handle_email_confirmation()",
    "event_object_table": "users"
  },
  {
    "trigger_name": "objects_insert_create_prefix",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION storage.objects_insert_prefix_trigger()",
    "event_object_table": "objects"
  },
  {
    "trigger_name": "prefixes_create_hierarchy",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION storage.prefixes_insert_trigger()",
    "event_object_table": "prefixes"
  },
  {
    "trigger_name": "enforce_bucket_name_length_trigger",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION storage.enforce_bucket_name_length()",
    "event_object_table": "buckets"
  },
  {
    "trigger_name": "enforce_bucket_name_length_trigger",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION storage.enforce_bucket_name_length()",
    "event_object_table": "buckets"
  },
  {
    "trigger_name": "objects_delete_delete_prefix",
    "event_manipulation": "DELETE",
    "action_statement": "EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()",
    "event_object_table": "objects"
  },
  {
    "trigger_name": "objects_update_create_prefix",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION storage.objects_update_prefix_trigger()",
    "event_object_table": "objects"
  },
  {
    "trigger_name": "prefixes_delete_hierarchy",
    "event_manipulation": "DELETE",
    "action_statement": "EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()",
    "event_object_table": "prefixes"
  },
  {
    "trigger_name": "on_auth_user_created",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION handle_new_user()",
    "event_object_table": "users"
  },
  {
    "trigger_name": "on_auth_user_email_confirmed",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION handle_email_confirmed()",
    "event_object_table": "users"
  },
  {
    "trigger_name": "on_auth_user_confirmed",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION handle_auth_confirmation()",
    "event_object_table": "users"
  },
  {
    "trigger_name": "incident_status_change",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION log_incident_changes()",
    "event_object_table": "incident_reports"
  },
  {
    "trigger_name": "trigger_update_notifications_updated_at",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "event_object_table": "notifications"
  },
  {
    "trigger_name": "update_hazard_reports_updated_at",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "event_object_table": "incident_reports"
  },
  {
    "trigger_name": "trigger_create_report_notification",
    "event_manipulation": "INSERT",
    "action_statement": "EXECUTE FUNCTION create_report_notification()",
    "event_object_table": "incident_reports"
  },
  {
    "trigger_name": "update_last_active_trigger",
    "event_manipulation": "UPDATE",
    "action_statement": "EXECUTE FUNCTION update_last_active()",
    "event_object_table": "sessions"
  }
]