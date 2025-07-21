@@ .. @@
 -- Create trigger function to automatically create user profile
 CREATE OR REPLACE FUNCTION handle_new_user()
 RETURNS trigger AS $$
 BEGIN
   INSERT INTO public.user_profiles (user_id, name, role)
   VALUES (
     NEW.id,
     COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
     'auditor'
   );
   RETURN NEW;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;

+-- Drop trigger if it exists
+DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
+
 -- Create trigger to automatically create user profile on signup
 CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION handle_new_user();