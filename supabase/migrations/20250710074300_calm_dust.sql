/*
  # Comprehensive Retail Execution Audit System Database Schema

  1. New Tables
    - `user_profiles` - Extended user profile information
    - `stores` - Store/location master data
    - `products` - Product master data
    - `template_categories` - Template categorization
    - `audit_assignments` - Audit assignment tracking
    - `audit_photos` - Photo evidence storage
    - `audit_scores` - Detailed scoring breakdown
    - `notifications` - System notifications
    - `sync_logs` - Mobile sync tracking
    - `report_templates` - Custom report configurations
    - `dashboard_widgets` - Dashboard customization

  2. Enhanced Features
    - Conditional logic support
    - Advanced scoring mechanisms
    - Photo management
    - Notification system
    - Mobile sync tracking
    - Custom reporting

  3. Security
    - Enable RLS on all tables
    - Add comprehensive policies
    - Secure file storage integration
*/

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  profile_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  role varchar NOT NULL DEFAULT 'auditor' CHECK (role IN ('admin', 'supervisor', 'auditor', 'manager')),
  assigned_regions jsonb DEFAULT '[]',
  phone varchar,
  avatar_url text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create stores table for location master data
CREATE TABLE IF NOT EXISTS stores (
  store_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code varchar UNIQUE NOT NULL,
  store_name varchar NOT NULL,
  address text,
  city varchar,
  state varchar,
  postal_code varchar,
  country varchar DEFAULT 'India',
  coordinates jsonb,
  store_type varchar,
  chain_name varchar,
  contact_person varchar,
  contact_phone varchar,
  operating_hours jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table for product master data
CREATE TABLE IF NOT EXISTS products (
  product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code varchar UNIQUE NOT NULL,
  product_name varchar NOT NULL,
  brand varchar,
  category varchar,
  subcategory varchar,
  mrp numeric(10,2),
  pack_size varchar,
  barcode varchar,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template_categories table
CREATE TABLE IF NOT EXISTS template_categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar UNIQUE NOT NULL,
  description text,
  icon varchar,
  color varchar,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enhanced templates table (extending existing structure)
CREATE TABLE IF NOT EXISTS audit_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  category_id uuid REFERENCES template_categories(category_id),
  version integer DEFAULT 1,
  sections jsonb DEFAULT '[]',
  conditional_logic jsonb DEFAULT '{}',
  scoring_rules jsonb DEFAULT '{}',
  validation_rules jsonb DEFAULT '{}',
  created_by uuid REFERENCES user_profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- Create audit_assignments table
CREATE TABLE IF NOT EXISTS audit_assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES audit_templates(template_id),
  store_id uuid REFERENCES stores(store_id),
  assigned_to uuid REFERENCES user_profiles(user_id),
  assigned_by uuid REFERENCES user_profiles(user_id),
  due_date timestamptz,
  priority varchar DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  instructions text,
  status varchar DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'completed', 'overdue', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced audits table
CREATE TABLE IF NOT EXISTS audit_executions (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES audit_assignments(assignment_id),
  template_id uuid REFERENCES audit_templates(template_id),
  store_id uuid REFERENCES stores(store_id),
  auditor_id uuid REFERENCES user_profiles(user_id),
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'submitted', 'approved', 'rejected')),
  responses jsonb DEFAULT '{}',
  conditional_responses jsonb DEFAULT '{}',
  location_data jsonb,
  start_time timestamptz,
  end_time timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES user_profiles(user_id),
  rejection_reason text,
  sync_status varchar DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_photos table for photo evidence
CREATE TABLE IF NOT EXISTS audit_photos (
  photo_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audit_executions(audit_id) ON DELETE CASCADE,
  question_id varchar NOT NULL,
  file_path text NOT NULL,
  file_name varchar NOT NULL,
  file_size integer,
  mime_type varchar,
  caption text,
  coordinates jsonb,
  uploaded_at timestamptz DEFAULT now(),
  is_synced boolean DEFAULT false
);

-- Create audit_scores table for detailed scoring
CREATE TABLE IF NOT EXISTS audit_scores (
  score_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audit_executions(audit_id) ON DELETE CASCADE,
  section_id varchar NOT NULL,
  question_id varchar,
  max_score numeric(5,2) DEFAULT 0,
  achieved_score numeric(5,2) DEFAULT 0,
  weight numeric(5,2) DEFAULT 1,
  is_critical boolean DEFAULT false,
  scoring_notes text,
  calculated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id),
  title varchar NOT NULL,
  message text NOT NULL,
  type varchar DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  category varchar DEFAULT 'general' CHECK (category IN ('general', 'audit', 'assignment', 'system')),
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create sync_logs table for mobile sync tracking
CREATE TABLE IF NOT EXISTS sync_logs (
  sync_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id),
  device_id varchar,
  sync_type varchar NOT NULL CHECK (sync_type IN ('full', 'incremental', 'upload', 'download')),
  entity_type varchar NOT NULL,
  entity_id uuid,
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
  error_message text,
  records_count integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  report_template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  report_type varchar NOT NULL CHECK (report_type IN ('audit_summary', 'compliance', 'performance', 'custom')),
  configuration jsonb DEFAULT '{}',
  filters jsonb DEFAULT '{}',
  created_by uuid REFERENCES user_profiles(user_id),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dashboard_widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  widget_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id),
  widget_type varchar NOT NULL,
  title varchar NOT NULL,
  configuration jsonb DEFAULT '{}',
  position jsonb DEFAULT '{}',
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default template categories
INSERT INTO template_categories (name, description, icon, color, sort_order) VALUES
('Merchandising', 'Product placement and visibility audits', 'package', '#3B82F6', 1),
('Stock Management', 'Inventory and stock level checks', 'archive', '#10B981', 2),
('Quality Control', 'Product quality and compliance audits', 'shield-check', '#F59E0B', 3),
('Competitor Analysis', 'Competitive landscape assessment', 'users', '#8B5CF6', 4),
('Pricing Compliance', 'Price verification and compliance', 'dollar-sign', '#EF4444', 5),
('Brand Visibility', 'Brand presence and POSM audits', 'eye', '#06B6D4', 6),
('Store Standards', 'Store hygiene and standards check', 'star', '#84CC16', 7),
('Promotion Compliance', 'Promotional activity verification', 'megaphone', '#F97316', 8)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Stores Policies
CREATE POLICY "Authenticated users can view stores" ON stores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage stores" ON stores
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Products Policies
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Template Categories Policies
CREATE POLICY "Authenticated users can view categories" ON template_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON template_categories
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Audit Templates Policies
CREATE POLICY "Users can view published templates" ON audit_templates
  FOR SELECT TO authenticated USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON audit_templates
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON audit_templates
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Audit Assignments Policies
CREATE POLICY "Users can view assigned audits" ON audit_assignments
  FOR SELECT TO authenticated USING (
    assigned_to = auth.uid() OR 
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor', 'manager')
    )
  );

