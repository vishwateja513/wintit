/*
  # Create Storage Buckets for File Management

  This migration creates storage buckets for:
  - Audit photos and evidence
  - User avatars
  - Product images
  - Report exports
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('audit-photos', 'audit-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
('report-exports', 'report-exports', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies

-- Audit Photos Policies
CREATE POLICY "Authenticated users can upload audit photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'audit-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view audit photos for their audits" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'audit-photos' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor', 'manager')
      )
    )
  );

CREATE POLICY "Users can update their audit photos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'audit-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their audit photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'audit-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- User Avatars Policies
CREATE POLICY "Anyone can view user avatars" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Product Images Policies
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Admins can manage product images" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Report Exports Policies
CREATE POLICY "Users can access their report exports" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'report-exports' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'supervisor', 'manager')
      )
    )
  );

CREATE POLICY "Users can upload report exports" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'report-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their report exports" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'report-exports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );