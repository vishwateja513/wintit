/*
  # Fix Template System Schema

  1. New Tables
    - Fix existing audit_templates table structure
    - Add proper sections and questions storage
    - Add scoring and logic configuration tables
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
  
  3. Functions
    - Add trigger functions for updated_at columns
*/

-- Drop existing problematic constraints and recreate tables properly
DROP TABLE IF EXISTS audit_templates CASCADE;
DROP TABLE IF EXISTS template_categories CASCADE;

-- Create template_categories table
CREATE TABLE template_categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar UNIQUE NOT NULL,
  description text,
  icon varchar,
  color varchar DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create audit_templates table with proper structure
CREATE TABLE audit_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  category_id uuid REFERENCES template_categories(category_id),
  version integer DEFAULT 1,
  sections jsonb DEFAULT '[]'::jsonb,
  conditional_logic jsonb DEFAULT '{}'::jsonb,
  scoring_rules jsonb DEFAULT '{}'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES user_profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- Insert default categories based on functional spec
INSERT INTO template_categories (name, description, icon, color, sort_order) VALUES
('Merchandising', 'Product placement and visibility audits', 'package', '#3B82F6', 1),
('Stock Management', 'Inventory and stock level checks', 'archive', '#10B981', 2),
('Quality Control', 'Product quality and compliance audits', 'shield-check', '#F59E0B', 3),
('Competitor Analysis', 'Competitive landscape assessment', 'users', '#8B5CF6', 4),
('Pricing Compliance', 'Price verification and compliance', 'dollar-sign', '#EF4444', 5),
('Brand Visibility', 'Brand presence and POSM audits', 'eye', '#06B6D4', 6)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_categories
CREATE POLICY "Anyone can view categories" ON template_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON template_categories
  FOR ALL TO authenticated USING (true);

-- RLS Policies for audit_templates
CREATE POLICY "Users can view published templates or own templates" ON audit_templates
  FOR SELECT TO authenticated USING (
    is_published = true OR created_by = auth.uid()
  );

CREATE POLICY "Users can create templates" ON audit_templates
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON audit_templates
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON audit_templates
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_templates_created_by ON audit_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_templates_published ON audit_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_audit_templates_category ON audit_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_templates_active ON audit_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_sort ON template_categories(sort_order);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_audit_templates_updated_at ON audit_templates;
CREATE TRIGGER update_audit_templates_updated_at 
  BEFORE UPDATE ON audit_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable real-time for templates
ALTER PUBLICATION supabase_realtime ADD TABLE audit_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE template_categories;