CREATE POLICY "Supervisors can create assignments" ON audit_assignments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor', 'manager')
    )
  );

-- Audit Executions Policies
CREATE POLICY "Users can view own audits" ON audit_executions
  FOR SELECT TO authenticated USING (
    auditor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor', 'manager')
    )
  );

CREATE POLICY "Users can create audit executions" ON audit_executions
  FOR INSERT TO authenticated WITH CHECK (auditor_id = auth.uid());

CREATE POLICY "Users can update own audits" ON audit_executions
  FOR UPDATE TO authenticated USING (auditor_id = auth.uid());

-- Audit Photos Policies
CREATE POLICY "Users can manage photos for own audits" ON audit_photos
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM audit_executions 
      WHERE audit_id = audit_photos.audit_id AND auditor_id = auth.uid()
    )
  );

-- Audit Scores Policies
CREATE POLICY "Users can view scores for accessible audits" ON audit_scores
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM audit_executions 
      WHERE audit_id = audit_scores.audit_id AND (
        auditor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor', 'manager')
        )
      )
    )
  );

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Sync Logs Policies
CREATE POLICY "Users can manage own sync logs" ON sync_logs
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Report Templates Policies
CREATE POLICY "Users can view public and own report templates" ON report_templates
  FOR SELECT TO authenticated USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create report templates" ON report_templates
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own report templates" ON report_templates
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- Dashboard Widgets Policies
CREATE POLICY "Users can manage own dashboard widgets" ON dashboard_widgets
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_audit_templates_published ON audit_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_audit_templates_category ON audit_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_assignments_assigned_to ON audit_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_assignments_status ON audit_assignments(status);
CREATE INDEX IF NOT EXISTS idx_audit_executions_auditor ON audit_executions(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audit_executions_status ON audit_executions(status);
CREATE INDEX IF NOT EXISTS idx_audit_executions_store ON audit_executions(store_id);
CREATE INDEX IF NOT EXISTS idx_audit_photos_audit ON audit_photos(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_scores_audit ON audit_scores(audit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_status ON sync_logs(user_id, status);

-- Create functions for common operations

-- Function to calculate audit score
CREATE OR REPLACE FUNCTION calculate_audit_score(audit_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_score numeric := 0;
  max_possible_score numeric := 0;
  final_percentage numeric := 0;
BEGIN
  SELECT 
    COALESCE(SUM(achieved_score * weight), 0),
    COALESCE(SUM(max_score * weight), 0)
  INTO total_score, max_possible_score
  FROM audit_scores 
  WHERE audit_id = audit_uuid;
  
  IF max_possible_score > 0 THEN
    final_percentage := (total_score / max_possible_score) * 100;
  END IF;
  
  RETURN ROUND(final_percentage, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notification_title varchar,
  notification_message text,
  notification_type varchar DEFAULT 'info',
  notification_category varchar DEFAULT 'general',
  notification_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  new_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id, title, message, type, category, data
  ) VALUES (
    target_user_id, notification_title, notification_message, 
    notification_type, notification_category, notification_data
  ) RETURNING notification_id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update audit status with notifications
CREATE OR REPLACE FUNCTION update_audit_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when audit is completed
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM create_notification(
      NEW.auditor_id,
      'Audit Completed',
      'Your audit has been successfully completed and submitted.',
      'success',
      'audit',
      jsonb_build_object('audit_id', NEW.audit_id)
    );
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit status updates
CREATE TRIGGER audit_status_update_trigger
  BEFORE UPDATE ON audit_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_status();

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_templates_updated_at BEFORE UPDATE ON audit_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_assignments_updated_at BEFORE UPDATE ON audit_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();