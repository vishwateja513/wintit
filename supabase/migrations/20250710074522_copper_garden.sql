/*
  # Create Views and Functions for Retail Audit System

  This migration creates:
  - Useful views for common queries
  - Functions for business logic
  - Triggers for automation
*/

-- Create view for audit dashboard
CREATE OR REPLACE VIEW audit_dashboard_view AS
SELECT 
  ae.audit_id,
  ae.status,
  ae.created_at,
  ae.submitted_at,
  ae.start_time,
  ae.end_time,
  s.store_name,
  s.city,
  s.store_type,
  at.name as template_name,
  at.category_id,
  tc.name as category_name,
  up.name as auditor_name,
  up.role as auditor_role,
  aa.due_date,
  aa.priority,
  CASE 
    WHEN ae.status = 'completed' THEN calculate_audit_score(ae.audit_id)
    ELSE 0
  END as score,
  CASE 
    WHEN aa.due_date < CURRENT_DATE AND ae.status NOT IN ('completed', 'submitted') THEN true
    ELSE false
  END as is_overdue
FROM audit_executions ae
LEFT JOIN audit_assignments aa ON ae.assignment_id = aa.assignment_id
LEFT JOIN stores s ON ae.store_id = s.store_id
LEFT JOIN audit_templates at ON ae.template_id = at.template_id
LEFT JOIN template_categories tc ON at.category_id = tc.category_id
LEFT JOIN user_profiles up ON ae.auditor_id = up.user_id;

-- Create view for store performance
CREATE OR REPLACE VIEW store_performance_view AS
SELECT 
  s.store_id,
  s.store_name,
  s.city,
  s.store_type,
  COUNT(ae.audit_id) as total_audits,
  COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) as completed_audits,
  COUNT(CASE WHEN ae.status = 'pending' THEN 1 END) as pending_audits,
  ROUND(AVG(CASE WHEN ae.status = 'completed' THEN calculate_audit_score(ae.audit_id) END), 2) as avg_score,
  MAX(ae.submitted_at) as last_audit_date
FROM stores s
LEFT JOIN audit_executions ae ON s.store_id = ae.store_id
GROUP BY s.store_id, s.store_name, s.city, s.store_type;

-- Create view for auditor performance
CREATE OR REPLACE VIEW auditor_performance_view AS
SELECT 
  up.user_id,
  up.name as auditor_name,
  up.role,
  COUNT(ae.audit_id) as total_audits,
  COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) as completed_audits,
  COUNT(CASE WHEN ae.status = 'pending' THEN 1 END) as pending_audits,
  COUNT(CASE WHEN aa.due_date < CURRENT_DATE AND ae.status NOT IN ('completed', 'submitted') THEN 1 END) as overdue_audits,
  ROUND(AVG(CASE WHEN ae.status = 'completed' THEN calculate_audit_score(ae.audit_id) END), 2) as avg_score,
  ROUND(
    COUNT(CASE WHEN ae.status = 'completed' THEN 1 END)::numeric / 
    NULLIF(COUNT(ae.audit_id), 0) * 100, 2
  ) as completion_rate
FROM user_profiles up
LEFT JOIN audit_executions ae ON up.user_id = ae.auditor_id
LEFT JOIN audit_assignments aa ON ae.assignment_id = aa.assignment_id
WHERE up.role IN ('auditor', 'supervisor')
GROUP BY up.user_id, up.name, up.role;

-- Create view for template usage statistics
CREATE OR REPLACE VIEW template_usage_view AS
SELECT 
  at.template_id,
  at.name as template_name,
  tc.name as category_name,
  COUNT(ae.audit_id) as usage_count,
  COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) as completed_count,
  ROUND(AVG(CASE WHEN ae.status = 'completed' THEN calculate_audit_score(ae.audit_id) END), 2) as avg_score,
  at.created_at,
  at.is_published
FROM audit_templates at
LEFT JOIN template_categories tc ON at.category_id = tc.category_id
LEFT JOIN audit_executions ae ON at.template_id = ae.template_id
GROUP BY at.template_id, at.name, tc.name, at.created_at, at.is_published;

