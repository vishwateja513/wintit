/*
  # Templates System Database Schema

  1. New Tables
    - `template_categories`
      - `category_id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
      - `sort_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)

    - `audit_templates`
      - `template_id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category_id` (uuid, foreign key)
      - `version` (integer)
      - `sections` (jsonb)
      - `conditional_logic` (jsonb)
      - `scoring_rules` (jsonb)
      - `validation_rules` (jsonb)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `published_at` (timestamp)
      - `is_published` (boolean)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (no auth required)
*/

-- Create template_categories table
CREATE TABLE IF NOT EXISTS template_categories (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'folder',
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
  created_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Public can view categories" ON template_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can manage categories" ON template_categories
  FOR ALL USING (true);

CREATE POLICY "Public can view templates" ON audit_templates
  FOR SELECT USING (true);

CREATE POLICY "Public can manage templates" ON audit_templates
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_sort ON template_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_audit_templates_category ON audit_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_audit_templates_published ON audit_templates(is_published);
CREATE INDEX IF NOT EXISTS idx_audit_templates_active ON audit_templates(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for audit_templates
DROP TRIGGER IF EXISTS update_audit_templates_updated_at ON audit_templates;
CREATE TRIGGER update_audit_templates_updated_at
    BEFORE UPDATE ON audit_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO template_categories (name, description, icon, color, sort_order) VALUES
  ('Merchandising', 'Product placement and visibility audits', 'package', '#3B82F6', 1),
  ('Quality Control', 'Product quality and compliance checks', 'shield-check', '#10B981', 2),
  ('Competitor Analysis', 'Competitive landscape assessment', 'trending-up', '#F59E0B', 3),
  ('Stock Management', 'Inventory and stock level monitoring', 'archive', '#8B5CF6', 4),
  ('Pricing', 'Price compliance and competitive pricing', 'dollar-sign', '#EF4444', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample templates
INSERT INTO audit_templates (name, description, category_id, sections, is_published) VALUES
  (
    'Basic Retail Audit',
    'A comprehensive retail execution audit template covering all key areas',
    (SELECT category_id FROM template_categories WHERE name = 'Merchandising' LIMIT 1),
    '[
      {
        "section_id": "availability",
        "title": "Product Availability",
        "description": "Check product availability and stock levels",
        "order_index": 1,
        "questions": [
          {
            "question_id": "q1",
            "text": "Is our product available on the shelf?",
            "type": "single_choice",
            "options": ["Yes", "No"],
            "validation": {"mandatory": true}
          },
          {
            "question_id": "q2",
            "text": "Estimate the stock quantity on display",
            "type": "numeric",
            "validation": {"mandatory": true, "min_value": 0}
          }
        ]
      },
      {
        "section_id": "visibility",
        "title": "Shelf Visibility",
        "description": "Assess product placement and visibility",
        "order_index": 2,
        "questions": [
          {
            "question_id": "q3",
            "text": "Is the product placed at eye level?",
            "type": "single_choice",
            "options": ["Yes", "No"],
            "validation": {"mandatory": true}
          }
        ]
      }
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;