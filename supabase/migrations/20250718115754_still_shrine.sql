/*
  # Templates CRUD System

  1. New Tables
    - `templates` - Core template storage
    - `template_sections` - Template sections
    - `template_questions` - Questions within sections
    - `template_categories` - Template categorization

  2. Features
    - Full CRUD operations
    - Real-time subscriptions
    - Conditional logic support
    - Version control

  3. Security
    - Enable RLS on all tables
    - User-based access control
*/

-- Create template_categories table
CREATE TABLE IF NOT EXISTS template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar UNIQUE NOT NULL,
  description text,
  icon varchar,
  color varchar DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  description text,
  category_id uuid REFERENCES template_categories(id),
  version integer DEFAULT 1,
  conditional_logic jsonb DEFAULT '{}',
  scoring_rules jsonb DEFAULT '{}',
  validation_rules jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- Create template_sections table
CREATE TABLE IF NOT EXISTS template_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template_questions table
CREATE TABLE IF NOT EXISTS template_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES template_sections(id) ON DELETE CASCADE,
  text varchar NOT NULL,
  type varchar NOT NULL CHECK (type IN ('text', 'numeric', 'single_choice', 'multiple_choice', 'dropdown', 'date', 'file_upload', 'barcode')),
  options jsonb DEFAULT '[]',
  validation jsonb DEFAULT '{}',
  conditional_logic jsonb DEFAULT '{}',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default categories
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
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_categories
CREATE POLICY "Anyone can view categories" ON template_categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON template_categories
  FOR ALL TO authenticated USING (true);

-- RLS Policies for templates
CREATE POLICY "Users can view published templates or own templates" ON templates
  FOR SELECT TO authenticated USING (
    is_published = true OR created_by = auth.uid()
  );

CREATE POLICY "Users can create templates" ON templates
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- RLS Policies for template_sections
CREATE POLICY "Users can view sections of accessible templates" ON template_sections
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE id = template_sections.template_id 
      AND (is_published = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage sections of own templates" ON template_sections
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE id = template_sections.template_id 
      AND created_by = auth.uid()
    )
  );

-- RLS Policies for template_questions
CREATE POLICY "Users can view questions of accessible templates" ON template_questions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN templates t ON t.id = ts.template_id
      WHERE ts.id = template_questions.section_id 
      AND (t.is_published = true OR t.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage questions of own templates" ON template_questions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN templates t ON t.id = ts.template_id
      WHERE ts.id = template_questions.section_id 
      AND t.created_by = auth.uid()
    )
  );

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE templates;
ALTER PUBLICATION supabase_realtime ADD TABLE template_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE template_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE template_categories;

-- Create indexes for performance
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_published ON templates(is_published);
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_template_sections_template ON template_sections(template_id);
CREATE INDEX idx_template_questions_section ON template_questions(section_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_sections_updated_at 
  BEFORE UPDATE ON template_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_questions_updated_at 
  BEFORE UPDATE ON template_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_categories_updated_at 
  BEFORE UPDATE ON template_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();