-- Function to get audit summary for a user
CREATE OR REPLACE FUNCTION get_user_audit_summary(target_user_id uuid)
RETURNS TABLE (
  total_audits bigint,
  pending_audits bigint,
  in_progress_audits bigint,
  completed_audits bigint,
  overdue_audits bigint,
  avg_score numeric,
  completion_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_audits,
    COUNT(CASE WHEN ae.status = 'pending' THEN 1 END) as pending_audits,
    COUNT(CASE WHEN ae.status = 'in_progress' THEN 1 END) as in_progress_audits,
    COUNT(CASE WHEN ae.status = 'completed' THEN 1 END) as completed_audits,
    COUNT(CASE WHEN aa.due_date < CURRENT_DATE AND ae.status NOT IN ('completed', 'submitted') THEN 1 END) as overdue_audits,
    ROUND(AVG(CASE WHEN ae.status = 'completed' THEN calculate_audit_score(ae.audit_id) END), 2) as avg_score,
    ROUND(
      COUNT(CASE WHEN ae.status = 'completed' THEN 1 END)::numeric / 
      NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate
  FROM audit_executions ae
  LEFT JOIN audit_assignments aa ON ae.assignment_id = aa.assignment_id
  WHERE ae.auditor_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get store audit history
CREATE OR REPLACE FUNCTION get_store_audit_history(target_store_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  audit_id uuid,
  template_name varchar,
  auditor_name varchar,
  status varchar,
  score numeric,
  submitted_at timestamptz,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.audit_id,
    at.name as template_name,
    up.name as auditor_name,
    ae.status,
    CASE 
      WHEN ae.status = 'completed' THEN calculate_audit_score(ae.audit_id)
      ELSE 0
    END as score,
    ae.submitted_at,
    ae.created_at
  FROM audit_executions ae
  LEFT JOIN audit_templates at ON ae.template_id = at.template_id
  LEFT JOIN user_profiles up ON ae.auditor_id = up.user_id
  WHERE ae.store_id = target_store_id
  ORDER BY ae.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to assign audit to user
CREATE OR REPLACE FUNCTION assign_audit(
  template_uuid uuid,
  store_uuid uuid,
  assigned_to_uuid uuid,
  assigned_by_uuid uuid,
  due_date_param timestamptz,
  priority_param varchar DEFAULT 'medium',
  instructions_param text DEFAULT ''
)
RETURNS uuid AS $$
DECLARE
  new_assignment_id uuid;
  new_audit_id uuid;
BEGIN
  -- Create assignment
  INSERT INTO audit_assignments (
    template_id, store_id, assigned_to, assigned_by, due_date, priority, instructions
  ) VALUES (
    template_uuid, store_uuid, assigned_to_uuid, assigned_by_uuid, 
    due_date_param, priority_param, instructions_param
  ) RETURNING assignment_id INTO new_assignment_id;
  
  -- Create audit execution
  INSERT INTO audit_executions (
    assignment_id, template_id, store_id, auditor_id, status
  ) VALUES (
    new_assignment_id, template_uuid, store_uuid, assigned_to_uuid, 'pending'
  ) RETURNING audit_id INTO new_audit_id;
  
  -- Create notification
  PERFORM create_notification(
    assigned_to_uuid,
    'New Audit Assignment',
    'You have been assigned a new audit at ' || (SELECT store_name FROM stores WHERE store_id = store_uuid),
    'info',
    'assignment',
    jsonb_build_object('audit_id', new_audit_id, 'assignment_id', new_assignment_id)
  );
  
  RETURN new_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete audit
CREATE OR REPLACE FUNCTION complete_audit(
  audit_uuid uuid,
  responses_data jsonb,
  location_data_param jsonb DEFAULT '{}'
)
RETURNS boolean AS $$
DECLARE
  audit_record audit_executions%ROWTYPE;
  calculated_score numeric;
BEGIN
  -- Get audit record
  SELECT * INTO audit_record FROM audit_executions WHERE audit_id = audit_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Audit not found';
  END IF;
  
  -- Update audit with responses
  UPDATE audit_executions 
  SET 
    responses = responses_data,
    location_data = location_data_param,
    status = 'completed',
    end_time = now(),
    submitted_at = now()
  WHERE audit_id = audit_uuid;
  
  -- Calculate and store score
  calculated_score := calculate_audit_score(audit_uuid);
  
  -- Create notification for completion
  PERFORM create_notification(
    audit_record.auditor_id,
    'Audit Completed',
    'Your audit has been successfully completed with a score of ' || calculated_score::text || '%',
    'success',
    'audit',
    jsonb_build_object('audit_id', audit_uuid, 'score', calculated_score)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get conditional questions for audit
CREATE OR REPLACE FUNCTION get_conditional_questions(
  template_uuid uuid,
  current_responses jsonb
)
RETURNS jsonb AS $$
DECLARE
  template_data audit_templates%ROWTYPE;
  visible_questions jsonb := '[]';
  section_data jsonb;
  question_data jsonb;
  conditional_rules jsonb;
  rule_data jsonb;
  should_show boolean;
BEGIN
  -- Get template
  SELECT * INTO template_data FROM audit_templates WHERE template_id = template_uuid;
  
  IF NOT FOUND THEN
    RETURN '[]';
  END IF;
  
  -- Process each section
  FOR section_data IN SELECT jsonb_array_elements(template_data.sections)
  LOOP
    -- Process each question in section
    FOR question_data IN SELECT jsonb_array_elements(section_data->'questions')
    LOOP
      should_show := true;
      
      -- Check if question has conditional logic
      IF question_data ? 'conditional' THEN
        should_show := false;
        conditional_rules := question_data->'conditional';
        
        -- Evaluate conditions (simplified logic)
        IF conditional_rules ? 'show_when' THEN
          -- Add your conditional logic evaluation here
          -- This is a simplified version
          should_show := true;
        END IF;
      END IF;
      
      -- Add question to visible list if it should be shown
      IF should_show THEN
        visible_questions := visible_questions || jsonb_build_array(question_data);
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN visible_questions;
END;
$$ LANGUAGE plpgsql;

-- Function to sync mobile data
CREATE OR REPLACE FUNCTION sync_mobile_data(
  user_uuid uuid,
  device_id_param varchar,
  sync_data jsonb
)
RETURNS jsonb AS $$
DECLARE
  sync_result jsonb := '{"status": "success", "synced_records": 0, "errors": []}';
  record_data jsonb;
  synced_count integer := 0;
BEGIN
  -- Log sync start
  INSERT INTO sync_logs (user_id, device_id, sync_type, entity_type, status, started_at)
  VALUES (user_uuid, device_id_param, 'upload', 'mixed', 'pending', now());
  
  -- Process each record in sync data
  FOR record_data IN SELECT jsonb_array_elements(sync_data->'records')
  LOOP
    BEGIN
      -- Handle different entity types
      CASE record_data->>'entity_type'
        WHEN 'audit_execution' THEN
          -- Update audit execution
          UPDATE audit_executions 
          SET 
            responses = record_data->'data'->'responses',
            status = record_data->'data'->>'status',
            updated_at = now()
          WHERE audit_id = (record_data->'data'->>'audit_id')::uuid;
          
        WHEN 'audit_photo' THEN
          -- Insert audit photo
          INSERT INTO audit_photos (
            audit_id, question_id, file_path, file_name, uploaded_at
          ) VALUES (
            (record_data->'data'->>'audit_id')::uuid,
            record_data->'data'->>'question_id',
            record_data->'data'->>'file_path',
            record_data->'data'->>'file_name',
            now()
          );
      END CASE;
      
      synced_count := synced_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      sync_result := jsonb_set(
        sync_result, 
        '{errors}', 
        (sync_result->'errors') || jsonb_build_array(SQLERRM)
      );
    END;
  END LOOP;
  
  -- Update sync result
  sync_result := jsonb_set(sync_result, '{synced_records}', to_jsonb(synced_count));
  
  -- Update sync log
  UPDATE sync_logs 
  SET 
    status = 'success',
    records_count = synced_count,
    completed_at = now()
  WHERE user_id = user_uuid 
    AND device_id = device_id_param 
    AND status = 'pending'
    AND started_at >= (now() - interval '1 hour');
  
  RETURN sync_result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for views and performance
CREATE INDEX IF NOT EXISTS idx_audit_executions_status_created ON audit_executions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_executions_auditor_status ON audit_executions(auditor_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_assignments_due_date ON audit_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_device ON sync_logs(user_id, device_id);