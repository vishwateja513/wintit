/*
  # Authentication and Real-time Setup

  1. Enable real-time for templates
  2. Create demo user and profile
  3. Set up proper RLS policies
  4. Enable real-time subscriptions
*/

-- Enable real-time for audit_templates table
ALTER PUBLICATION supabase_realtime ADD TABLE audit_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE template_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- Create a demo user profile (this will be created when user signs up)
-- The actual user will be created through Supabase Auth

-- Update RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view published templates" ON audit_templates;
CREATE POLICY "Users can view published templates" ON audit_templates
  FOR SELECT TO authenticated 
  USING (is_published = true OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create templates" ON audit_templates;
CREATE POLICY "Users can create templates" ON audit_templates
  FOR INSERT TO authenticated 
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own templates" ON audit_templates;
CREATE POLICY "Users can update own templates" ON audit_templates
  FOR UPDATE TO authenticated 
  USING (created_by = auth.uid());

-- Allow users to delete their own templates
CREATE POLICY "Users can delete own templates" ON audit_templates
  FOR DELETE TO authenticated 
  USING (created_by = auth.uid());

-- Ensure user_profiles can be created on signup
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'auditor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert some sample template categories if they don't exist
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