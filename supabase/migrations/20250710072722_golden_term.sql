/*
  # Retail Execution Audit System Database Schema

  1. New Tables
     - `templates` - Stores audit template metadata and configuration
     - `audits` - Tracks individual audit instances
     - `sections` - Stores reusable sections for templates
     - `users` - Manages user accounts and roles
     - `reports` - Stores generated reports

  2. Security
     - Enable RLS on all tables
     - Add policies for role-based access control
     - Secure user data with proper authentication

  3. Features
     - JSONB columns for dynamic data storage
     - UUID primary keys for better scalability
     - Proper indexing for performance
     - Default values and constraints for data integrity
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  email varchar UNIQUE NOT NULL,
  role varchar NOT NULL DEFAULT 'auditor',
  assigned_regions jsonb DEFAULT '[]',
  password_hash text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  category varchar,
  sections jsonb DEFAULT '[]',
  scoring_rules jsonb DEFAULT '{}',
  created_by uuid REFERENCES users(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT false
);

-- Create audits table
CREATE TABLE IF NOT EXISTS audits (
  audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(template_id),
  status varchar DEFAULT 'pending',
  assigned_to uuid REFERENCES users(user_id),
  location jsonb DEFAULT '{}',
  responses jsonb DEFAULT '{}',
  score numeric DEFAULT 0,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  section_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(template_id),
  title varchar NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  questions jsonb DEFAULT '[]'
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(audit_id),
  generated_by uuid REFERENCES users(user_id),
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Templates are viewable by authenticated users" ON templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create templates" ON templates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Audits are viewable by assigned users" ON audits
  FOR SELECT TO authenticated
  USING (auth.uid() = assigned_to OR auth.uid() IN (
    SELECT user_id FROM users WHERE role IN ('admin', 'supervisor')
  ));

CREATE POLICY "Users can create audits" ON audits
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update assigned audits" ON audits
  FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_to);

CREATE POLICY "Sections are viewable by authenticated users" ON sections
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage sections" ON sections
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Reports are viewable by authenticated users" ON reports
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = generated_by);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_published ON templates(is_published);
CREATE INDEX IF NOT EXISTS idx_audits_assigned ON audits(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audits_template ON audits(template_id);
CREATE INDEX IF NOT EXISTS idx_sections_template ON sections(template_id);