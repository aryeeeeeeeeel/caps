[
  {
    "schema_name": "public",
    "table_name": "incident_reports",
    "trigger_name": "incident_status_change",
    "trigger_event": "UPDATE",
    "activation": "AFTER",
    "condition": null,
    "definition": "EXECUTE FUNCTION log_incident_changes()"
  },
  {
    "schema_name": "public",
    "table_name": "incident_reports",
    "trigger_name": "tr_incident_reports_status_update",
    "trigger_event": "UPDATE",
    "activation": "AFTER",
    "condition": null,
    "definition": "EXECUTE FUNCTION log_incident_status_update()"
  },
  {
    "schema_name": "public",
    "table_name": "incident_reports",
    "trigger_name": "trigger_create_report_notification",
    "trigger_event": "INSERT",
    "activation": "AFTER",
    "condition": null,
    "definition": "EXECUTE FUNCTION create_report_notification()"
  },
  {
    "schema_name": "public",
    "table_name": "incident_reports",
    "trigger_name": "update_hazard_reports_updated_at",
    "trigger_event": "UPDATE",
    "activation": "BEFORE",
    "condition": null,
    "definition": "EXECUTE FUNCTION update_updated_at_column()"
  },
  {
    "schema_name": "public",
    "table_name": "notifications",
    "trigger_name": "tr_notifications_after_insert",
    "trigger_event": "INSERT",
    "activation": "AFTER",
    "condition": null,
    "definition": "EXECUTE FUNCTION log_notification_insert()"
  },
  {
    "schema_name": "public",
    "table_name": "notifications",
    "trigger_name": "trigger_update_notifications_updated_at",
    "trigger_event": "UPDATE",
    "activation": "BEFORE",
    "condition": null,
    "definition": "EXECUTE FUNCTION update_updated_at_column()"
  }
]

-- Get all triggers in the database
SELECT 
    event_object_schema AS schema_name,
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS trigger_event,
    action_timing AS activation,
    action_condition AS condition,
    action_statement AS definition
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;