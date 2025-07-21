/*
  # Create Audit System Schema

  1. New Tables
    - `template_categories`
      - `category_id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `icon` (text, optional)
      - `color` (text, default '#3B82F6')
      - `sort_order` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

    - `audit_templates`
      - `template_id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `category_id` (uuid, foreign key to template_categories)
      - `version` (integer, default 1)
      - `sections` (jsonb, default '[]')
      - `conditional_logic` (jsonb, default '{}')
      - `scoring_rules` (jsonb, default '{}')
      - `validation_rules` (jsonb, default '{}')
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp, optional)
      - `is_published` (boolean, default false)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for public access where appropriate

  3. Functions
    - Add trigger function for updated_at timestamps
*/

-- Create template_categories table
CREATE TABLE IF NOT EXISTS template_categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create audit_templates table
CREATE TABLE IF NOT EXISTS audit_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES template_categories(category_id),
  version integer DEFAULT 1,
  sections jsonb DEFAULT '[]'::jsonb,
  conditional_logic jsonb DEFAULT '{}'::jsonb,
  scoring_rules jsonb DEFAULT '{}'::jsonb,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_sort ON template_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_audit_templates_active ON audit_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_templates_published ON audit_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_audit_templates_category ON audit_templates(category_id);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for audit_templates updated_at
DROP TRIGGER IF EXISTS update_audit_templates_updated_at ON audit_templates;
CREATE TRIGGER update_audit_templates_updated_at
    BEFORE UPDATE ON audit_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;

-- Policies for template_categories
DROP POLICY IF EXISTS "Public can view categories" ON template_categories;
CREATE POLICY "Public can view categories"
  ON template_categories
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view categories" ON template_categories;
CREATE POLICY "Authenticated users can view categories"
  ON template_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON template_categories;
CREATE POLICY "Admins can manage categories"
  ON template_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for audit_templates
DROP POLICY IF EXISTS "Public can view templates" ON audit_templates;
CREATE POLICY "Public can view templates"
  ON audit_templates
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can view published templates" ON audit_templates;
CREATE POLICY "Users can view published templates"
  ON audit_templates
  FOR SELECT
  TO authenticated
  USING ((is_published = true) OR (created_by = auth.uid()));

DROP POLICY IF EXISTS "Users can create templates" ON audit_templates;
CREATE POLICY "Users can create templates"
  ON audit_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own templates" ON audit_templates;
CREATE POLICY "Users can update own templates"
  ON audit_templates
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own templates" ON audit_templates;
CREATE POLICY "Users can delete own templates"
  ON audit_templates
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Insert default categories
INSERT INTO template_categories (name, description, icon, color, sort_order) VALUES
  ('Merchandising', 'Product placement and visibility audits', 'package', '#3B82F6', 1),
  ('Quality Control', 'Product quality and compliance checks', 'shield-check', '#10B981', 2),
  ('Competitor Analysis', 'Market research and competitor tracking', 'trending-up', '#F59E0B', 3),
  ('Stock Management', 'Inventory and stock level monitoring', 'archive', '#8B5CF6', 4),
  ('Pricing', 'Price compliance and promotional checks', 'dollar-sign', '#EF4444', 5)
ON CONFLICT (name) DO NOTHING;